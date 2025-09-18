import { NextRequest, NextResponse } from 'next/server'
import { db, keywordPlans, websites, categories } from '@/lib/db'
import { eq } from 'drizzle-orm'

// 获取单个关键词计划
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const keywordPlanData = await db
      .select({
        id: keywordPlans.id,
        keyword: keywordPlans.keyword,
        keywordHash: keywordPlans.keywordHash,
        searchVolume: keywordPlans.searchVolume,
        difficulty: keywordPlans.difficulty,
        cpc: keywordPlans.cpc,
        competition: keywordPlans.competition,
        trend: keywordPlans.trend,
        status: keywordPlans.status,
        priority: keywordPlans.priority,
        articleId: keywordPlans.articleId,
        generatedAt: keywordPlans.generatedAt,
        failureReason: keywordPlans.failureReason,
        importSource: keywordPlans.importSource,
        importBatch: keywordPlans.importBatch,
        createdAt: keywordPlans.createdAt,
        updatedAt: keywordPlans.updatedAt,
        website: {
          id: websites.id,
          name: websites.name,
          domain: websites.domain
        },
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color
        }
      })
      .from(keywordPlans)
      .leftJoin(websites, eq(keywordPlans.websiteId, websites.id))
      .leftJoin(categories, eq(keywordPlans.categoryId, categories.id))
      .where(eq(keywordPlans.id, params.id))
      .limit(1)

    if (keywordPlanData.length === 0) {
      return NextResponse.json({ success: false, message: '关键词计划不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: keywordPlanData[0]
    })
  } catch (error) {
    console.error('获取关键词计划失败:', error)
    return NextResponse.json({ success: false, message: '获取关键词计划失败' }, { status: 500 })
  }
}

// 更新关键词计划
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { categoryId, searchVolume, difficulty, cpc, competition, trend, status, priority, failureReason } = body

    const updateData: any = {
      updatedAt: new Date()
    }

    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (searchVolume !== undefined) updateData.searchVolume = searchVolume
    if (difficulty !== undefined) updateData.difficulty = difficulty
    if (cpc !== undefined) updateData.cpc = cpc
    if (competition !== undefined) updateData.competition = competition
    if (trend !== undefined) updateData.trend = trend
    if (status !== undefined) {
      updateData.status = status
      if (status === 'generated') {
        updateData.generatedAt = new Date()
      }
    }
    if (priority !== undefined) updateData.priority = priority
    if (failureReason !== undefined) updateData.failureReason = failureReason

    const [updatedKeywordPlan] = await db.update(keywordPlans).set(updateData).where(eq(keywordPlans.id, params.id)).returning()

    if (!updatedKeywordPlan) {
      return NextResponse.json({ success: false, message: '关键词计划不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedKeywordPlan,
      message: '关键词计划更新成功'
    })
  } catch (error) {
    console.error('更新关键词计划失败:', error)
    return NextResponse.json({ success: false, message: '更新关键词计划失败' }, { status: 500 })
  }
}

// 删除关键词计划
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [deletedKeywordPlan] = await db.delete(keywordPlans).where(eq(keywordPlans.id, params.id)).returning({ id: keywordPlans.id })

    if (!deletedKeywordPlan) {
      return NextResponse.json({ success: false, message: '关键词计划不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: '关键词计划删除成功'
    })
  } catch (error) {
    console.error('删除关键词计划失败:', error)
    return NextResponse.json({ success: false, message: '删除关键词计划失败' }, { status: 500 })
  }
}
