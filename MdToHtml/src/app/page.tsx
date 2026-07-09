import React, { Suspense } from 'react';
import { getAllPosts } from '@/lib/posts';

// 加载中的旋转动画组件（与 loading.tsx 风格统一）
function PageLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-page">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-indigo-600">C</span>
          </div>
        </div>
        <p className="text-sm text-text-muted animate-pulse">正在加载页面内容...</p>
      </div>
    </div>
  );
}

// 用 async 组件实现服务端数据获取
async function HomeContent() {
  let posts: any[] = [];
  try {
    posts = getAllPosts();
  } catch (e) {
    // 静默失败，客户端会自己获取
  }
  
  const HomeClient = (await import('@/components/HomeClient')).HomeClient;
  return <HomeClient initialPosts={posts} />;
}

export default function Home() {
  return (
    <Suspense fallback={<PageLoading />}>
      <HomeContent />
    </Suspense>
  );
}
