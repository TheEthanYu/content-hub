import { NextRequest, NextResponse } from 'next/server'
import { db, categories, websites } from '@/lib/db'
import { desc, eq, and } from 'drizzle-orm'

// 获取公开的分类列表（供其他网站调用）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const websiteDomain = searchParams.get('domain')
    const websiteId = searchParams.get('websiteId')

    let categoriesData

    if (websiteDomain) {
      // 按网站域名筛选
      categoriesData = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          color: categories.color,
          website: {
            id: websites.id,
            name: websites.name,
            domain: websites.domain
          }
        })
        .from(categories)
        .leftJoin(websites, eq(categories.websiteId, websites.id))
        .where(eq(websites.domain, websiteDomain))
        .orderBy(desc(categories.createdAt))
    } else if (websiteId) {
      // 按网站ID筛选
      categoriesData = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          color: categories.color,
          website: {
            id: websites.id,
            name: websites.name,
            domain: websites.domain
          }
        })
        .from(categories)
        .leftJoin(websites, eq(categories.websiteId, websites.id))
        .where(eq(categories.websiteId, websiteId))
        .orderBy(desc(categories.createdAt))
    } else {
      // 获取所有分类
      categoriesData = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          color: categories.color,
          website: {
            id: websites.id,
            name: websites.name,
            domain: websites.domain
          }
        })
        .from(categories)
        .leftJoin(websites, eq(categories.websiteId, websites.id))
        .orderBy(desc(categories.createdAt))
    }

    return NextResponse.json({
      success: true,
      data: categoriesData
    })
  } catch (error) {
    console.error('获取公开分类列表失败:', error)
    return NextResponse.json({ success: false, message: '获取分类列表失败' }, { status: 500 })
  }
}
