'use client';

import { useState, useEffect } from 'react';
import { Zap, Clock, CheckCircle, XCircle, RefreshCw, Filter, Search, Play, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Website {
  id: string;
  name: string;
  domain: string;
}

interface GenerationTask {
  id: string;
  type: string;
  status: string;
  model: string;
  tokensUsed: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  website: {
    id: string;
    name: string;
    domain: string;
  } | null;
  keywordPlan: {
    id: string;
    keyword: string;
  } | null;
  article: {
    id: string;
    title: string;
  } | null;
}

export default function GenerationTasksPage() {
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // 获取生成任务列表
  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedWebsite) params.append('websiteId', selectedWebsite);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/generation-tasks?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.data.tasks);
      }
    } catch (error) {
      console.error('获取生成任务列表失败:', error);
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

  // 手动触发生成任务
  const triggerGeneration = async () => {
    if (!confirm('确定要手动触发文章生成任务吗？')) return;

    try {
      setRefreshing(true);
      const response = await fetch('/api/cron/generate-articles', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`生成任务已启动：${data.message}`);
        fetchTasks();
      } else {
        alert(data.message || '触发失败');
      }
    } catch (error) {
      console.error('触发生成任务失败:', error);
      alert('触发失败');
    } finally {
      setRefreshing(false);
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'processing':
        return '处理中';
      case 'pending':
        return '等待中';
      case 'failed':
        return '失败';
      default:
        return '未知';
    }
  };

  // 计算持续时间
  const getDuration = (startedAt: string | null, completedAt: string | null): string => {
    if (!startedAt) return '-';
    
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) return `${duration}秒`;
    if (duration < 3600) return `${Math.round(duration / 60)}分钟`;
    return `${Math.round(duration / 3600)}小时`;
  };

  useEffect(() => {
    Promise.all([fetchTasks(), fetchWebsites()]).finally(() => {
      setLoading(false);
    });
  }, [selectedWebsite, selectedStatus]);

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
          <h1 className="text-3xl font-bold text-gray-900">生成任务</h1>
          <p className="text-gray-600 mt-2">查看文章自动生成任务的执行历史</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchTasks}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button onClick={triggerGeneration} disabled={refreshing}>
            <Play className="w-4 h-4 mr-2" />
            {refreshing ? '执行中...' : '手动执行'}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">总任务数</div>
              <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">已完成</div>
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(task => task.status === 'completed').length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">处理中</div>
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(task => task.status === 'processing').length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">失败</div>
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(task => task.status === 'failed').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜索关键词或文章..."
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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">所有状态</option>
            <option value="pending">等待中</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
            <option value="failed">失败</option>
          </select>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </Button>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  任务信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  关键词/文章
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  性能
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks
                .filter(task => {
                  if (!searchTerm) return true;
                  const searchLower = searchTerm.toLowerCase();
                  return (
                    task.keywordPlan?.keyword.toLowerCase().includes(searchLower) ||
                    task.article?.title.toLowerCase().includes(searchLower)
                  );
                })
                .map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 text-blue-500 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {task.type === 'auto' ? '自动任务' : '手动任务'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {task.website?.name} ({task.website?.domain})
                        </div>
                        <div className="text-xs text-gray-400">
                          {task.model}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      {task.keywordPlan && (
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          关键词: {task.keywordPlan.keyword}
                        </div>
                      )}
                      {task.article && (
                        <div className="text-sm text-blue-600">
                          文章: {task.article.title}
                        </div>
                      )}
                      {!task.keywordPlan && !task.article && (
                        <div className="text-sm text-gray-500">暂无关联内容</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(task.status)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {getStatusText(task.status)}
                      </span>
                    </div>
                    {task.errorMessage && (
                      <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={task.errorMessage}>
                        {task.errorMessage}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>Tokens: {task.tokensUsed?.toLocaleString() || 0}</div>
                      <div className="text-gray-500">
                        耗时: {getDuration(task.startedAt, task.completedAt)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>创建: {formatDate(task.createdAt)}</div>
                      {task.startedAt && (
                        <div>开始: {formatDate(task.startedAt)}</div>
                      )}
                      {task.completedAt && (
                        <div>完成: {formatDate(task.completedAt)}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {task.article && (
                        <Link href={`/admin/articles/${task.article.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <Zap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">没有生成任务</h3>
            <p className="mt-1 text-sm text-gray-500">系统还没有执行任何文章生成任务。</p>
            <div className="mt-6">
              <Button onClick={triggerGeneration}>
                <Play className="w-4 h-4 mr-2" />
                手动执行任务
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
