import { NextRequest, NextResponse } from 'next/server'
import { db, categories } from '@/lib/db'
import { desc, eq } from 'drizzle-orm'
import { generateSlug } from '@/lib/utils'

// 获取分类列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const websiteId = searchParams.get('websiteId')

    let query = db.select().from(categories).orderBy(desc(categories.createdAt))

    // 如果指定了网站ID，只返回该网站的分类
    if (websiteId) {
      query = db.select().from(categories).where(eq(categories.websiteId, websiteId)).orderBy(desc(categories.createdAt))
    }

    const categoriesData = await query

    return NextResponse.json({
      success: true,
      data: categoriesData
    })
  } catch (error) {
    console.error('获取分类列表失败:', error)
    return NextResponse.json({ success: false, message: '获取分类列表失败' }, { status: 500 })
  }
}

// 创建新分类
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, color, websiteId } = body

    if (!name) {
      return NextResponse.json({ success: false, message: '分类名称不能为空' }, { status: 400 })
    }

    if (!websiteId) {
      return NextResponse.json({ success: false, message: '网站ID不能为空' }, { status: 400 })
    }

    const slug = generateSlug(name)

    // 检查同一网站内是否已存在相同slug的分类
    const existingCategory = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1)

    if (existingCategory.length > 0) {
      return NextResponse.json({ success: false, message: '分类名称已存在' }, { status: 400 })
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        websiteId,
        name,
        slug,
        description,
        color: color || '#3B82F6'
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newCategory,
      message: '分类创建成功'
    })
  } catch (error) {
    console.error('创建分类失败:', error)
    return NextResponse.json({ success: false, message: '创建分类失败' }, { status: 500 })
  }
}
