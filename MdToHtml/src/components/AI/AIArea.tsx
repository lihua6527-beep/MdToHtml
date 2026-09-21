'use client';

/**
 * AIArea — AI 区域（实验版）
 *
 * 现状：只把「粘贴文本 → 调 /api/ai/generate（mock）→ 展示结果」跑通，
 *       用于确认交互流程与页面布局是否顺手。
 *
 * 待办（协作阶段）：模型与风格切换、临时文件列表、预览/下载/保存、
 *                   配置面板、编辑器内联编辑。
 */

import React, { useState, useCallback } from 'react';

export interface AIAreaProps {
  onClose?: () => void;
}

export const AIArea: React.FC<AIAreaProps> = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, promptVariant: 'default' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '生成失败');
      setOutput(data.markdown || '');
    } catch (err: any) {
      setError(err.message || '生成失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [input]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">实验版：生成结果为 mock 数据，真实模型接入中。</p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="粘贴需要转换的文本…"
        className="w-full h-32 p-3 text-sm border border-border-soft rounded-lg bg-white"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={handleGenerate}
          disabled={loading || !input.trim()}
          className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white disabled:opacity-50"
        >
          {loading ? '生成中…' : '生成（实验）'}
        </button>
      </div>

      {error && <div className="text-xs text-red-600">{error}</div>}

      {output && (
        <pre className="p-3 text-xs whitespace-pre-wrap bg-bg-card border border-border-soft rounded-lg">
          {output}
        </pre>
      )}
    </div>
  );
};
