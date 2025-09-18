import { pgTable, text, timestamp, boolean, integer, varchar, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// 分类表
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  websiteId: uuid('website_id').references(() => websites.id), // 关联网站（允许为空以支持迁移）
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#3B82F6'), // 十六进制颜色

  // SEO 设置
  seoTitle: varchar('seo_title', { length: 60 }),
  seoDescription: varchar('seo_description', { length: 160 }),

  // 排序和显示
  sortOrder: integer('sort_order').default(0),
  isVisible: boolean('is_visible').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// 文章表
export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'), // 摘要
  featuredImage: text('featured_image'), // 特色图片URL

  // SEO 相关字段
  seoTitle: varchar('seo_title', { length: 60 }),
  seoDescription: varchar('seo_description', { length: 160 }),
  seoKeywords: text('seo_keywords'), // 以逗号分隔的关键词

  // 分类关联
  categoryId: uuid('category_id').references(() => categories.id),

  // 状态管理
  status: varchar('status', { length: 20 }).default('draft').notNull(), // draft, published, archived
  publishedAt: timestamp('published_at'),

  // 统计信息
  viewCount: integer('view_count').default(0),

  // 发布相关
  autoPublish: boolean('auto_publish').default(false), // 是否自动发布到其他网站
  publishedSites: text('published_sites'), // 已发布的网站列表，JSON格式

  // 时间戳
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// 网站配置表（用于管理要发布到的网站）
export const websites = pgTable('websites', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  domain: varchar('domain', { length: 200 }).notNull(), // 网站域名
  description: text('description'), // 网站描述
  url: text('url').notNull(),
  apiEndpoint: text('api_endpoint'), // 接收文章的API端点
  apiKey: text('api_key'), // API密钥

  // SEO 设置
  defaultLanguage: varchar('default_language', { length: 10 }).default('zh-CN'),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Shanghai'),

  // 自动生成设置
  autoGenerateEnabled: boolean('auto_generate_enabled').default(false), // 是否启用自动生成
  generateInterval: integer('generate_interval').default(24), // 生成间隔（小时）
  maxArticlesPerDay: integer('max_articles_per_day').default(5), // 每天最大生成文章数

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// 关键词计划表
export const keywordPlans = pgTable('keyword_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  websiteId: uuid('website_id')
    .references(() => websites.id)
    .notNull(),
  categoryId: uuid('category_id').references(() => categories.id),

  // 关键词信息
  keyword: varchar('keyword', { length: 200 }).notNull(),
  keywordHash: varchar('keyword_hash', { length: 64 }).notNull().unique(), // 用于去重的哈希值

  // SEMrush 数据
  searchVolume: integer('search_volume').default(0), // 搜索量
  difficulty: integer('difficulty').default(0), // 难度 (0-100)
  cpc: text('cpc'), // 每次点击费用
  competition: varchar('competition', { length: 20 }), // 竞争程度: low, medium, high
  trend: text('trend'), // 趋势数据 JSON

  // 生成状态
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, processing, generated, failed
  priority: integer('priority').default(1), // 优先级 1-5

  // 生成结果
  articleId: uuid('article_id').references(() => articles.id), // 关联生成的文章
  generatedAt: timestamp('generated_at'),
  failureReason: text('failure_reason'), // 失败原因

  // 元数据
  importSource: varchar('import_source', { length: 50 }).default('manual'), // manual, semrush, csv
  importBatch: varchar('import_batch', { length: 100 }), // 导入批次号

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// 发布记录表
export const publishLogs = pgTable('publish_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id')
    .references(() => articles.id)
    .notNull(),
  websiteId: uuid('website_id')
    .references(() => websites.id)
    .notNull(),
  status: varchar('status', { length: 20 }).notNull(), // success, failed, pending
  response: text('response'), // API响应
  publishedAt: timestamp('published_at').defaultNow().notNull()
})

// 生成任务表
export const generationTasks = pgTable('generation_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  websiteId: uuid('website_id')
    .references(() => websites.id)
    .notNull(),
  keywordPlanId: uuid('keyword_plan_id').references(() => keywordPlans.id),

  // 任务信息
  type: varchar('type', { length: 20 }).notNull(), // auto, manual
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, processing, completed, failed

  // 生成参数
  prompt: text('prompt'), // 生成提示词
  model: varchar('model', { length: 50 }).default('gpt-3.5-turbo'), // AI模型
  temperature: text('temperature').default('0.7'), // 创造性参数

  // 结果
  articleId: uuid('article_id').references(() => articles.id),
  errorMessage: text('error_message'),
  tokensUsed: integer('tokens_used').default(0),

  // 时间
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// 关系定义
export const websitesRelations = relations(websites, ({ many }) => ({
  categories: many(categories),
  keywordPlans: many(keywordPlans),
  generationTasks: many(generationTasks),
  publishLogs: many(publishLogs)
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  website: one(websites, {
    fields: [categories.websiteId],
    references: [websites.id]
  }),
  articles: many(articles),
  keywordPlans: many(keywordPlans)
}))

export const articlesRelations = relations(articles, ({ one, many }) => ({
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id]
  }),
  publishLogs: many(publishLogs),
  keywordPlan: one(keywordPlans, {
    fields: [articles.id],
    references: [keywordPlans.articleId]
  }),
  generationTask: one(generationTasks, {
    fields: [articles.id],
    references: [generationTasks.articleId]
  })
}))

export const keywordPlansRelations = relations(keywordPlans, ({ one, many }) => ({
  website: one(websites, {
    fields: [keywordPlans.websiteId],
    references: [websites.id]
  }),
  category: one(categories, {
    fields: [keywordPlans.categoryId],
    references: [categories.id]
  }),
  article: one(articles, {
    fields: [keywordPlans.articleId],
    references: [articles.id]
  }),
  generationTasks: many(generationTasks)
}))

export const generationTasksRelations = relations(generationTasks, ({ one }) => ({
  website: one(websites, {
    fields: [generationTasks.websiteId],
    references: [websites.id]
  }),
  keywordPlan: one(keywordPlans, {
    fields: [generationTasks.keywordPlanId],
    references: [keywordPlans.id]
  }),
  article: one(articles, {
    fields: [generationTasks.articleId],
    references: [articles.id]
  })
}))

export const publishLogsRelations = relations(publishLogs, ({ one }) => ({
  article: one(articles, {
    fields: [publishLogs.articleId],
    references: [articles.id]
  }),
  website: one(websites, {
    fields: [publishLogs.websiteId],
    references: [websites.id]
  })
}))

// 类型导出
export type Website = typeof websites.$inferSelect
export type NewWebsite = typeof websites.$inferInsert

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert

export type Article = typeof articles.$inferSelect
export type NewArticle = typeof articles.$inferInsert

export type KeywordPlan = typeof keywordPlans.$inferSelect
export type NewKeywordPlan = typeof keywordPlans.$inferInsert

export type GenerationTask = typeof generationTasks.$inferSelect
export type NewGenerationTask = typeof generationTasks.$inferInsert

export type PublishLog = typeof publishLogs.$inferSelect
export type NewPublishLog = typeof publishLogs.$inferInsert
