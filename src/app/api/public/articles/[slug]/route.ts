import { NextRequest, NextResponse } from 'next/server'
import { db, articles, categories } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

// 获取单个公开文章（通过slug）
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const articleData = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        content: articles.content,
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
      .where(and(eq(articles.slug, params.slug), eq(articles.status, 'published')))
      .limit(1)

    if (articleData.length === 0) {
      return NextResponse.json({ success: false, message: '文章不存在或未发布' }, { status: 404 })
    }

    // 增加浏览量
    await db
      .update(articles)
      .set({
        viewCount: articleData[0].viewCount + 1,
        updatedAt: new Date()
      })
      .where(eq(articles.id, articleData[0].id))

    return NextResponse.json({
      success: true,
      data: {
        ...articleData[0],
        viewCount: articleData[0].viewCount + 1
      }
    })
  } catch (error) {
    console.error('获取文章失败:', error)
    return NextResponse.json({ success: false, message: '获取文章失败' }, { status: 500 })
  }
}
