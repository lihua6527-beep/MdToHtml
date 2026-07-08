import React, { Suspense } from 'react';
import { getAllPosts } from '@/lib/posts';

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
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
