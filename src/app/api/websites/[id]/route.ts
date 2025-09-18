import { NextRequest, NextResponse } from 'next/server'
import { db, websites } from '@/lib/db'
import { eq } from 'drizzle-orm'

// 获取单个网站
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const websiteData = await db.select().from(websites).where(eq(websites.id, params.id)).limit(1)

    if (websiteData.length === 0) {
      return NextResponse.json({ success: false, message: '网站不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: websiteData[0]
    })
  } catch (error) {
    console.error('获取网站失败:', error)
    return NextResponse.json({ success: false, message: '获取网站失败' }, { status: 500 })
  }
}

// 更新网站
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, domain, description, url, apiEndpoint, apiKey, defaultLanguage, timezone, autoGenerateEnabled, generateInterval, maxArticlesPerDay, isActive } = body

    const updateData: any = {
      updatedAt: new Date()
    }

    if (name !== undefined) updateData.name = name
    if (domain !== undefined) updateData.domain = domain
    if (description !== undefined) updateData.description = description
    if (url !== undefined) updateData.url = url
    if (apiEndpoint !== undefined) updateData.apiEndpoint = apiEndpoint
    if (apiKey !== undefined) updateData.apiKey = apiKey
    if (defaultLanguage !== undefined) updateData.defaultLanguage = defaultLanguage
    if (timezone !== undefined) updateData.timezone = timezone
    if (autoGenerateEnabled !== undefined) updateData.autoGenerateEnabled = autoGenerateEnabled
    if (generateInterval !== undefined) updateData.generateInterval = generateInterval
    if (maxArticlesPerDay !== undefined) updateData.maxArticlesPerDay = maxArticlesPerDay
    if (isActive !== undefined) updateData.isActive = isActive

    const [updatedWebsite] = await db.update(websites).set(updateData).where(eq(websites.id, params.id)).returning()

    if (!updatedWebsite) {
      return NextResponse.json({ success: false, message: '网站不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedWebsite,
      message: '网站更新成功'
    })
  } catch (error) {
    console.error('更新网站失败:', error)
    return NextResponse.json({ success: false, message: '更新网站失败' }, { status: 500 })
  }
}

// 删除网站
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [deletedWebsite] = await db.delete(websites).where(eq(websites.id, params.id)).returning({ id: websites.id })

    if (!deletedWebsite) {
      return NextResponse.json({ success: false, message: '网站不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: '网站删除成功'
    })
  } catch (error) {
    console.error('删除网站失败:', error)
    return NextResponse.json({ success: false, message: '删除网站失败' }, { status: 500 })
  }
}
