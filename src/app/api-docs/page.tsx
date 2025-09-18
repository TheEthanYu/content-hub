export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">API 文档</h1>
          
          <div className="prose max-w-none">
            <p className="text-lg text-gray-600 mb-8">
              Content Hub 提供 RESTful API 接口，供其他网站获取文章内容。
            </p>

            {/* 基础信息 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">基础信息</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Base URL:</strong> <code>https://your-domain.com/api/public</code></p>
                <p><strong>格式:</strong> JSON</p>
                <p><strong>认证:</strong> 无需认证</p>
              </div>
            </section>

            {/* 文章接口 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">文章接口</h2>
              
              <div className="space-y-6">
                {/* 获取文章列表 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">获取文章列表</h3>
                  <div className="bg-gray-900 text-white p-3 rounded mb-4">
                    <code>GET /api/public/articles</code>
                  </div>
                  
                  <h4 className="font-semibold mb-2">查询参数</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left">参数</th>
                          <th className="px-4 py-2 text-left">类型</th>
                          <th className="px-4 py-2 text-left">说明</th>
                          <th className="px-4 py-2 text-left">默认值</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-2 border-t">page</td>
                          <td className="px-4 py-2 border-t">number</td>
                          <td className="px-4 py-2 border-t">页码</td>
                          <td className="px-4 py-2 border-t">1</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border-t">limit</td>
                          <td className="px-4 py-2 border-t">number</td>
                          <td className="px-4 py-2 border-t">每页数量</td>
                          <td className="px-4 py-2 border-t">20</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border-t">category</td>
                          <td className="px-4 py-2 border-t">string</td>
                          <td className="px-4 py-2 border-t">分类slug</td>
                          <td className="px-4 py-2 border-t">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h4 className="font-semibold mb-2 mt-4">响应示例</h4>
                  <div className="bg-gray-900 text-white p-4 rounded text-sm overflow-x-auto">
                    <pre>{`{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "uuid",
        "title": "文章标题",
        "slug": "article-slug",
        "excerpt": "文章摘要",
        "featuredImage": "图片URL",
        "seoTitle": "SEO标题",
        "seoDescription": "SEO描述",
        "seoKeywords": "关键词1,关键词2",
        "publishedAt": "2024-01-01T00:00:00Z",
        "viewCount": 100,
        "category": {
          "id": "uuid",
          "name": "分类名称",
          "slug": "category-slug",
          "color": "#3B82F6"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}`}</pre>
                  </div>
                </div>

                {/* 获取单篇文章 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">获取单篇文章</h3>
                  <div className="bg-gray-900 text-white p-3 rounded mb-4">
                    <code>GET /api/public/articles/{'{slug}'}</code>
                  </div>
                  
                  <h4 className="font-semibold mb-2">路径参数</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left">参数</th>
                          <th className="px-4 py-2 text-left">类型</th>
                          <th className="px-4 py-2 text-left">说明</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-2 border-t">slug</td>
                          <td className="px-4 py-2 border-t">string</td>
                          <td className="px-4 py-2 border-t">文章slug</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h4 className="font-semibold mb-2 mt-4">响应示例</h4>
                  <div className="bg-gray-900 text-white p-4 rounded text-sm overflow-x-auto">
                    <pre>{`{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "文章标题",
    "slug": "article-slug",
    "content": "完整的文章内容（Markdown格式）",
    "excerpt": "文章摘要",
    "featuredImage": "图片URL",
    "seoTitle": "SEO标题",
    "seoDescription": "SEO描述",
    "seoKeywords": "关键词1,关键词2",
    "publishedAt": "2024-01-01T00:00:00Z",
    "viewCount": 101,
    "category": {
      "id": "uuid",
      "name": "分类名称",
      "slug": "category-slug",
      "color": "#3B82F6"
    }
  }
}`}</pre>
                  </div>
                </div>
              </div>
            </section>

            {/* 分类接口 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">分类接口</h2>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">获取分类列表</h3>
                <div className="bg-gray-900 text-white p-3 rounded mb-4">
                  <code>GET /api/public/categories</code>
                </div>

                <h4 className="font-semibold mb-2">响应示例</h4>
                <div className="bg-gray-900 text-white p-4 rounded text-sm overflow-x-auto">
                  <pre>{`{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "分类名称",
      "slug": "category-slug",
      "description": "分类描述",
      "color": "#3B82F6"
    }
  ]
}`}</pre>
                </div>
              </div>
            </section>

            {/* 错误码 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">错误码</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left border-r">状态码</th>
                      <th className="px-4 py-2 text-left">说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border-t border-r">200</td>
                      <td className="px-4 py-2 border-t">成功</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border-t border-r">404</td>
                      <td className="px-4 py-2 border-t">资源不存在</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border-t border-r">500</td>
                      <td className="px-4 py-2 border-t">服务器错误</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 使用示例 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">使用示例</h2>
              
              <h3 className="text-lg font-semibold mb-2">JavaScript/Fetch</h3>
              <div className="bg-gray-900 text-white p-4 rounded text-sm overflow-x-auto mb-4">
                <pre>{`// 获取文章列表
const response = await fetch('https://your-domain.com/api/public/articles?page=1&limit=10');
const data = await response.json();

if (data.success) {
  console.log('文章列表:', data.data.articles);
}

// 获取单篇文章
const articleResponse = await fetch('https://your-domain.com/api/public/articles/article-slug');
const articleData = await articleResponse.json();

if (articleData.success) {
  console.log('文章内容:', articleData.data);
}`}</pre>
              </div>

              <h3 className="text-lg font-semibold mb-2">cURL</h3>
              <div className="bg-gray-900 text-white p-4 rounded text-sm overflow-x-auto">
                <pre>{`# 获取文章列表
curl -X GET "https://your-domain.com/api/public/articles?page=1&limit=10"

# 获取单篇文章
curl -X GET "https://your-domain.com/api/public/articles/article-slug"`}</pre>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
