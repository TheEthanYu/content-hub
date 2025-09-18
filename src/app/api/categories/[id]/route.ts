import { NextRequest, NextResponse } from 'next/server'
import { db, categories } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { generateSlug } from '@/lib/utils'

// 获取单个分类
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const categoryData = await db.select().from(categories).where(eq(categories.id, params.id)).limit(1)

    if (categoryData.length === 0) {
      return NextResponse.json({ success: false, message: '分类不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: categoryData[0]
    })
  } catch (error) {
    console.error('获取分类失败:', error)
    return NextResponse.json({ success: false, message: '获取分类失败' }, { status: 500 })
  }
}

// 更新分类
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, description, color } = body

    const updateData: any = {
      updatedAt: new Date()
    }

    if (name) {
      updateData.name = name
      updateData.slug = generateSlug(name)
    }
    if (description !== undefined) updateData.description = description
    if (color !== undefined) updateData.color = color

    const [updatedCategory] = await db.update(categories).set(updateData).where(eq(categories.id, params.id)).returning()

    if (!updatedCategory) {
      return NextResponse.json({ success: false, message: '分类不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: '分类更新成功'
    })
  } catch (error) {
    console.error('更新分类失败:', error)
    return NextResponse.json({ success: false, message: '更新分类失败' }, { status: 500 })
  }
}

// 删除分类
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [deletedCategory] = await db.delete(categories).where(eq(categories.id, params.id)).returning({ id: categories.id })

    if (!deletedCategory) {
      return NextResponse.json({ success: false, message: '分类不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: '分类删除成功'
    })
  } catch (error) {
    console.error('删除分类失败:', error)
    return NextResponse.json({ success: false, message: '删除分类失败' }, { status: 500 })
  }
}
