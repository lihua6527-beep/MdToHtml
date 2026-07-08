import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-page">
      <div className="flex flex-col items-center gap-6 max-w-sm">
        {/* Logo 动画 */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-indigo-600">C</span>
          </div>
        </div>

        {/* 标题 */}
        <h2 className="text-xl font-bold text-text-primary">CHD Renderer</h2>

        {/* 加载步骤提示 */}
        <div className="w-full space-y-2 text-sm text-text-muted">
          <LoadingStep label="正在加载文档目录" delay="0s" />
          <LoadingStep label="正在加载整体布局" delay="1.2s" />
          <LoadingStep label="正在加载网页格式" delay="2.4s" />
          <LoadingStep label="正在加载编辑器组件" delay="3.6s" />
          <LoadingStep label="准备就绪" delay="4.8s" />
        </div>
      </div>
    </div>
  );
}

function LoadingStep({ label, delay }: { label: string; delay: string }) {
  return (
    <div
      className="flex items-center gap-3 animate-pulse"
      style={{ animationDelay: delay, animationDuration: '2s' }}
    >
      <span className="w-2 h-2 bg-indigo-400 rounded-full" />
      <span>{label}</span>
    </div>
  );
}