import { NextRequest, NextResponse } from 'next/server'
import { db, keywordPlans, websites, categories } from '@/lib/db'
import { desc, eq, like, or, and } from 'drizzle-orm'
import { generateKeywordHash, normalizeKeyword, parseKeywordImport } from '@/lib/utils'

// 获取关键词计划列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const websiteId = searchParams.get('websiteId')
    const categoryId = searchParams.get('categoryId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    let whereConditions = []

    // 网站筛选
    if (websiteId) {
      whereConditions.push(eq(keywordPlans.websiteId, websiteId))
    }

    // 分类筛选
    if (categoryId) {
      whereConditions.push(eq(keywordPlans.categoryId, categoryId))
    }

    // 状态筛选
    if (status) {
      whereConditions.push(eq(keywordPlans.status, status))
    }

    // 搜索筛选
    if (search) {
      whereConditions.push(like(keywordPlans.keyword, `%${search}%`))
    }

    // 构建查询
    const keywordPlansData = await db
      .select({
        id: keywordPlans.id,
        keyword: keywordPlans.keyword,
        searchVolume: keywordPlans.searchVolume,
        difficulty: keywordPlans.difficulty,
        competition: keywordPlans.competition,
        status: keywordPlans.status,
        priority: keywordPlans.priority,
        generatedAt: keywordPlans.generatedAt,
        createdAt: keywordPlans.createdAt,
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
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(keywordPlans.createdAt))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalQuery = await db
      .select({ id: keywordPlans.id })
      .from(keywordPlans)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)

    const total = totalQuery.length

    return NextResponse.json({
      success: true,
      data: {
        keywordPlans: keywordPlansData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取关键词计划列表失败:', error)
    return NextResponse.json({ success: false, message: '获取关键词计划列表失败' }, { status: 500 })
  }
}

// 创建/导入关键词计划
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { websiteId, categoryId, keywords, importSource = 'manual', priority = 1 } = body

    if (!websiteId || !keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ success: false, message: '网站ID和关键词列表不能为空' }, { status: 400 })
    }

    // 验证网站是否存在
    const website = await db.select({ id: websites.id }).from(websites).where(eq(websites.id, websiteId)).limit(1)
    if (website.length === 0) {
      return NextResponse.json({ success: false, message: '网站不存在' }, { status: 400 })
    }

    // 如果指定了分类，验证分类是否存在且属于该网站
    if (categoryId) {
      const category = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.id, categoryId), eq(categories.websiteId, websiteId)))
        .limit(1)
      if (category.length === 0) {
        return NextResponse.json({ success: false, message: '分类不存在或不属于该网站' }, { status: 400 })
      }
    }

    const importBatch = `${importSource}-${Date.now()}`
    const newKeywordPlans = []
    const duplicates = []
    const errors = []

    for (const keyword of keywords) {
      try {
        const normalizedKeyword = normalizeKeyword(keyword)
        if (!normalizedKeyword) continue

        const keywordHash = generateKeywordHash(keyword, websiteId)

        // 检查是否已存在
        const existing = await db.select({ id: keywordPlans.id }).from(keywordPlans).where(eq(keywordPlans.keywordHash, keywordHash)).limit(1)

        if (existing.length > 0) {
          duplicates.push(keyword)
          continue
        }

        const [newPlan] = await db
          .insert(keywordPlans)
          .values({
            websiteId,
            categoryId: categoryId || null,
            keyword: keyword.trim(),
            keywordHash,
            priority,
            importSource,
            importBatch
          })
          .returning()

        newKeywordPlans.push(newPlan)
      } catch (error) {
        console.error(`处理关键词 "${keyword}" 失败:`, error)
        errors.push(keyword)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        created: newKeywordPlans.length,
        duplicates: duplicates.length,
        errors: errors.length,
        keywordPlans: newKeywordPlans
      },
      message: `成功导入 ${newKeywordPlans.length} 个关键词${duplicates.length > 0 ? `，跳过 ${duplicates.length} 个重复项` : ''}${errors.length > 0 ? `，${errors.length} 个处理失败` : ''}`
    })
  } catch (error) {
    console.error('创建关键词计划失败:', error)
    return NextResponse.json({ success: false, message: '创建关键词计划失败' }, { status: 500 })
  }
}

// 批量导入关键词（从文本或CSV）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { websiteId, categoryId, content, importSource = 'csv' } = body

    if (!websiteId || !content) {
      return NextResponse.json({ success: false, message: '网站ID和导入内容不能为空' }, { status: 400 })
    }

    // 解析关键词
    const keywords = parseKeywordImport(content)

    if (keywords.length === 0) {
      return NextResponse.json({ success: false, message: '没有解析到有效的关键词' }, { status: 400 })
    }

    // 调用创建接口
    const createResponse = await POST(
      new NextRequest(request.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          categoryId,
          keywords,
          importSource
        })
      })
    )

    return createResponse
  } catch (error) {
    console.error('批量导入关键词失败:', error)
    return NextResponse.json({ success: false, message: '批量导入关键词失败' }, { status: 500 })
  }
}
