import { NextRequest, NextResponse } from 'next/server'
import { db, websites } from '@/lib/db'
import { desc, eq } from 'drizzle-orm'
import { generateSlug } from '@/lib/utils'

// 获取网站列表
export async function GET() {
  try {
    const websitesData = await db.select().from(websites).orderBy(desc(websites.createdAt))

    return NextResponse.json({
      success: true,
      data: websitesData
    })
  } catch (error) {
    console.error('获取网站列表失败:', error)
    return NextResponse.json({ success: false, message: '获取网站列表失败' }, { status: 500 })
  }
}

// 创建新网站
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, domain, description, url, apiEndpoint, apiKey, defaultLanguage, timezone, autoGenerateEnabled, generateInterval, maxArticlesPerDay } = body

    if (!name || !domain || !url) {
      return NextResponse.json({ success: false, message: '网站名称、域名和URL不能为空' }, { status: 400 })
    }

    // 检查域名是否已存在
    const existingWebsite = await db.select().from(websites).where(eq(websites.domain, domain)).limit(1)

    if (existingWebsite.length > 0) {
      return NextResponse.json({ success: false, message: '域名已存在' }, { status: 400 })
    }

    const [newWebsite] = await db
      .insert(websites)
      .values({
        name,
        domain,
        description,
        url,
        apiEndpoint,
        apiKey,
        defaultLanguage: defaultLanguage || 'zh-CN',
        timezone: timezone || 'Asia/Shanghai',
        autoGenerateEnabled: autoGenerateEnabled || false,
        generateInterval: generateInterval || 24,
        maxArticlesPerDay: maxArticlesPerDay || 5
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newWebsite,
      message: '网站创建成功'
    })
  } catch (error) {
    console.error('创建网站失败:', error)
    return NextResponse.json({ success: false, message: '创建网站失败' }, { status: 500 })
  }
}
