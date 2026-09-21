'use client';

/**
 * /ai-input — AI 编辑器实验页
 *
 * 现状：独立的调试页面，只承载实验版 AI 区域，用于快速迭代交互。
 *
 * 待办：正式接入后由首页「AI 模式」直接承载，本页作为独立调试入口保留。
 */

import React from 'react';
import { AIArea } from '@/components/AI/AIArea';

export default function AIInputPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      <header className="px-4 py-3 border-b border-border-soft bg-white">
        <h1 className="text-sm font-bold text-text-primary">AI 编辑器（实验）</h1>
      </header>
      <main className="max-w-3xl mx-auto p-4">
        <AIArea />
      </main>
    </div>
  );
}
