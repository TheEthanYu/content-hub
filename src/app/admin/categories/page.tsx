'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { formatDate } from '@/lib/utils';

interface Website {
  id: string;
  name: string;
  domain: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  createdAt: string;
  websiteId: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    websiteId: '',
  });

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedWebsite) {
        params.append('websiteId', selectedWebsite);
      }
      
      const response = await fetch(`/api/categories?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        fetchCategories();
        resetForm();
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      alert('操作失败');
    }
  };

  // 删除分类
  const deleteCategory = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？')) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        fetchCategories();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除分类失败:', error);
      alert('删除失败');
    }
  };

  // 编辑分类
  const editCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      websiteId: category.websiteId || '',
    });
    setShowForm(true);
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      websiteId: '',
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  useEffect(() => {
    fetchWebsites();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [selectedWebsite]);

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
          <h1 className="text-3xl font-bold text-gray-900">分类管理</h1>
          <p className="text-gray-600 mt-2">管理文章分类</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          创建分类
        </Button>
      </div>

      {/* 网站筛选 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              筛选网站
            </label>
            <select
              value={selectedWebsite}
              onChange={(e) => setSelectedWebsite(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有网站</option>
              {websites.map((website) => (
                <option key={website.id} value={website.id}>
                  {website.name} ({website.domain})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 创建/编辑表单 */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingCategory ? '编辑分类' : '创建分类'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择网站 *
                </label>
                <select
                  value={formData.websiteId}
                  onChange={(e) => setFormData(prev => ({ ...prev, websiteId: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">请选择网站</option>
                  {websites.map((website) => (
                    <option key={website.id} value={website.id}>
                      {website.name} ({website.domain})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类名称 *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入分类名称"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类颜色
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-10 h-10 rounded border border-gray-300"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分类描述
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入分类描述（可选）"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button type="submit">
                {editingCategory ? '更新分类' : '创建分类'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                取消
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 分类列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分类名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  网站
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  描述
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  颜色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {category.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const site = websites.find(w => w.id === category.websiteId);
                      return (
                        <>
                          <div className="text-sm text-gray-900">{site?.name || '未关联'}</div>
                          <div className="text-sm text-gray-500">{site?.domain || ''}</div>
                        </>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {category.description || '暂无描述'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-6 h-6 rounded border border-gray-300 mr-2"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-gray-600">{category.color}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(category.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editCategory(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCategory(category.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {categories.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">没有分类</h3>
            <p className="mt-1 text-sm text-gray-500">开始创建你的第一个分类吧。</p>
            <div className="mt-6">
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                创建分类
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
