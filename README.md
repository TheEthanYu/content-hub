# Content Hub - SEO 文章管理系统

一个现代化的 SEO 文章内容管理系统，用于集中管理你的所有网站的文章内容，支持自动发布功能。

## 🚀 技术栈

- **前端框架**: Next.js 14 (App Router)
- **数据库**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **样式**: Tailwind CSS
- **语言**: TypeScript
- **包管理**: pnpm

## ✨ 主要功能

- 📝 **文章管理**: 创建、编辑、删除文章，支持 Markdown 格式
- 🏷️ **分类管理**: 灵活的文章分类系统
- 🔍 **SEO 优化**: 完整的 SEO 元数据管理
- 🌐 **API 接口**: RESTful API 供其他网站调用
- 📊 **数据统计**: 文章浏览量统计
- 🚀 **自动发布**: 自动发布文章到其他网站（开发中）

## 🛠️ 快速开始

### 1. 克隆项目

\`\`\`bash git clone <repository-url> cd content-hub \`\`\`

### 2. 安装依赖

\`\`\`bash pnpm install \`\`\`

### 3. 环境配置

复制环境变量文件：

\`\`\`bash cp .env.example .env \`\`\`

编辑 `.env` 文件，填入你的 Supabase 配置：

\`\`\`env NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key DATABASE_URL=postgresql://username:password@host:port/database \`\`\`

### 4. 数据库迁移

\`\`\`bash pnpm db:generate pnpm db:migrate \`\`\`

### 5. 启动开发服务器

\`\`\`bash pnpm dev \`\`\`

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📁 项目结构

\`\`\` src/ ├── app/ # Next.js App Router │ ├── admin/ # 管理后台页面 │ ├── api/ # API 路由 │ └── api-docs/ # API 文档页面 ├── components/ # React 组件 │ └── ui/ # UI 组件 ├── lib/ # 工具库 │ ├── db/ # 数据库相关 │ └── utils.ts # 工具函数 \`\`\`

## 🔌 API 使用

### 获取文章列表

\`\`\`http GET /api/public/articles?page=1&limit=10&category=tech \`\`\`

### 获取单篇文章

\`\`\`http GET /api/public/articles/{slug} \`\`\`

### 获取分类列表

\`\`\`http GET /api/public/categories \`\`\`

详细的 API 文档请访问: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## 🗄️ 数据库结构

### 主要表结构

- **articles**: 文章表，包含标题、内容、SEO 信息等
- **categories**: 分类表
- **websites**: 网站配置表（用于自动发布）
- **publish_logs**: 发布记录表

## 📝 使用说明

### 1. 创建分类

在管理后台的"分类管理"页面创建文章分类，支持自定义颜色。

### 2. 创建文章

在"文章管理"页面创建新文章：

- 支持 Markdown 格式
- 自动生成摘要和 slug
- 完整的 SEO 设置
- 发布状态管理

### 3. API 调用

其他网站可以通过公开 API 获取文章内容：

\`\`\`javascript // 获取最新文章 const response = await fetch('https://your-domain.com/api/public/articles'); const data = await response.json();

if (data.success) { console.log('文章列表:', data.data.articles); } \`\`\`

## 🚀 部署

### Vercel 部署

1. 将项目推送到 GitHub
2. 在 Vercel 中导入项目
3. 设置环境变量
4. 部署

### 自定义部署

\`\`\`bash pnpm build pnpm start \`\`\`

## 🚀 自动生成功能

### 关键词计划管理

- **Excel 模板导入**: 下载模板，填入 SEMrush 数据，批量导入关键词
- **智能去重**: 自动识别重复关键词，避免重复生成
- **多网站隔离**: 不同网站的关键词完全隔离管理
- **优先级管理**: 支持设置关键词优先级，优先生成重要内容

### 自动文章生成

- **定时任务**: 通过 Vercel Cron 定时执行生成任务
- **AI 生成**: 基于关键词自动生成 SEO 友好的文章内容
- **生成限制**: 每个网站可配置每日最大生成数量
- **状态跟踪**: 完整的任务执行历史和状态监控

### 环境变量配置

```env
# 基础配置
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL=postgresql://username:password@host:port/database

# 定时任务安全
CRON_SECRET=your-super-secret-cron-key

# AI服务配置（可选）
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
```

### Vercel 部署

1. **推送到 GitHub**
2. **在 Vercel 导入项目**
3. **设置环境变量**
4. **部署完成后，定时任务自动生效**

定时任务配置（每天上午 9 点执行）：

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-articles",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## 📊 管理页面

- `/admin/websites` - 网站管理
- `/admin/keyword-plans` - 关键词计划管理
- `/admin/articles` - 文章管理
- `/admin/categories` - 分类管理
- `/admin/generation-tasks` - 生成任务历史

## 🛣️ 开发计划

- [x] 多网站数据隔离
- [x] 关键词计划管理
- [x] Excel 模板导入
- [x] 自动文章生成
- [x] 定时任务支持
- [ ] 真实 AI 服务集成
- [ ] 图片上传和管理
- [ ] 文章版本控制
- [ ] 更多 SEO 工具
- [ ] 数据分析面板

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！
