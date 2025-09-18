'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  status: string;
  publishedAt: string | null;
  viewCount: number;
  autoPublish: boolean;
  publishedSites: string | null;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    color: string;
  } | null;
}

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取文章详情
  const fetchArticle = async () => {
    try {
      const response = await fetch(`/api/articles/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setArticle(data.data);
      } else {
        console.error('获取文章失败:', data.message);
      }
    } catch (error) {
      console.error('获取文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除文章
  const deleteArticle = async () => {
    if (!confirm('确定要删除这篇文章吗？')) return;

    try {
      const response = await fetch(`/api/articles/${params.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        router.push('/admin/articles');
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除文章失败:', error);
      alert('删除失败');
    }
  };

  useEffect(() => {
    fetchArticle();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">文章不存在</h3>
          <p className="text-gray-500 mb-4">请检查链接是否正确</p>
          <Link href="/admin/articles">
            <Button>返回文章列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin/articles">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(article.status)}`}>
                {getStatusText(article.status)}
              </span>
              {article.category && (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: article.category.color + '20',
                    color: article.category.color,
                  }}
                >
                  {article.category.name}
                </span>
              )}
              <span className="text-sm text-gray-500">
                <Eye className="w-4 h-4 inline mr-1" />
                {article.viewCount} 次浏览
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/admin/articles/${article.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              编辑
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={deleteArticle}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            删除
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 主要内容 */}
        <div className="lg:col-span-2">
          {/* 特色图片 */}
          {article.featuredImage && (
            <div className="mb-6">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* 文章内容 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="prose max-w-none">
              <ReactMarkdown>{article.content}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* 侧边栏信息 */}
        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
            <div className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">文章ID</dt>
                <dd className="text-sm text-gray-900 font-mono">{article.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Slug</dt>
                <dd className="text-sm text-gray-900 font-mono">{article.slug}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">创建时间</dt>
                <dd className="text-sm text-gray-900">{formatDate(article.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">更新时间</dt>
                <dd className="text-sm text-gray-900">{formatDate(article.updatedAt)}</dd>
              </div>
              {article.publishedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">发布时间</dt>
                  <dd className="text-sm text-gray-900">{formatDate(article.publishedAt)}</dd>
                </div>
              )}
            </div>
          </div>

          {/* SEO信息 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO信息</h3>
            <div className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">SEO标题</dt>
                <dd className="text-sm text-gray-900">{article.seoTitle || '使用文章标题'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">SEO描述</dt>
                <dd className="text-sm text-gray-900">{article.seoDescription || '使用文章摘要'}</dd>
              </div>
              {article.seoKeywords && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">关键词</dt>
                  <dd className="text-sm text-gray-900">{article.seoKeywords}</dd>
                </div>
              )}
            </div>
          </div>

          {/* 发布设置 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">发布设置</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">自动发布</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  article.autoPublish 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {article.autoPublish ? '已启用' : '已禁用'}
                </span>
              </div>
              {article.publishedSites && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">已发布站点</dt>
                  <dd className="text-sm text-gray-900">{article.publishedSites}</dd>
                </div>
              )}
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h3>
            <div className="space-y-2">
              {article.status === 'published' && (
                <a
                  href={`/api/public/articles/${article.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full">
                    查看公开页面
                  </Button>
                </a>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigator.clipboard.writeText(article.slug)}
              >
                复制 Slug
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
