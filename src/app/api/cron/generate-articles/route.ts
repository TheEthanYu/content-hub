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
      .orderBy(asc(websites.createdAt)) // 按创建时间排序，确保轮转顺序一致

    if (activeWebsites.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有启用自动生成的网站',
        data: { processed: 0, generated: 0 }
      })
    }

    // 2. 轮转逻辑：根据当前时间计算应该处理哪个网站
    const now = new Date()
    const minutesSinceHour = now.getMinutes()
    const websiteIndex = Math.floor(minutesSinceHour / 30) % activeWebsites.length
    const currentWebsite = activeWebsites[websiteIndex]

    console.log(`轮转选择网站: ${currentWebsite.name} (${currentWebsite.domain}) - 索引: ${websiteIndex}/${activeWebsites.length}`)

    let totalProcessed = 0
    let totalGenerated = 0
    const results = []

    // 3. 只处理当前轮转到的网站
    try {
      console.log(`处理网站: ${currentWebsite.name} (${currentWebsite.domain})`)

      // 检查今天已生成的文章数量
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayGeneratedCount = await db
        .select({ count: count(generationTasks.id) })
        .from(generationTasks)
        .where(and(eq(generationTasks.websiteId, currentWebsite.id), eq(generationTasks.status, 'completed'), gte(generationTasks.completedAt, today), lte(generationTasks.completedAt, tomorrow)))

      const generatedToday = todayGeneratedCount[0]?.count || 0

      const maxArticlesPerDay = currentWebsite.maxArticlesPerDay || 5 // 默认值
      if (generatedToday >= maxArticlesPerDay) {
        console.log(`网站 ${currentWebsite.name} 今日已达到最大生成数量 (${generatedToday}/${maxArticlesPerDay})`)
        return NextResponse.json({
          success: true,
          message: `网站 ${currentWebsite.name} 今日已达到最大生成数量`,
          data: { processed: 0, generated: 0, website: currentWebsite.name }
        })
      }

      // 4. 获取待生成的关键词（优先级高的优先）
      // 每次轮转只生成1篇文章，避免AI调用过于频繁
      const pendingKeywords = await db
        .select()
        .from(keywordPlans)
        .where(and(eq(keywordPlans.websiteId, currentWebsite.id), eq(keywordPlans.status, 'pending'), isNull(keywordPlans.articleId)))
        .orderBy(desc(keywordPlans.priority), asc(keywordPlans.createdAt))
        .limit(1) // 每次只处理1个关键词

      console.log(`网站 ${currentWebsite.name} 找到 ${pendingKeywords.length} 个待生成关键词`)

      if (pendingKeywords.length === 0) {
        return NextResponse.json({
          success: true,
          message: `网站 ${currentWebsite.name} 没有待生成的关键词`,
          data: { processed: 0, generated: 0, website: currentWebsite.name }
        })
      }

      // 5. 为关键词生成文章
      for (const keywordPlan of pendingKeywords) {
          try {
            totalProcessed++

            // 创建生成任务记录
            const [task] = await db
              .insert(generationTasks)
              .values({
                websiteId: currentWebsite.id,
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

            // 6. 调用AI生成文章内容
            const aiResponse = await generateArticleWithAI(keywordPlan.keyword, keywordPlan.searchVolume || undefined, keywordPlan.difficulty || undefined, keywordPlan.competition || undefined, {
              name: currentWebsite.name,
              domain: currentWebsite.domain,
              description: currentWebsite.description || undefined
            })

            if (aiResponse.success && aiResponse.data) {
              // 7. 创建文章记录
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

              // 8. 更新关键词计划和生成任务
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
          website: currentWebsite.name,
          processed: pendingKeywords.length,
          generated: totalGenerated
        })
      } catch (error) {
        console.error(`处理网站 "${currentWebsite.name}" 时出错:`, error)
        return NextResponse.json({
          success: false,
          message: `处理网站 "${currentWebsite.name}" 时出错: ${error instanceof Error ? error.message : '未知错误'}`,
          data: { processed: 0, generated: 0, website: currentWebsite.name }
        }, { status: 500 })
      }
    }

    console.log(`✅ 任务完成: 处理 ${totalProcessed} 个关键词，生成 ${totalGenerated} 篇文章`)

    return NextResponse.json({
      success: true,
      message: `成功处理 ${totalProcessed} 个关键词，生成 ${totalGenerated} 篇文章`,
      data: {
        processed: totalProcessed,
        generated: totalGenerated,
        website: currentWebsite.name,
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
