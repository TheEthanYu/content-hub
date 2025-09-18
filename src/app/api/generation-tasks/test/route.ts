import { NextResponse } from 'next/server'
import { generateArticleWithAI } from '@/lib/ai'

// 测试AI生成文章 - 供调试使用
export async function POST(request: Request) {
  try {
    const { keyword, websiteInfo } = await request.json()

    if (!keyword) {
      return NextResponse.json({ success: false, message: '关键词不能为空' }, { status: 400 })
    }

    console.log(`测试生成文章: ${keyword}`)

    const aiResponse = await generateArticleWithAI(
      keyword,
      undefined, // searchVolume
      undefined, // difficulty
      undefined, // competition
      websiteInfo || {
        name: 'YourWebsite',
        domain: 'example.com',
        description: 'A helpful online tool'
      }
    )

    if (aiResponse.success && aiResponse.data) {
      return NextResponse.json({
        success: true,
        message: '文章生成成功',
        data: {
          title: aiResponse.data.title,
          contentLength: aiResponse.data.content.length,
          seoTitle: aiResponse.data.seoTitle,
          seoDescription: aiResponse.data.seoDescription,
          tokensUsed: aiResponse.data.tokensUsed,
          // 返回前500个字符的预览
          contentPreview: aiResponse.data.content.substring(0, 500) + '...'
        }
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: aiResponse.error || '生成失败'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('测试生成失败:', error)
    return NextResponse.json(
      {
        success: false,
        message: '测试失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
