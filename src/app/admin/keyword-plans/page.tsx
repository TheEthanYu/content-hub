'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Upload, Hash, BarChart3, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { formatDate, getKeywordPlanStatusColor, getKeywordPlanStatusText } from '@/lib/utils';

interface Website {
  id: string;
  name: string;
  domain: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface KeywordPlan {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  competition: string | null;
  status: string;
  priority: number;
  generatedAt: string | null;
  createdAt: string;
  website: {
    id: string;
    name: string;
    domain: string;
  } | null;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export default function KeywordPlansPage() {
  const [keywordPlans, setKeywordPlans] = useState<KeywordPlan[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 分页状态
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  
  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // 导入表单状态
  const [importData, setImportData] = useState({
    websiteId: '',
    categoryId: '',
    content: '',
    importSource: 'excel'
  });
  const [importing, setImporting] = useState(false);

  // 手动添加表单状态
  const [addForm, setAddForm] = useState({
    keyword: '',
    websiteId: '',
    categoryId: '',
    searchVolume: '',
    difficulty: '',
    competition: 'medium',
    priority: '1'
  });
  const [adding, setAdding] = useState(false);

  // 获取关键词计划列表
  const fetchKeywordPlans = async (page = pagination.page) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (selectedWebsite) params.append('websiteId', selectedWebsite);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/keyword-plans?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setKeywordPlans(data.data.keywordPlans);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('获取关键词计划列表失败:', error);
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

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedWebsite) params.append('websiteId', selectedWebsite);
      
      const response = await fetch(`/api/categories?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
    }
  };

  // 获取特定网站的分类列表
  const fetchCategoriesByWebsite = async (websiteId: string) => {
    try {
      const response = await fetch(`/api/categories?websiteId=${websiteId}`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
    }
  };

  // 下载Excel模板
  const downloadTemplate = () => {
    const csvContent = `关键词,搜索量,难度,竞争程度,优先级
"如何提高网站SEO",1000,45,medium,1
"关键词研究工具",800,50,high,2
"内容营销策略",1200,40,low,1
"网站优化技巧",900,35,medium,2`;

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', '关键词导入模板.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(prev => ({ ...prev, content }));
      };
      reader.readAsText(file);
    }
  };

  // 导入关键词
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!importData.websiteId || !importData.content) {
      alert('请选择网站并上传文件或输入关键词');
      return;
    }

    try {
      setImporting(true);
      const response = await fetch('/api/keyword-plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importData),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        setShowImportForm(false);
        setImportData({
          websiteId: '',
          categoryId: '',
          content: '',
          importSource: 'excel'
        });
        fetchKeywordPlans(1); // 导入成功后回到第一页
      } else {
        alert(data.message || '导入失败');
      }
    } catch (error) {
      console.error('导入关键词失败:', error);
      alert('导入失败');
    } finally {
      setImporting(false);
    }
  };

  // 手动添加关键词
  const handleAddKeyword = async () => {
    if (!addForm.keyword.trim()) {
      alert('请输入关键词');
      return;
    }
    if (!addForm.websiteId) {
      alert('请选择网站');
      return;
    }
    if (!addForm.categoryId) {
      alert('请选择分类');
      return;
    }

    try {
      setAdding(true);
      const response = await fetch('/api/keyword-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: addForm.keyword.trim(),
          websiteId: addForm.websiteId,
          categoryId: addForm.categoryId,
          searchVolume: addForm.searchVolume ? parseInt(addForm.searchVolume) : null,
          difficulty: addForm.difficulty ? parseInt(addForm.difficulty) : null,
          competition: addForm.competition || null,
          priority: parseInt(addForm.priority),
          status: 'pending'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('关键词添加成功');
        setShowAddForm(false);
        setAddForm({
          keyword: '',
          websiteId: '',
          categoryId: '',
          searchVolume: '',
          difficulty: '',
          competition: 'medium',
          priority: '1'
        });
        fetchKeywordPlans(1); // 添加成功后回到第一页
      } else {
        alert(data.message || '添加失败');
      }
    } catch (error) {
      console.error('添加关键词失败:', error);
      alert('添加失败');
    } finally {
      setAdding(false);
    }
  };

  // 删除关键词计划
  const deleteKeywordPlan = async (id: string) => {
    if (!confirm('确定要删除这个关键词计划吗？')) return;

    try {
      const response = await fetch(`/api/keyword-plans/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        fetchKeywordPlans(); // 删除后刷新当前页
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除关键词计划失败:', error);
      alert('删除失败');
    }
  };

  useEffect(() => {
    Promise.all([fetchKeywordPlans(1), fetchWebsites()]).finally(() => {
      setLoading(false);
    });
  }, [searchTerm, selectedWebsite, selectedCategory, selectedStatus]);

  useEffect(() => {
    if (selectedWebsite) {
      fetchCategories();
    } else {
      setCategories([]);
    }
  }, [selectedWebsite]);

  useEffect(() => {
    if (importData.websiteId) {
      fetchCategories();
    }
  }, [importData.websiteId]);

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
          <h1 className="text-3xl font-bold text-gray-900">关键词计划</h1>
          <p className="text-gray-600 mt-2">管理SEO关键词，规划文章生成</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            下载模板
          </Button>
          <Button variant="outline" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            添加关键词
          </Button>
          <Button onClick={() => setShowImportForm(true)}>
            <Upload className="w-4 h-4 mr-2" />
            导入关键词
          </Button>
        </div>
      </div>

      {/* 导入表单 */}
      {showImportForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">导入关键词</h2>
          <form onSubmit={handleImport} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择网站 *
                </label>
                <select
                  value={importData.websiteId}
                  onChange={(e) => setImportData(prev => ({ ...prev, websiteId: e.target.value, categoryId: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  选择分类（可选）
                </label>
                <select
                  value={importData.categoryId}
                  onChange={(e) => setImportData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!importData.websiteId}
                >
                  <option value="">请选择分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                上传CSV文件或手动输入
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <Textarea
                  value={importData.content}
                  onChange={(e) => setImportData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="或者直接粘贴关键词，每行一个，或使用逗号分隔"
                  rows={6}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                支持CSV文件或直接输入。CSV格式：关键词,搜索量,难度,竞争程度,优先级
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button type="submit" disabled={importing}>
                {importing ? '导入中...' : '导入关键词'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowImportForm(false)} disabled={importing}>
                取消
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 手动添加表单 */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">添加关键词</h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择网站 *
                </label>
                <select
                  value={addForm.websiteId}
                  onChange={(e) => {
                    setAddForm(prev => ({ ...prev, websiteId: e.target.value, categoryId: '' }));
                    if (e.target.value) {
                      fetchCategoriesByWebsite(e.target.value);
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  选择分类 *
                </label>
                <select
                  value={addForm.categoryId}
                  onChange={(e) => setAddForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!addForm.websiteId}
                >
                  <option value="">请选择分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关键词 *
              </label>
              <Input
                placeholder="请输入关键词"
                value={addForm.keyword}
                onChange={(e) => setAddForm(prev => ({ ...prev, keyword: e.target.value }))}
              />
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  搜索量
                </label>
                <Input
                  type="number"
                  placeholder="月搜索量"
                  value={addForm.searchVolume}
                  onChange={(e) => setAddForm(prev => ({ ...prev, searchVolume: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  难度 (0-100)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="SEO难度"
                  value={addForm.difficulty}
                  onChange={(e) => setAddForm(prev => ({ ...prev, difficulty: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  竞争程度
                </label>
                <select
                  value={addForm.competition}
                  onChange={(e) => setAddForm(prev => ({ ...prev, competition: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级 (1-5)
                </label>
                <select
                  value={addForm.priority}
                  onChange={(e) => setAddForm(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">1 (最高)</option>
                  <option value="2">2 (高)</option>
                  <option value="3">3 (中)</option>
                  <option value="4">4 (低)</option>
                  <option value="5">5 (最低)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button onClick={handleAddKeyword} disabled={adding}>
                {adding ? '添加中...' : '添加关键词'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜索关键词..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedWebsite}
            onChange={(e) => setSelectedWebsite(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">所有网站</option>
            {websites.map((website) => (
              <option key={website.id} value={website.id}>
                {website.name}
              </option>
            ))}
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedWebsite}
          >
            <option value="">所有分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">所有状态</option>
            <option value="pending">待生成</option>
            <option value="processing">生成中</option>
            <option value="generated">已生成</option>
            <option value="failed">生成失败</option>
          </select>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </Button>
        </div>
      </div>

      {/* 关键词列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  关键词
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  数据
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  网站/分类
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
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
              {keywordPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Hash className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {plan.keyword}
                        </div>
                        <div className="text-sm text-gray-500">
                          优先级: {plan.priority}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <BarChart3 className="w-4 h-4 text-blue-500 mr-1" />
                        搜索量: {plan.searchVolume?.toLocaleString()}
                      </div>
                      <div className="text-gray-500">
                        难度: {plan.difficulty}/100
                        {plan.competition && ` | ${plan.competition}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      {plan.website && (
                        <div className="text-sm font-medium text-gray-900">
                          {plan.website.name}
                        </div>
                      )}
                      {plan.category && (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: plan.category.color + '20',
                            color: plan.category.color,
                          }}
                        >
                          {plan.category.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getKeywordPlanStatusColor(plan.status)}`}>
                        {plan.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {plan.status === 'generated' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {plan.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                        {getKeywordPlanStatusText(plan.status)}
                      </span>
                    </div>
                    {plan.generatedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(plan.generatedAt)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(plan.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteKeywordPlan(plan.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {keywordPlans.length === 0 && (
          <div className="text-center py-12">
            <Hash className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">没有关键词计划</h3>
            <p className="mt-1 text-sm text-gray-500">开始导入你的第一批关键词吧。</p>
            <div className="mt-6">
              <Button onClick={() => setShowImportForm(true)}>
                <Upload className="w-4 h-4 mr-2" />
                导入关键词
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 分页组件 */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => fetchKeywordPlans(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchKeywordPlans(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              下一页
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                显示第 <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> 到{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                条，共 <span className="font-medium">{pagination.total}</span> 条结果
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="分页">
                <Button
                  variant="outline"
                  onClick={() => fetchKeywordPlans(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  上一页
                </Button>
                
                {/* 页码按钮 */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      onClick={() => fetchKeywordPlans(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === pagination.page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  onClick={() => fetchKeywordPlans(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  下一页
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
