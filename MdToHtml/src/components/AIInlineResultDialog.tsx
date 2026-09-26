'use client';

import React, { useEffect, useRef } from 'react';
import { X, Check, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────
// 类型
// ──────────────────────────────────────────

export interface AIInlineResultDialogProps {
  open: boolean;
  onClose: () => void;
  originalText: string;
  aiResult: string;
  isLoading: boolean;
  onReplace: (newText: string) => void;
}

// ──────────────────────────────────────────
// 组件
// ──────────────────────────────────────────

export const AIInlineResultDialog: React.FC<AIInlineResultDialogProps> = ({
  open,
  onClose,
  originalText,
  aiResult,
  isLoading,
  onReplace,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const editedResultRef = useRef<HTMLTextAreaElement>(null);
  const [editedText, setEditedText] = React.useState(aiResult);

  // 当 aiResult 变化时同步到编辑状态
  useEffect(() => {
    if (aiResult) {
      setEditedText(aiResult);
    }
  }, [aiResult]);

  // ESC 键关闭
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      // z-[10001] 确保弹窗在所有 UI 元素之上：
      // BottomToolbar z-[999], CheckpointPanel z-[100], Card context menu z-[10000]
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-800">AI 内联编辑 — 结果对比</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Loading State ── */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-500">AI 正在处理中...</p>
            <p className="text-xs text-slate-400">生成内容后将自动显示结果</p>
          </div>
        ) : (
          <>
            {/* ── 左右对比区域 ── */}
            <div className="flex-1 grid grid-cols-2 gap-0 min-h-0 overflow-hidden">
              {/* 左侧：原文 */}
              <div className="flex flex-col border-r border-slate-200">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-medium text-slate-500">原文</span>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                    {originalText}
                  </pre>
                </div>
              </div>

              {/* 右侧：AI 结果（可编辑） */}
              <div className="flex flex-col">
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                  <span className="text-xs font-medium text-blue-600">AI 结果</span>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <textarea
                    ref={editedResultRef}
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full h-full min-h-[200px] text-sm text-slate-800 bg-white border-0 resize-none focus:outline-none font-sans leading-relaxed"
                    placeholder="AI 结果将显示在这里..."
                  />
                </div>
              </div>
            </div>

            {/* ── Footer 操作按钮 ── */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0">
              <p className="text-xs text-slate-400">
                右侧 AI 结果可直接编辑微调
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => onReplace(editedText)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-1.5",
                    "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                  )}
                >
                  <Check className="w-4 h-4" />
                  替换
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIInlineResultDialog;