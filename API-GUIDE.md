# Content Hub 公开 API 调用指引

这份文档将指引您如何调用 Content Hub 的公开 API 接口，以便在您的网站中获取分类和文章数据。

## 📋 API 概览

Content Hub 提供以下公开 API 接口：

- **分类列表接口**: 获取文章分类数据
- **文章列表接口**: 获取文章列表（支持分页和筛选）
- **文章详情接口**: 获取单篇文章的完整内容

所有接口都返回 JSON 格式数据，并且支持跨域访问。

## 🔗 接口详情

### 1. 获取分类列表

**接口地址**: `GET /api/public/categories`

**功能**: 获取网站的文章分类列表

#### 请求参数

| 参数名      | 类型   | 必填 | 说明                             |
| ----------- | ------ | ---- | -------------------------------- |
| `domain`    | string | 否   | 网站域名，用于筛选特定网站的分类 |
| `websiteId` | string | 否   | 网站 ID，用于筛选特定网站的分类  |

#### 示例请求

```bash
# 获取所有分类
curl "https://your-domain.com/api/public/categories"

# 按域名筛选分类
curl "https://your-domain.com/api/public/categories?domain=youtubetomp3.art"

# 按网站ID筛选分类
curl "https://your-domain.com/api/public/categories?websiteId=uuid-here"
```

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "在线工具",
      "slug": "online-tools",
      "description": "各种实用的在线工具介绍",
      "color": "#3B82F6",
      "website": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "YoutubeToMp3",
        "domain": "youtubetomp3.art"
      }
    }
  ]
}
```

---

### 2. 获取文章列表

**接口地址**: `GET /api/public/articles`

**功能**: 获取已发布的文章列表，支持分页和多种筛选条件

#### 请求参数

| 参数名      | 类型   | 必填 | 默认值 | 说明                              |
| ----------- | ------ | ---- | ------ | --------------------------------- |
| `page`      | number | 否   | 1      | 页码                              |
| `limit`     | number | 否   | 20     | 每页文章数量                      |
| `category`  | string | 否   | -      | 分类 slug，用于筛选特定分类的文章 |
| `domain`    | string | 否   | -      | 网站域名，用于筛选特定网站的文章  |
| `websiteId` | string | 否   | -      | 网站 ID，用于筛选特定网站的文章   |

#### 示例请求

```bash
# 获取所有文章（第一页）
curl "https://your-domain.com/api/public/articles"

# 获取第2页文章，每页10篇
curl "https://your-domain.com/api/public/articles?page=2&limit=10"

# 按分类筛选文章
curl "https://your-domain.com/api/public/articles?category=online-tools"

# 按网站域名筛选文章
curl "https://your-domain.com/api/public/articles?domain=youtubetomp3.art"

# 组合筛选：特定网站的特定分类
curl "https://your-domain.com/api/public/articles?domain=youtubetomp3.art&category=tutorials&page=1&limit=5"
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "title": "How to Convert YouTube Videos to MP3: Complete Guide",
        "slug": "youtube-to-mp3-complete-guide",
        "excerpt": "Learn the best methods to convert YouTube videos to MP3 format safely and legally...",
        "featuredImage": "https://example.com/image.jpg",
        "seoTitle": "YouTube to MP3 Converter - Best Methods 2024",
        "seoDescription": "Discover the top YouTube to MP3 conversion methods. Safe, fast, and high-quality audio downloads.",
        "seoKeywords": "youtube to mp3, converter, audio download",
        "publishedAt": "2024-01-15T10:30:00.000Z",
        "viewCount": 1250,
        "category": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "在线工具",
          "slug": "online-tools",
          "color": "#3B82F6"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### 3. 获取文章详情

**接口地址**: `GET /api/public/articles/[slug]`

**功能**: 根据文章 slug 获取完整的文章内容，包括自动增加浏览量

#### 路径参数

| 参数名 | 类型   | 必填 | 说明              |
| ------ | ------ | ---- | ----------------- |
| `slug` | string | 是   | 文章的 URL 标识符 |

#### 示例请求

```bash
# 获取特定文章详情
curl "https://your-domain.com/api/public/articles/youtube-to-mp3-complete-guide"
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "title": "How to Convert YouTube Videos to MP3: Complete Guide",
    "slug": "youtube-to-mp3-complete-guide",
    "content": "# How to Convert YouTube Videos to MP3\n\n## Introduction\n\nConverting YouTube videos to MP3 format...",
    "excerpt": "Learn the best methods to convert YouTube videos to MP3 format safely and legally...",
    "featuredImage": "https://example.com/image.jpg",
    "seoTitle": "YouTube to MP3 Converter - Best Methods 2024",
    "seoDescription": "Discover the top YouTube to MP3 conversion methods. Safe, fast, and high-quality audio downloads.",
    "seoKeywords": "youtube to mp3, converter, audio download",
    "publishedAt": "2024-01-15T10:30:00.000Z",
    "viewCount": 1251,
    "category": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "在线工具",
      "slug": "online-tools",
      "color": "#3B82F6"
    }
  }
}
```

## 💻 JavaScript 调用示例

