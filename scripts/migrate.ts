import { db, websites, categories, articles } from '../src/lib/db'
import { eq } from 'drizzle-orm'

async function migrateToMultiWebsite() {
  console.log('开始迁移到多网站结构...')

  try {
    // 1. 创建默认网站
    console.log('1. 创建默认网站...')
    const [defaultWebsite] = await db
      .insert(websites)
      .values({
        name: '默认网站',
        domain: 'localhost',
        description: '系统默认网站，用于迁移现有数据',
        url: 'http://localhost:3000',
        defaultLanguage: 'zh-CN',
        timezone: 'Asia/Shanghai',
        autoGenerateEnabled: false,
        generateInterval: 24,
        maxArticlesPerDay: 5
      })
      .onConflictDoNothing()
      .returning()

    const websiteId = defaultWebsite?.id

    if (!websiteId) {
      // 如果网站已存在，获取它的ID
      const existingWebsite = await db.select().from(websites).where(eq(websites.domain, 'localhost')).limit(1)

      if (existingWebsite.length === 0) {
        throw new Error('无法创建或找到默认网站')
      }
      console.log('默认网站已存在，使用现有网站')
    } else {
      console.log('默认网站创建成功')
    }

    // 2. 获取所有没有网站关联的分类
    console.log('2. 更新分类的网站关联...')
    const categoriesWithoutWebsite = await db.select().from(categories).where(eq(categories.websiteId, null))

    if (categoriesWithoutWebsite.length > 0) {
      // 获取网站ID（使用现有的或新创建的）
      const website = await db.select().from(websites).where(eq(websites.domain, 'localhost')).limit(1)

      if (website.length > 0) {
        // 更新所有没有网站关联的分类
        const updateResult = await db.update(categories).set({ websiteId: website[0].id, updatedAt: new Date() }).where(eq(categories.websiteId, null))

        console.log(`已更新 ${categoriesWithoutWebsite.length} 个分类的网站关联`)
      }
    } else {
      console.log('所有分类都已有网站关联')
    }

    console.log('迁移完成！')
  } catch (error) {
    console.error('迁移失败:', error)
    throw error
  }
}

// 如果直接运行此文件
if (require.main === module) {
  migrateToMultiWebsite()
    .then(() => {
      console.log('迁移成功完成')
      process.exit(0)
    })
    .catch(error => {
      console.error('迁移失败:', error)
      process.exit(1)
    })
}

export { migrateToMultiWebsite }
