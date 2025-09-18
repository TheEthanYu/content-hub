import { NextResponse } from 'next/server'
import { db, categories } from '@/lib/db'
import { desc } from 'drizzle-orm'

// 获取公开的分类列表（供其他网站调用）
export async function GET() {
  try {
    const categoriesData = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        color: categories.color
      })
      .from(categories)
      .orderBy(desc(categories.createdAt))

    return NextResponse.json({
      success: true,
      data: categoriesData
    })
  } catch (error) {
    console.error('获取公开分类列表失败:', error)
    return NextResponse.json({ success: false, message: '获取分类列表失败' }, { status: 500 })
  }
}
