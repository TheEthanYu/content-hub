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
export async function generateArticleWithAI(
  keyword: string,
  searchVolume?: number,
  difficulty?: number,
  competition?: string,
  websiteInfo?: {
    name: string
    domain: string
    description?: string
  }
): Promise<AIResponse> {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API密钥未配置')
    }

    // 构建提示词
    const prompt = buildPrompt(keyword, searchVolume, difficulty, competition, websiteInfo)

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
function buildPrompt(
  keyword: string,
  searchVolume?: number,
  difficulty?: number,
  competition?: string,
  websiteInfo?: {
    name: string
    domain: string
    description?: string
  }
): string {
  const seoData = searchVolume
    ? `\nKeyword SEO Data:
- Search Volume: ${searchVolume?.toLocaleString()}/month
- Difficulty: ${difficulty}/100
- Competition: ${competition || 'Unknown'}`
    : ''

  const websiteSection = websiteInfo
    ? `\nWebsite Information:
- Website Name: ${websiteInfo.name}
- Domain: ${websiteInfo.domain}
- Description: ${websiteInfo.description || 'A helpful online tool'}

Please naturally recommend or mention this website as a solution when relevant to the topic. Include the website name and emphasize its benefits to users.`
    : ''

  return `You are a professional SEO content writer with expertise in creating high-quality, EEAT-optimized articles. Create a comprehensive article targeting the following keyword.

Target Keyword: "${keyword}"${seoData}${websiteSection}

Return the content in the following JSON format:

\`\`\`json
{
  "title": "Article title (engaging, SEO-friendly, includes target keyword)",
  "content": "Complete article content in Markdown format (2500-4000 words)",
  "seoTitle": "SEO title (50-60 characters, includes target keyword)",
  "seoDescription": "Meta description (150-160 characters, compelling click-through)"
}
\`\`\`

CONTENT REQUIREMENTS:

**EEAT Optimization:**
1. **Experience**: Write from a knowledgeable perspective, include practical tips and real-world applications
2. **Expertise**: Demonstrate deep subject knowledge, use technical accuracy, cite best practices
3. **Authoritativeness**: Structure content professionally, use confident language, provide comprehensive coverage
4. **Trustworthiness**: Include disclaimers when appropriate, acknowledge limitations, provide balanced viewpoints

**SEO Optimization:**
1. Use target keyword naturally 4-6 times throughout the article
2. Include semantic keywords and related terms
3. Structure with proper heading hierarchy (##, ###, ####)
4. Include bulleted and numbered lists for readability
5. Write compelling meta descriptions that encourage clicks
6. Use internal linking opportunities (mention related topics)

**Content Structure:**
1. **Introduction** (150-200 words): Hook, keyword mention, article overview
2. **Main Content** (2000-3000 words): 4-6 detailed sections with practical information
3. **FAQ Section** (300-500 words): Address common questions with schema-friendly format
4. **Conclusion** (150-200 words): Summarize key points, include call-to-action

**Writing Style:**
- Write in English with clear, accessible language
- Use active voice and engaging tone
- Include practical examples and actionable advice
- Format with proper Markdown syntax
- Bold important terms and concepts
- Create scannable content with subheadings and lists

**Quality Standards:**
- Original, unique content (no templated phrases)
- Factually accurate and up-to-date information
- Comprehensive coverage of the topic
- User-focused with clear value proposition
- Professional tone suitable for target audience

Return only valid JSON format without any additional text.`
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
