import { NextRequest, NextResponse } from 'next/server'
import { db, articles, categories } from '@/lib/db'
import { desc, eq, and } from 'drizzle-orm'

// 公开的文章列表API（供其他网站调用）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const categorySlug = searchParams.get('category')

    const offset = (page - 1) * limit

    let whereConditions = [eq(articles.status, 'published')]

    // 按分类筛选
    if (categorySlug) {
      const category = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, categorySlug)).limit(1)

      if (category.length > 0) {
        whereConditions.push(eq(articles.categoryId, category[0].id))
      }
    }

    // 获取已发布的文章
    const articlesData = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        featuredImage: articles.featuredImage,
        seoTitle: articles.seoTitle,
        seoDescription: articles.seoDescription,
        seoKeywords: articles.seoKeywords,
        publishedAt: articles.publishedAt,
        viewCount: articles.viewCount,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          color: categories.color
        }
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(...whereConditions))
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalQuery = await db
      .select({ id: articles.id })
      .from(articles)
      .where(and(...whereConditions))

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
    console.error('获取公开文章列表失败:', error)
    return NextResponse.json({ success: false, message: '获取文章列表失败' }, { status: 500 })
  }
}
