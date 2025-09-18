import { NextRequest, NextResponse } from 'next/server'
import { db, websites, keywordPlans, articles, generationTasks } from '@/lib/db'
import { eq, and, lte, isNull, or } from 'drizzle-orm'
import { generateSlug, extractExcerpt } from '@/lib/utils'

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
          .select({ count: generationTasks.id })
          .from(generationTasks)
          .where(and(eq(generationTasks.websiteId, website.id), eq(generationTasks.status, 'completed'), lte(generationTasks.completedAt, tomorrow.toISOString()), lte(today.toISOString(), generationTasks.completedAt)))

        const generatedToday = todayGeneratedCount.length

        if (generatedToday >= website.maxArticlesPerDay) {
          console.log(`网站 ${website.name} 今日已达到最大生成数量 (${generatedToday}/${website.maxArticlesPerDay})`)
          continue
        }

        // 3. 获取待生成的关键词（优先级高的优先）
        const remainingSlots = website.maxArticlesPerDay - generatedToday
        const pendingKeywords = await db
          .select()
          .from(keywordPlans)
          .where(and(eq(keywordPlans.websiteId, website.id), eq(keywordPlans.status, 'pending'), isNull(keywordPlans.articleId)))
          .orderBy(keywordPlans.priority, keywordPlans.createdAt)
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
            const generatedContent = await generateArticleContent(keywordPlan.keyword, keywordPlan)

            if (generatedContent.success) {
              // 6. 创建文章记录
              const slug = generateSlug(generatedContent.title)
              const excerpt = extractExcerpt(generatedContent.content)

              const [newArticle] = await db
                .insert(articles)
                .values({
                  title: generatedContent.title,
                  slug,
                  content: generatedContent.content,
                  excerpt,
                  categoryId: keywordPlan.categoryId,
                  status: 'published', // 自动发布
                  seoTitle: generatedContent.seoTitle || generatedContent.title,
                  seoDescription: generatedContent.seoDescription || excerpt,
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
                    tokensUsed: generatedContent.tokensUsed || 0,
                    completedAt: new Date()
                  })
                  .where(eq(generationTasks.id, task.id))
              ])

              totalGenerated++
              console.log(`✅ 成功生成文章: ${generatedContent.title}`)
            } else {
              // 生成失败，更新状态
              await Promise.all([
                db
                  .update(keywordPlans)
                  .set({
                    status: 'failed',
                    failureReason: generatedContent.error
                  })
                  .where(eq(keywordPlans.id, keywordPlan.id)),

                db
                  .update(generationTasks)
                  .set({
                    status: 'failed',
                    errorMessage: generatedContent.error,
                    completedAt: new Date()
                  })
                  .where(eq(generationTasks.id, task.id))
              ])

              console.log(`❌ 生成失败: ${keywordPlan.keyword} - ${generatedContent.error}`)
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

// AI文章生成函数（模拟）
async function generateArticleContent(keyword: string, keywordPlan: any) {
  try {
    // 这里你可以集成真实的AI服务，比如OpenAI GPT
    // 现在先返回模拟内容

    // 模拟AI调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟生成的文章内容
    const title = `${keyword} - 完整指南与最佳实践`
    const content = `# ${title}

## 引言

在当今数字化时代，了解"${keyword}"变得越来越重要。本文将为您提供关于${keyword}的全面指南，帮助您掌握相关知识和技能。

## 什么是${keyword}？

${keyword}是一个重要的概念，它在现代生活中扮演着关键角色。通过深入了解${keyword}，您可以更好地应用这些知识来改善您的工作和生活。

## ${keyword}的重要性

1. **提高效率**: 正确理解${keyword}可以显著提高工作效率
2. **降低成本**: 合理运用${keyword}有助于控制成本
3. **增强竞争力**: 掌握${keyword}相关技能可以提升个人或企业竞争力

## 实施${keyword}的最佳实践

### 1. 制定明确的目标
在开始实施${keyword}之前，确保您有明确的目标和期望结果。

### 2. 选择合适的工具
市场上有许多与${keyword}相关的工具，选择最适合您需求的工具非常重要。

### 3. 持续学习和改进
${keyword}是一个不断发展的领域，保持学习和更新知识至关重要。

## 常见问题解答

**Q: 如何开始学习${keyword}？**
A: 建议从基础概念开始，逐步深入学习更高级的主题。

**Q: ${keyword}需要什么技能？**
A: 具体技能要求取决于应用领域，但基本的分析和问题解决能力是必需的。

## 结论

${keyword}是一个值得深入学习的重要主题。通过本文的介绍，希望您对${keyword}有了更清晰的认识。记住，实践是掌握${keyword}的最佳方式。

---

*本文由AI自动生成，内容仅供参考。*`

    const seoTitle = `${keyword} - 2024年最新指南`
    const seoDescription = `了解${keyword}的完整指南，包括最佳实践、实施步骤和常见问题解答。提升您的${keyword}技能。`

    return {
      success: true,
      title,
      content,
      seoTitle,
      seoDescription,
      tokensUsed: 1500 // 模拟token使用量
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成失败'
    }
  }
}

// 手动触发接口（供管理页面调用）
export async function GET() {
  return NextResponse.json({
    success: true,
    message: '请使用POST方法触发生成任务'
  })
}
