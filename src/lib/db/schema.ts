import { pgTable, text, timestamp, boolean, integer, varchar, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// 分类表
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#3B82F6'), // 十六进制颜色
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
  url: text('url').notNull(),
  apiEndpoint: text('api_endpoint'), // 接收文章的API端点
  apiKey: text('api_key'), // API密钥
  isActive: boolean('is_active').default(true),
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

// 关系定义
export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles)
}))

export const articlesRelations = relations(articles, ({ one, many }) => ({
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id]
  }),
  publishLogs: many(publishLogs)
}))

export const websitesRelations = relations(websites, ({ many }) => ({
  publishLogs: many(publishLogs)
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
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert

export type Article = typeof articles.$inferSelect
export type NewArticle = typeof articles.$inferInsert

export type Website = typeof websites.$inferSelect
export type NewWebsite = typeof websites.$inferInsert

export type PublishLog = typeof publishLogs.$inferSelect
export type NewPublishLog = typeof publishLogs.$inferInsert
