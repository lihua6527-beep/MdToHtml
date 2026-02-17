import React from 'react';
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { DocumentList } from '@/components/DocumentList';

export default function Home() {
  const posts = getAllPosts();

  return (
    <div className="flex h-screen bg-bg-page overflow-hidden transition-colors duration-300">
      {/* Left Sidebar */}
      <div className="w-64 bg-bg-card border-r border-border-soft flex flex-col shrink-0 transition-colors duration-300">
        <DocumentList initialPosts={posts} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8 flex justify-between items-start">
             <div>
               <h1 className="text-3xl font-bold text-text-primary mb-2">欢迎使用 CHD Renderer</h1>
               <p className="text-text-secondary">请从左侧选择文档进行预览。</p>
             </div>
             {/* ThemeSwitcher removed from homepage as requested */}
          </header>
          
          {/* Main content area left empty as requested */}
          <div className="min-h-[200px] flex flex-col gap-4 items-center justify-center text-text-secondary/50 border-2 border-dashed border-border-soft rounded-xl">
             <p className="text-lg">请点击左侧文档列表开始编辑</p>
             <p className="text-sm opacity-70">支持实时预览与智能编辑</p>
          </div>
        </div>
      </div>
    </div>
  );
}
