import { NextRequest, NextResponse } from 'next/server'
import { db, generationTasks, keywordPlans, websites, articles } from '@/lib/db'
import { desc, eq, and } from 'drizzle-orm'

// 获取生成任务列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const websiteId = searchParams.get('websiteId')
    const status = searchParams.get('status')

    const offset = (page - 1) * limit

    let whereConditions = []

    if (websiteId) {
      whereConditions.push(eq(generationTasks.websiteId, websiteId))
    }

    if (status) {
      whereConditions.push(eq(generationTasks.status, status))
    }

    const tasksData = await db
      .select({
        id: generationTasks.id,
        type: generationTasks.type,
        status: generationTasks.status,
        model: generationTasks.model,
        tokensUsed: generationTasks.tokensUsed,
        errorMessage: generationTasks.errorMessage,
        startedAt: generationTasks.startedAt,
        completedAt: generationTasks.completedAt,
        createdAt: generationTasks.createdAt,
        website: {
          id: websites.id,
          name: websites.name,
          domain: websites.domain
        },
        keywordPlan: {
          id: keywordPlans.id,
          keyword: keywordPlans.keyword
        },
        article: {
          id: articles.id,
          title: articles.title
        }
      })
      .from(generationTasks)
      .leftJoin(websites, eq(generationTasks.websiteId, websites.id))
      .leftJoin(keywordPlans, eq(generationTasks.keywordPlanId, keywordPlans.id))
      .leftJoin(articles, eq(generationTasks.articleId, articles.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(generationTasks.createdAt))
      .limit(limit)
      .offset(offset)

    const totalQuery = await db
      .select({ id: generationTasks.id })
      .from(generationTasks)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)

    const total = totalQuery.length

    return NextResponse.json({
      success: true,
      data: {
        tasks: tasksData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取生成任务列表失败:', error)
    return NextResponse.json({ success: false, message: '获取生成任务列表失败' }, { status: 500 })
  }
}

// 创建新的生成任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { websiteId, keywordPlanId, type = 'manual', model = 'gpt-3.5-turbo', temperature = '0.7', prompt } = body

    if (!websiteId) {
      return NextResponse.json({ success: false, message: '网站ID不能为空' }, { status: 400 })
    }

    // 验证网站是否存在
    const website = await db.select({ id: websites.id }).from(websites).where(eq(websites.id, websiteId)).limit(1)
    if (website.length === 0) {
      return NextResponse.json({ success: false, message: '网站不存在' }, { status: 400 })
    }

    // 如果指定了关键词计划，验证是否存在
    if (keywordPlanId) {
      const keywordPlan = await db
        .select({ id: keywordPlans.id })
        .from(keywordPlans)
        .where(and(eq(keywordPlans.id, keywordPlanId), eq(keywordPlans.websiteId, websiteId)))
        .limit(1)
      if (keywordPlan.length === 0) {
        return NextResponse.json({ success: false, message: '关键词计划不存在或不属于该网站' }, { status: 400 })
      }
    }

    const [newTask] = await db
      .insert(generationTasks)
      .values({
        websiteId,
        keywordPlanId: keywordPlanId || null,
        type,
        model,
        temperature,
        prompt
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newTask,
      message: '生成任务创建成功'
    })
  } catch (error) {
    console.error('创建生成任务失败:', error)
    return NextResponse.json({ success: false, message: '创建生成任务失败' }, { status: 500 })
  }
}
