import { NextResponse } from 'next/server'
import { testAIConnection, getAvailableModels } from '@/lib/ai'

// 测试AI连接
export async function GET() {
  try {
    const connectionTest = await testAIConnection()
    const models = await getAvailableModels()

    return NextResponse.json({
      success: connectionTest.success,
      message: connectionTest.message,
      data: {
        currentModel: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
        availableModels: models.slice(0, 10), // 只返回前10个模型
        totalModels: models.length
      }
    })
  } catch (error) {
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