### 使用 Fetch API

```javascript
// 获取特定网站的分类列表
async function getCategories(domain) {
  try {
    const response = await fetch(`https://your-domain.com/api/public/categories?domain=${domain}`)
    const data = await response.json()

    if (data.success) {
      return data.data
    } else {
      throw new Error('Failed to fetch categories')
    }
  } catch (error) {
    console.error('Error:', error)
    return []
  }
}

// 获取文章列表
async function getArticles(options = {}) {
  const { page = 1, limit = 10, category = '', domain = '' } = options

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })

  if (category) params.append('category', category)
  if (domain) params.append('domain', domain)

  try {
    const response = await fetch(`https://your-domain.com/api/public/articles?${params}`)
    const data = await response.json()

    if (data.success) {
      return data.data
    } else {
      throw new Error('Failed to fetch articles')
    }
  } catch (error) {
    console.error('Error:', error)
    return { articles: [], pagination: {} }
  }
}

// 获取文章详情
async function getArticle(slug) {
  try {
    const response = await fetch(`https://your-domain.com/api/public/articles/${slug}`)
    const data = await response.json()

    if (data.success) {
      return data.data
    } else {
      throw new Error('Article not found')
    }
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

// 使用示例
async function example() {
  // 获取youtubetomp3.art网站的分类
  const categories = await getCategories('youtubetomp3.art')
  console.log('Categories:', categories)

  // 获取该网站的文章列表
  const articlesData = await getArticles({
    domain: 'youtubetomp3.art',
    page: 1,
    limit: 5
  })
  console.log('Articles:', articlesData.articles)
  console.log('Pagination:', articlesData.pagination)

  // 获取特定文章详情
  if (articlesData.articles.length > 0) {
    const article = await getArticle(articlesData.articles[0].slug)
    console.log('Article detail:', article)
  }
}
```

### 使用 Axios

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://your-domain.com/api/public'
})

// 获取分类列表
export const getCategories = async domain => {
  const response = await api.get('/categories', {
    params: { domain }
  })
  return response.data
}

// 获取文章列表
export const getArticles = async params => {
  const response = await api.get('/articles', { params })
  return response.data
}

// 获取文章详情
export const getArticle = async slug => {
  const response = await api.get(`/articles/${slug}`)
  return response.data
}
```

## 🎯 实际应用场景

### 1. 网站首页文章展示

```javascript
// 显示最新的5篇文章
async function displayLatestArticles() {
  const data = await getArticles({
    domain: 'youtubetomp3.art',
    limit: 5,
    page: 1
  })

  const articlesList = document.getElementById('articles-list')

  data.articles.forEach(article => {
    const articleElement = document.createElement('div')
    articleElement.innerHTML = `
      <h3><a href="/article/${article.slug}">${article.title}</a></h3>
      <p>${article.excerpt}</p>
      <span>浏览量: ${article.viewCount}</span>
      <span class="category" style="color: ${article.category.color}">
        ${article.category.name}
      </span>
    `
    articlesList.appendChild(articleElement)
  })
}
```

### 2. 分类页面

```javascript
// 按分类显示文章
async function displayCategoryArticles(categorySlug) {
  const data = await getArticles({
    domain: 'youtubetomp3.art',
    category: categorySlug,
    limit: 10,
    page: 1
  })

  // 渲染文章列表和分页
  renderArticles(data.articles)
  renderPagination(data.pagination)
}
```

### 3. 文章详情页面

```javascript
// 显示文章详情
async function displayArticleDetail(slug) {
  const article = await getArticle(slug)

  if (article) {
    document.title = article.seoTitle
    document.querySelector('meta[name="description"]').content = article.seoDescription

    document.getElementById('article-title').textContent = article.title
    document.getElementById('article-content').innerHTML = marked(article.content) // 使用marked库解析Markdown
    document.getElementById('view-count').textContent = article.viewCount
  }
}
```

## ⚠️ 注意事项

1. **域名配置**: 确保您的 Content Hub 域名正确配置并可以访问
2. **CORS**: API 已配置跨域支持，可以在不同域名下调用
3. **缓存**: 建议在客户端实现适当的缓存机制以提高性能
4. **错误处理**: 请妥善处理 API 调用失败的情况
5. **SEO 优化**: 文章内容为 Markdown 格式，建议使用合适的解析库
6. **浏览量**: 每次调用文章详情接口都会自动增加 1 次浏览量

## 🔧 故障排除

### 常见错误码

- `404`: 资源不存在（文章未发布或不存在）
- `500`: 服务器内部错误
- `400`: 请求参数错误

### 调试建议

1. 使用浏览器开发工具检查网络请求
2. 确认 API 响应的 JSON 格式
3. 检查 domain 参数是否正确匹配您的网站域名
4. 验证文章是否为"已发布"状态

## 📞 技术支持

如果您在使用 API 时遇到问题，请检查：

1. 网络连接是否正常
2. API 地址是否正确
3. 请求参数格式是否正确
4. 是否有适当的错误处理机制

建议在生产环境中实现监控和日志记录，以便及时发现和解决问题。
