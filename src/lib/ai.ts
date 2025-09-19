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

  return `You are a professional SEO content writer with expertise in creating high-quality, EEAT-optimized, helpful content. Create a comprehensive article targeting the following keyword. The instructions must remain topic-agnostic so they work for any niche.

Target Keyword: "${keyword}"${seoData}${websiteSection}

Return the content in the following JSON format only (no prose outside JSON):

\`\`\`json
{
  "title": "Article title (engaging, SEO-friendly, includes target keyword)",
  "content": "Complete article content in Markdown format (approx. 1400-2200 words; expand if the topic truly needs more)",
  "seoTitle": "SEO title (50-60 characters, includes target keyword)",
  "seoDescription": "Meta description (150-160 characters, compelling click-through)"
}
\`\`\`

CONTENT REQUIREMENTS:

**EEAT & Helpful Content:**
1. **Experience**: Provide actionable, experience-driven advice and concrete examples; avoid generic filler.
2. **Expertise**: Be technically accurate and up-to-date; prefer verifiable facts and best practices.
3. **Authoritativeness**: Cover the topic comprehensively with logical structure and clear takeaways.
4. **Trustworthiness**: Add disclaimers where appropriate, state assumptions, present balanced viewpoints, and avoid overstated claims.
5. **Neutrality**: If third-party tools, frameworks, or methods are discussed, compare them fairly without promotional tone.

**SEO Optimization:**
1. Use the target keyword naturally 3-6 times; avoid keyword stuffing.
2. Include semantic keywords and closely related entities that a knowledgeable author would naturally mention.
3. Use a correct heading hierarchy (##, ###, ####) and scannable subsections; avoid empty headings.
4. Add bulleted and numbered lists where it improves readability.
5. Craft a compelling meta description (benefit-driven, truthful, non-clickbait).
6. Suggest internal linking opportunities by referencing related subtopics in natural language.
7. If comparisons exist (e.g., multiple options/approaches), include a concise Markdown table comparing key criteria.

**Content Structure:**
1. **Introduction** (100-180 words): Clear hook, define audience and scope, mention the keyword once.
2. **Main Content**: 4-7 sections with practical, step-by-step guidance, examples, and caveats.
3. **FAQ Section** (3-6 items, concise answers 1-3 sentences each) written in a schema-friendly style.
4. **Conclusion** (80-150 words): Summarize value and provide a reasonable, non-promotional CTA.
5. Include a short "Last updated: {today's date}" note near the top.

**Writing Style:**
- Write in English with clear, accessible language for a global audience.
- Use active voice and an engaging but professional tone.
- Provide practical examples, small checklists, and brief snippets (code/commands) when relevant to the topic.
- Use proper Markdown formatting; bold key terms sparingly where it genuinely aids comprehension.
- Avoid hallucinations, vague claims, and unsupported statistics. If data points are included, ensure they are widely accepted or mark them as estimates.

**Quality Standards:**
- Original, unique content (avoid templated phrasing and generic padding).
- Factually accurate and up-to-date information.
- Comprehensive coverage without digressions; prioritize usefulness.
- User-focused with clear value proposition and next steps.
- Professional tone suitable for the intended audience.

**Website Mention (if provided):**
- When the website information is given above, you may mention the website naturally only if relevant to the user's task. Keep the mention concise (≤2 sentences), neutral, and avoid overly promotional language.

**Safety & Formatting:**
- Do not include raw URLs unless specifically provided above.
- Do not output any text outside the JSON block.

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
