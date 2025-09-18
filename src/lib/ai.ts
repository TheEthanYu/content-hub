// AI服务 - 使用OpenRouter API

export interface GeneratedArticle {
  title: string
  content: string
  seoTitle: string
  seoDescription: string
  tokensUsed: number
}

export interface AIResponse {
  success: boolean
  data?: GeneratedArticle
  error?: string
}

// OpenRouter API配置
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku'
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'

/**
 * 使用OpenRouter生成文章内容
 */
export async function generateArticleWithAI(keyword: string, searchVolume?: number, difficulty?: number, competition?: string): Promise<AIResponse> {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API密钥未配置')
    }

    // 构建提示词
    const prompt = buildPrompt(keyword, searchVolume, difficulty, competition)

    console.log(`开始为关键词 "${keyword}" 生成文章...`)

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'Content Hub - AI Article Generator'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`OpenRouter API错误: ${response.status} - ${errorData}`)
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0]) {
      throw new Error('OpenRouter返回数据格式错误')
    }

    const content = data.choices[0].message?.content
    if (!content) {
      throw new Error('OpenRouter返回内容为空')
    }

    // 解析AI返回的JSON格式内容
    const parsedContent = parseAIResponse(content)

    if (!parsedContent) {
      throw new Error('AI返回内容格式错误，无法解析')
    }

    const tokensUsed = data.usage?.total_tokens || 0

    console.log(`✅ 成功生成文章: ${parsedContent.title} (使用${tokensUsed}个tokens)`)

    return {
      success: true,
      data: {
        ...parsedContent,
        tokensUsed
      }
    }
  } catch (error) {
    console.error(`❌ 生成文章失败:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 构建AI提示词
 */
function buildPrompt(keyword: string, searchVolume?: number, difficulty?: number, competition?: string): string {
  const seoData = searchVolume
    ? `\n关键词SEO数据：
- 搜索量：${searchVolume?.toLocaleString()}
- 难度：${difficulty}/100
- 竞争程度：${competition || '未知'}`
    : ''

  return `你是一个专业的SEO内容创作者。请根据以下关键词创作一篇高质量的SEO文章。

目标关键词："${keyword}"${seoData}

请严格按照以下JSON格式返回内容：

\`\`\`json
{
  "title": "文章标题（包含关键词，吸引人且SEO友好）",
  "content": "完整的文章内容（Markdown格式，2000-3000字，结构清晰，包含小标题、列表等元素，自然融入关键词3-5次）",
  "seoTitle": "SEO标题（50-60个字符，包含关键词）",
  "seoDescription": "SEO描述（150-160个字符，吸引人点击）"
}
\`\`\`

要求：
1. 文章要有实用价值，提供真实有用的信息
2. 结构清晰：引言 → 主要内容（2-4个小节） → 结论
3. 自然融入关键词，避免关键词堆砌
4. 使用Markdown格式：标题用##，小标题用###，重要内容用**粗体**
5. 包含有序或无序列表来提高可读性
6. 语言流畅，符合中文表达习惯
7. 内容要求原创，避免常见的模板化内容

请确保返回的是有效的JSON格式，不要包含任何其他文字。`
}

/**
 * 解析AI返回的内容
 */
function parseAIResponse(content: string): Omit<GeneratedArticle, 'tokensUsed'> | null {
  try {
    // 尝试提取JSON内容
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
    const jsonString = jsonMatch ? jsonMatch[1] : content

    const parsed = JSON.parse(jsonString.trim())

    // 验证必需字段
    if (!parsed.title || !parsed.content || !parsed.seoTitle || !parsed.seoDescription) {
      console.error('AI返回内容缺少必需字段:', parsed)
      return null
    }

    return {
      title: parsed.title.trim(),
      content: parsed.content.trim(),
      seoTitle: parsed.seoTitle.trim(),
      seoDescription: parsed.seoDescription.trim()
    }
  } catch (error) {
    console.error('解析AI返回内容失败:', error)
    console.error('原始内容:', content)
    return null
  }
}

/**
 * 测试AI连接
 */
export async function testAIConnection(): Promise<{ success: boolean; message: string }> {
  try {
    if (!OPENROUTER_API_KEY) {
      return { success: false, message: 'OpenRouter API密钥未配置' }
    }

    const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return { success: false, message: `API连接失败: ${response.status}` }
    }

    return { success: true, message: '✅ OpenRouter连接正常' }
  } catch (error) {
    return {
      success: false,
      message: `连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 获取可用模型列表
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    if (!OPENROUTER_API_KEY) {
      return []
    }

    const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.data?.map((model: any) => model.id) || []
  } catch (error) {
    console.error('获取模型列表失败:', error)
    return []
  }
}
