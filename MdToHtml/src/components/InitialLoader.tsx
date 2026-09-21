'use client';

import { useEffect } from 'react';

/**
 * InitialLoader - 客户端组件
 * 在 React 完成首次渲染后，平滑隐藏初始加载指示器
 */
export default function InitialLoader() {
  useEffect(() => {
    const loader = document.getElementById('initial-loader');
    if (loader) {
      // 先淡出，再移除 DOM
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        loader.remove();
      }, 400);
    }
  }, []);

  return null; // 此组件不渲染任何可见内容
}