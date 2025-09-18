import { NextRequest, NextResponse } from 'next/server'
import { db, articles, categories } from '@/lib/db'
import { desc, eq, like, or } from 'drizzle-orm'
import { generateSlug, extractExcerpt } from '@/lib/utils'

// 获取文章列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    let whereConditions = []

    // 状态筛选
    if (status) {
      whereConditions.push(eq(articles.status, status))
    }

    // 分类筛选
    if (categoryId) {
      whereConditions.push(eq(articles.categoryId, categoryId))
    }

    // 搜索筛选
    if (search) {
      whereConditions.push(or(like(articles.title, `%${search}%`), like(articles.content, `%${search}%`)))
    }

    // 构建查询
    const articlesData = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        featuredImage: articles.featuredImage,
        status: articles.status,
        publishedAt: articles.publishedAt,
        viewCount: articles.viewCount,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          color: categories.color
        }
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(whereConditions.length > 0 ? whereConditions.reduce((a, b) => eq(a, b)) : undefined)
      .orderBy(desc(articles.createdAt))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalQuery = await db
      .select({ count: articles.id })
      .from(articles)
      .where(whereConditions.length > 0 ? whereConditions.reduce((a, b) => eq(a, b)) : undefined)

    const total = totalQuery.length

    return NextResponse.json({
      success: true,
      data: {
        articles: articlesData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取文章列表失败:', error)
    return NextResponse.json({ success: false, message: '获取文章列表失败' }, { status: 500 })
  }
}

// 创建新文章
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, categoryId, status, seoTitle, seoDescription, seoKeywords, featuredImage } = body

    if (!title || !content) {
      return NextResponse.json({ success: false, message: '标题和内容不能为空' }, { status: 400 })
    }

    const slug = generateSlug(title)
    const excerpt = extractExcerpt(content)

    const [newArticle] = await db
      .insert(articles)
      .values({
        title,
        slug,
        content,
        excerpt,
        categoryId: categoryId || null,
        status: status || 'draft',
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt,
        seoKeywords,
        featuredImage,
        publishedAt: status === 'published' ? new Date() : null
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newArticle,
      message: '文章创建成功'
    })
  } catch (error) {
    console.error('创建文章失败:', error)
    return NextResponse.json({ success: false, message: '创建文章失败' }, { status: 500 })
  }
}
