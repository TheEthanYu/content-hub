import { NextRequest, NextResponse } from 'next/server'
import { db, articles, categories } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { generateSlug, extractExcerpt } from '@/lib/utils'

// 获取单个文章
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
        status: articles.status,
        publishedAt: articles.publishedAt,
        viewCount: articles.viewCount,
        autoPublish: articles.autoPublish,
        publishedSites: articles.publishedSites,
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
      .where(eq(articles.id, params.id))
      .limit(1)

    if (articleData.length === 0) {
      return NextResponse.json({ success: false, message: '文章不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: articleData[0]
    })
  } catch (error) {
    console.error('获取文章失败:', error)
    return NextResponse.json({ success: false, message: '获取文章失败' }, { status: 500 })
  }
}

// 更新文章
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, content, categoryId, status, seoTitle, seoDescription, seoKeywords, featuredImage, autoPublish } = body

    const updateData: any = {
      updatedAt: new Date()
    }

    if (title) {
      updateData.title = title
      updateData.slug = generateSlug(title)
    }

    if (content) {
      updateData.content = content
      updateData.excerpt = extractExcerpt(content)
    }

    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (status !== undefined) {
      updateData.status = status
      if (status === 'published' && !updateData.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage
    if (autoPublish !== undefined) updateData.autoPublish = autoPublish

    const [updatedArticle] = await db.update(articles).set(updateData).where(eq(articles.id, params.id)).returning()

    if (!updatedArticle) {
      return NextResponse.json({ success: false, message: '文章不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedArticle,
      message: '文章更新成功'
    })
  } catch (error) {
    console.error('更新文章失败:', error)
    return NextResponse.json({ success: false, message: '更新文章失败' }, { status: 500 })
  }
}

// 删除文章
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [deletedArticle] = await db.delete(articles).where(eq(articles.id, params.id)).returning({ id: articles.id })

    if (!deletedArticle) {
      return NextResponse.json({ success: false, message: '文章不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: '文章删除成功'
    })
  } catch (error) {
    console.error('删除文章失败:', error)
    return NextResponse.json({ success: false, message: '删除文章失败' }, { status: 500 })
  }
}
