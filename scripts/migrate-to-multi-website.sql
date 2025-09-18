-- 多网站迁移脚本
-- 这个脚本将安全地迁移现有数据到支持多网站的结构

BEGIN;

-- 1. 创建默认网站（如果不存在）
INSERT INTO websites (
  id,
  name,
  domain,
  description,
  url,
  default_language,
  timezone,
  auto_generate_enabled,
  generate_interval,
  max_articles_per_day,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '默认网站',
  'localhost',
  '系统默认网站，用于迁移现有数据',
  'http://localhost:3000',
  'zh-CN',
  'Asia/Shanghai',
  false,
  24,
  5,
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- 2. 获取默认网站ID
-- 注意：在实际执行时需要替换这个变量
-- SET @default_website_id = (SELECT id FROM websites WHERE domain = 'localhost' LIMIT 1);

-- 3. 为现有分类添加网站关联
-- 这里我们需要手动处理，因为 PostgreSQL 不支持变量

-- 4. 创建临时表来存储需要更新的数据
CREATE TEMP TABLE temp_migration_data AS
SELECT 
  c.id as category_id,
  w.id as website_id
FROM categories c
CROSS JOIN (SELECT id FROM websites WHERE domain = 'localhost' LIMIT 1) w;

-- 5. 备份现有的分类数据
CREATE TEMP TABLE categories_backup AS
SELECT * FROM categories;

-- 6. 备份现有的文章数据  
CREATE TEMP TABLE articles_backup AS
SELECT * FROM articles;

COMMIT;

-- 注意：这个脚本需要手动执行某些步骤
-- 请按照以下步骤操作：
