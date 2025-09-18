import { NextRequest, NextResponse } from 'next/server'
import { db, websites, keywordPlans, articles, generationTasks } from '@/lib/db'
import { eq, and, lte, gte, isNull, or, count, desc, asc } from 'drizzle-orm'
import { generateSlug, extractExcerpt } from '@/lib/utils'
import { generateArticleWithAI } from '@/lib/ai'

// Vercel Cron Job 端点 - 自动生成文章
export async function POST(request: NextRequest) {
  try {
    // 验证请求来源（可选：添加认证）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, message: '未授权的请求' }, { status: 401 })
    }

    console.log('开始执行自动文章生成任务...')

    // 1. 获取启用自动生成的网站
    const activeWebsites = await db
      .select()
      .from(websites)
      .where(and(eq(websites.isActive, true), eq(websites.autoGenerateEnabled, true)))

    if (activeWebsites.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有启用自动生成的网站',
        data: { processed: 0, generated: 0 }
      })
    }

    let totalProcessed = 0
    let totalGenerated = 0
    const results = []

    // 2. 为每个网站处理关键词
    for (const website of activeWebsites) {
      try {
        console.log(`处理网站: ${website.name} (${website.domain})`)

        // 检查今天已生成的文章数量
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const todayGeneratedCount = await db
          .select({ count: count(generationTasks.id) })
          .from(generationTasks)
          .where(and(eq(generationTasks.websiteId, website.id), eq(generationTasks.status, 'completed'), gte(generationTasks.completedAt, today), lte(generationTasks.completedAt, tomorrow)))

        const generatedToday = todayGeneratedCount[0]?.count || 0

        const maxArticlesPerDay = website.maxArticlesPerDay || 5 // 默认值
        if (generatedToday >= maxArticlesPerDay) {
          console.log(`网站 ${website.name} 今日已达到最大生成数量 (${generatedToday}/${maxArticlesPerDay})`)
          continue
        }

        // 3. 获取待生成的关键词（优先级高的优先）
        const remainingSlots = maxArticlesPerDay - generatedToday
        const pendingKeywords = await db
          .select()
          .from(keywordPlans)
          .where(and(eq(keywordPlans.websiteId, website.id), eq(keywordPlans.status, 'pending'), isNull(keywordPlans.articleId)))
          .orderBy(desc(keywordPlans.priority), asc(keywordPlans.createdAt))
          .limit(remainingSlots)

        console.log(`网站 ${website.name} 找到 ${pendingKeywords.length} 个待生成关键词`)

        // 4. 为每个关键词生成文章
        for (const keywordPlan of pendingKeywords) {
          try {
            totalProcessed++

            // 创建生成任务记录
            const [task] = await db
              .insert(generationTasks)
              .values({
                websiteId: website.id,
                keywordPlanId: keywordPlan.id,
                type: 'auto',
                status: 'processing',
                model: 'gpt-3.5-turbo',
                temperature: '0.7',
                prompt: `请根据关键词"${keywordPlan.keyword}"写一篇SEO友好的文章。文章应该包含有价值的信息，结构清晰，并且自然地包含这个关键词。`,
                startedAt: new Date()
              })
              .returning()

            // 更新关键词状态
            await db.update(keywordPlans).set({ status: 'processing' }).where(eq(keywordPlans.id, keywordPlan.id))

            // 5. 调用AI生成文章内容
            const aiResponse = await generateArticleWithAI(keywordPlan.keyword, keywordPlan.searchVolume || undefined, keywordPlan.difficulty || undefined, keywordPlan.competition || undefined, {
              name: website.name,
              domain: website.domain,
              description: website.description || undefined
            })

            if (aiResponse.success && aiResponse.data) {
              // 6. 创建文章记录
              const slug = generateSlug(aiResponse.data.title)
              const excerpt = extractExcerpt(aiResponse.data.content)

              const [newArticle] = await db
                .insert(articles)
                .values({
                  title: aiResponse.data.title,
                  slug,
                  content: aiResponse.data.content,
                  excerpt,
                  categoryId: keywordPlan.categoryId,
                  status: 'published', // 自动发布
                  seoTitle: aiResponse.data.seoTitle,
                  seoDescription: aiResponse.data.seoDescription,
                  seoKeywords: keywordPlan.keyword,
                  publishedAt: new Date()
                })
                .returning()

              // 7. 更新关键词计划和生成任务
              await Promise.all([
                db
                  .update(keywordPlans)
                  .set({
                    status: 'generated',
                    articleId: newArticle.id,
                    generatedAt: new Date()
                  })
                  .where(eq(keywordPlans.id, keywordPlan.id)),

                db
                  .update(generationTasks)
                  .set({
                    status: 'completed',
                    articleId: newArticle.id,
                    tokensUsed: aiResponse.data.tokensUsed,
                    completedAt: new Date()
                  })
                  .where(eq(generationTasks.id, task.id))
              ])

              totalGenerated++
              console.log(`✅ 成功生成文章: ${aiResponse.data.title}`)
            } else {
              // 生成失败，更新状态
              await Promise.all([
                db
                  .update(keywordPlans)
                  .set({
                    status: 'failed',
                    failureReason: aiResponse.error || '未知错误'
                  })
                  .where(eq(keywordPlans.id, keywordPlan.id)),

                db
                  .update(generationTasks)
                  .set({
                    status: 'failed',
                    errorMessage: aiResponse.error || '未知错误',
                    completedAt: new Date()
                  })
                  .where(eq(generationTasks.id, task.id))
              ])

              console.log(`❌ 生成失败: ${keywordPlan.keyword} - ${aiResponse.error}`)
            }
          } catch (error) {
            console.error(`处理关键词 "${keywordPlan.keyword}" 时出错:`, error)

            // 更新为失败状态
            await db
              .update(keywordPlans)
              .set({
                status: 'failed',
                failureReason: error instanceof Error ? error.message : '未知错误'
              })
              .where(eq(keywordPlans.id, keywordPlan.id))
          }
        }

        results.push({
          website: website.name,
          processed: pendingKeywords.length,
          generated: pendingKeywords.length // 简化统计，实际应该统计成功数量
        })
      } catch (error) {
        console.error(`处理网站 "${website.name}" 时出错:`, error)
        results.push({
          website: website.name,
          error: error instanceof Error ? error.message : '未知错误'
        })
      }
    }

    console.log(`✅ 任务完成: 处理 ${totalProcessed} 个关键词，生成 ${totalGenerated} 篇文章`)

    return NextResponse.json({
      success: true,
      message: `成功处理 ${totalProcessed} 个关键词，生成 ${totalGenerated} 篇文章`,
      data: {
        processed: totalProcessed,
        generated: totalGenerated,
        websites: results
      }
    })
  } catch (error) {
    console.error('自动生成任务执行失败:', error)
    return NextResponse.json(
      {
        success: false,
        message: '任务执行失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 手动触发接口（供管理页面调用）
export async function GET() {
  return NextResponse.json({
    success: true,
    message: '请使用POST方法触发生成任务'
  })
}
