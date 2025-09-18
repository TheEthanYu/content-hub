import Link from 'next/link';
import { FileText, FolderOpen, Home, Settings } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 侧边栏 */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Content Hub
            </Link>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link
              href="/"
              className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Home className="w-5 h-5 mr-3" />
              首页
            </Link>
            <Link
              href="/admin/articles"
              className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FileText className="w-5 h-5 mr-3" />
              文章管理
            </Link>
            <Link
              href="/admin/categories"
              className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FolderOpen className="w-5 h-5 mr-3" />
              分类管理
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-5 h-5 mr-3" />
              系统设置
            </Link>
          </nav>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="ml-64">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
