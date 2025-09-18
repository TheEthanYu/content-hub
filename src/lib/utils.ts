import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import slugify from 'slugify'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'zh'
  })
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function extractExcerpt(content: string, maxLength: number = 160): string {
  // 移除 Markdown 语法
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // 移除标题
    .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体
    .replace(/\*(.*?)\*/g, '$1') // 移除斜体
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接，保留文本
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/`(.*?)`/g, '$1') // 移除行内代码
    .replace(/\n/g, ' ') // 替换换行为空格
    .trim()

  return truncateText(plainText, maxLength)
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800'
    case 'draft':
      return 'bg-yellow-100 text-yellow-800'
    case 'archived':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'published':
      return '已发布'
    case 'draft':
      return '草稿'
    case 'archived':
      return '已归档'
    default:
      return '未知'
  }
}

// 关键词处理工具函数
export function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // 多个空格合并为一个
    .replace(/[^\w\s\u4e00-\u9fa5]/g, '') // 只保留字母、数字、空格和中文
}

export function generateKeywordHash(keyword: string, websiteId: string): string {
  const crypto = require('crypto')
  const normalized = normalizeKeyword(keyword)
  return crypto.createHash('sha256').update(`${normalized}-${websiteId}`).digest('hex')
}

export function deduplicateKeywords(keywords: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const keyword of keywords) {
    const normalized = normalizeKeyword(keyword)
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized)
      result.push(keyword.trim())
    }
  }

  return result
}

export function parseKeywordImport(content: string): string[] {
  // 支持多种格式：逗号分隔、换行分隔、CSV格式等
  const lines = content.split(/[\n\r]+/)
  const keywords: string[] = []

  for (const line of lines) {
    if (line.trim()) {
      // 处理CSV格式（可能有多列，关键词在第一列）
      const csvMatch = line.match(/^"([^"]+)"|^([^,]+)/)
      if (csvMatch) {
        const keyword = (csvMatch[1] || csvMatch[2]).trim()
        if (keyword) {
          keywords.push(keyword)
        }
      } else {
        // 处理逗号分隔
        const commaKeywords = line
          .split(',')
          .map(k => k.trim())
          .filter(k => k)
        keywords.push(...commaKeywords)
      }
    }
  }

  return deduplicateKeywords(keywords)
}

export function getKeywordPlanStatusColor(status: string): string {
  switch (status) {
    case 'generated':
      return 'bg-green-100 text-green-800'
    case 'processing':
      return 'bg-blue-100 text-blue-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getKeywordPlanStatusText(status: string): string {
  switch (status) {
    case 'generated':
      return '已生成'
    case 'processing':
      return '生成中'
    case 'pending':
      return '待生成'
    case 'failed':
      return '生成失败'
    default:
      return '未知'
  }
}
