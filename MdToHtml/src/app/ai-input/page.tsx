'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIArea } from '@/components/AI/AIArea';

/**
 * AI 智能转换独立页面
 * 
 * 阶段一用途：
 * - 独立于现有系统的前端开发与测试环境
 * - 使用模拟数据验证完整交互链路
 * - 不调后端 API，不修改任何现有文件
 * 
 * 后续轮次：
 * - 阶段二：对接真实后端服务
 * - 阶段三：此页面废弃，AI 功能合并到 HomeClient.tsx 右侧
 */
export default function AIInputPage() {
  const router = useRouter();
  const [showExitDialog, setShowExitDialog] = useState(false);

  /** 处理页面关闭提示（有临时文件时） */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 简单检测：如果页面有生成的文件，提示用户
      // 后续轮次会接入 TempFileManager 精确判断
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <div className="min-h-screen bg-bg-page">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-border-soft">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
              返回
            </Link>
            <span className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              AI 智能转换
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted bg-bg-card px-2 py-1 rounded-full border border-border-soft">
              阶段一 · 模拟数据
            </span>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-full mx-auto px-2 py-4">
        <AIArea />
      </main>

      {/* 阶段标识（极简） */}
      <div className="fixed bottom-3 right-3 text-[9px] text-text-muted/30 select-none">
        阶段一 · 模拟数据
      </div>
    </div>
  );
}