import Link from 'next/link';
import { FileText, FolderOpen, Globe, BarChart3 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-12">
        {/* 头部 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Content Hub
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            SEO文章内容管理系统
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto">
            集中管理你的所有SEO文章内容，为多个网站提供高质量的内容，并支持自动发布功能
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link href="/admin/articles" className="group">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">文章管理</h3>
              <p className="text-gray-600 text-sm">创建、编辑和管理你的SEO文章</p>
            </div>
          </Link>

          <Link href="/admin/categories" className="group">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition-colors">
                <FolderOpen className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">分类管理</h3>
              <p className="text-gray-600 text-sm">组织和管理文章分类</p>
            </div>
          </Link>

          <Link href="/api-docs" className="group">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4 group-hover:bg-purple-200 transition-colors">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">API文档</h3>
              <p className="text-gray-600 text-sm">查看API接口文档和使用说明</p>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">数据统计</h3>
            <p className="text-gray-600 text-sm">查看文章发布和访问统计</p>
          </div>
        </div>

        {/* API 示例 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">API 使用示例</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">获取文章列表</h3>
              <div className="bg-gray-900 text-white p-4 rounded-lg text-sm overflow-x-auto">
                <code>
                  GET /api/public/articles?page=1&limit=10&category=tech
                </code>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">获取单篇文章</h3>
              <div className="bg-gray-900 text-white p-4 rounded-lg text-sm overflow-x-auto">
                <code>
                  GET /api/public/articles/article-slug
                </code>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/api-docs" className="text-blue-600 hover:text-blue-800 font-medium">
              查看完整API文档 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
