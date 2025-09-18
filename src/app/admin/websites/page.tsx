'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Globe, Settings, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { formatDate } from '@/lib/utils';

interface Website {
  id: string;
  name: string;
  domain: string;
  description: string | null;
  url: string;
  defaultLanguage: string;
  timezone: string;
  autoGenerateEnabled: boolean;
  generateInterval: number;
  maxArticlesPerDay: number;
  isActive: boolean;
  createdAt: string;
}

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
    url: '',
    defaultLanguage: 'zh-CN',
    timezone: 'Asia/Shanghai',
    autoGenerateEnabled: false,
    generateInterval: 24,
    maxArticlesPerDay: 5,
  });

  // 获取网站列表
  const fetchWebsites = async () => {
    try {
      const response = await fetch('/api/websites');
      const data = await response.json();
      
      if (data.success) {
        setWebsites(data.data);
      }
    } catch (error) {
      console.error('获取网站列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingWebsite ? `/api/websites/${editingWebsite.id}` : '/api/websites';
      const method = editingWebsite ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        fetchWebsites();
        resetForm();
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      alert('操作失败');
    }
  };

  // 删除网站
  const deleteWebsite = async (id: string) => {
    if (!confirm('确定要删除这个网站吗？删除后相关的分类和文章也会受到影响。')) return;

    try {
      const response = await fetch(`/api/websites/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        fetchWebsites();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除网站失败:', error);
      alert('删除失败');
    }
  };

  // 编辑网站
  const editWebsite = (website: Website) => {
    setEditingWebsite(website);
    setFormData({
      name: website.name,
      domain: website.domain,
      description: website.description || '',
      url: website.url,
      defaultLanguage: website.defaultLanguage,
      timezone: website.timezone,
      autoGenerateEnabled: website.autoGenerateEnabled,
      generateInterval: website.generateInterval,
      maxArticlesPerDay: website.maxArticlesPerDay,
    });
    setShowForm(true);
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      domain: '',
      description: '',
      url: '',
      defaultLanguage: 'zh-CN',
      timezone: 'Asia/Shanghai',
      autoGenerateEnabled: false,
      generateInterval: 24,
      maxArticlesPerDay: 5,
    });
    setEditingWebsite(null);
    setShowForm(false);
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">网站管理</h1>
          <p className="text-gray-600 mt-2">管理你的网站配置和设置</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          添加网站
        </Button>
      </div>

      {/* 创建/编辑表单 */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingWebsite ? '编辑网站' : '添加网站'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  网站名称 *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入网站名称"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  域名 *
                </label>
                <Input
                  value={formData.domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="example.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                网站URL *
              </label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                网站描述
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入网站描述（可选）"
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  默认语言
                </label>
                <select
                  value={formData.defaultLanguage}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultLanguage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="zh-TW">繁体中文</option>
                  <option value="en-US">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  时区
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Asia/Shanghai">Asia/Shanghai</option>
                  <option value="Asia/Hong_Kong">Asia/Hong_Kong</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-900 mb-3">自动生成设置</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.autoGenerateEnabled}
                      onChange={(e) => setFormData(prev => ({ ...prev, autoGenerateEnabled: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">启用自动文章生成</span>
                  </label>
                </div>
                
                {formData.autoGenerateEnabled && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        生成间隔（小时）
                      </label>
                      <Input
                        type="number"
                        value={formData.generateInterval}
                        onChange={(e) => setFormData(prev => ({ ...prev, generateInterval: parseInt(e.target.value) || 24 }))}
                        min="1"
                        max="168"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        每天最大生成数
                      </label>
                      <Input
                        type="number"
                        value={formData.maxArticlesPerDay}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxArticlesPerDay: parseInt(e.target.value) || 5 }))}
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button type="submit">
                {editingWebsite ? '更新网站' : '创建网站'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                取消
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 网站列表 */}
      <div className="grid gap-6">
        {websites.map((website) => (
          <div key={website.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{website.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    website.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {website.isActive ? '活跃' : '已停用'}
                  </span>
                  {website.autoGenerateEnabled && (
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      自动生成
                    </span>
                  )}
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">域名: {website.domain}</p>
                    <p className="text-sm text-gray-600">URL: 
                      <a href={website.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                        {website.url}
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">语言: {website.defaultLanguage}</p>
                    <p className="text-sm text-gray-600">时区: {website.timezone}</p>
                  </div>
                </div>

                {website.description && (
                  <p className="text-sm text-gray-700 mb-4">{website.description}</p>
                )}

                {website.autoGenerateEnabled && (
                  <div className="text-sm text-gray-600 mb-4">
                    <p>每 {website.generateInterval} 小时生成文章，每天最多 {website.maxArticlesPerDay} 篇</p>
                  </div>
                )}

                <p className="text-xs text-gray-500">创建时间: {formatDate(website.createdAt)}</p>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Link href={`/admin/categories?websiteId=${website.id}`}>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editWebsite(website)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteWebsite(website.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {websites.length === 0 && (
        <div className="text-center py-12">
          <Globe className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">没有网站</h3>
          <p className="mt-1 text-sm text-gray-500">开始创建你的第一个网站吧。</p>
          <div className="mt-6">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加网站
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
