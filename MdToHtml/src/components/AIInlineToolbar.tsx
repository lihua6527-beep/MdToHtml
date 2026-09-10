'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, FileText, AlignLeft, Maximize2, Minus, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────
// 类型
// ──────────────────────────────────────────

export type AIActionType = 'polish' | 'expand' | 'summarize' | 'to_card' | 'custom';

interface AIInlineToolbarProps {
  /** 获取选中文本 */
  getSelection: () => string;
  /** 替换选中文本 */
  replaceSelection: (text: string) => void;
  /** 触发 AI 操作 */
  onAIAction: (action: AIActionType, selectedText: string, customPrompt?: string) => void;
  /** 是否正在加载 AI */
  isLoading: boolean;
}

// ──────────────────────────────────────────
// 预设操作按钮
// ──────────────────────────────────────────

interface ActionButton {
  type: AIActionType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const ACTIONS: ActionButton[] = [
  { type: 'polish', label: '润色', icon: <AlignLeft className="w-3.5 h-3.5" />, description: '修正语法，优化表达' },
  { type: 'expand', label: '扩充', icon: <Maximize2 className="w-3.5 h-3.5" />, description: '补充细节，丰富内容' },
  { type: 'summarize', label: '总结', icon: <Minus className="w-3.5 h-3.5" />, description: '提取要点，精简压缩' },
  { type: 'to_card', label: '转卡片', icon: <FileText className="w-3.5 h-3.5" />, description: '转为 CHD 卡片格式' },
];

// ──────────────────────────────────────────
// 组件
// ──────────────────────────────────────────

export const AIInlineToolbar: React.FC<AIInlineToolbarProps> = ({
  getSelection,
  onAIAction,
  isLoading,
}) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [customMode, setCustomMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 使用 mouseup 事件检测选中，而非 setInterval 轮询
  // 这避免了与卡片的 onSelect、React 渲染循环冲突导致的闪烁
  useEffect(() => {
    const handleMouseUp = () => {
      // 如果正在输入自定义指令，不干涉
      if (customMode) return;

      // 延迟检查，等待 DOM selection 稳定
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        const sel = getSelection();
        if (sel && sel.length >= 10) {
          const domSel = window.getSelection();
          if (domSel && domSel.rangeCount > 0) {
            const range = domSel.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // 只在有效的坐标范围显示
            if (rect.width > 0 && rect.height > 0) {
              setPosition({
                top: rect.top - 56,
                left: rect.left + rect.width / 2,
              });
              setSelectedText(sel);
              setVisible(true);
            }
          }
        } else {
          setVisible(false);
          setCustomMode(false);
        }
      }, 50); // 50ms 延迟让 selection 稳定后再检查
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC 关闭
      if (e.key === 'Escape') {
        setVisible(false);
        setCustomMode(false);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [getSelection, customMode]);

  // 点击工具栏内部不关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        // 只在非自定义模式下关闭
        if (!customMode) {
          setVisible(false);
        }
      }
    };
    if (visible) {
      setTimeout(() => window.addEventListener('click', handleClickOutside), 0);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [visible, customMode]);

  // 自定义指令输入框自动聚焦
  useEffect(() => {
    if (customMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [customMode]);

  const handleAction = (action: AIActionType) => {
    if (isLoading) return;
    onAIAction(action, selectedText);
    setVisible(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !customPrompt.trim()) return;
    onAIAction('custom', selectedText, customPrompt.trim());
    setCustomMode(false);
    setCustomPrompt('');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      ref={ref}
      className="fixed z-[200] animate-in fade-in slide-in-from-bottom-2 duration-100"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden backdrop-blur-sm">
        {/* 预设操作按钮 */}
        <div className="flex items-center p-1.5 gap-1">
          {ACTIONS.map((action) => (
            <button
              key={action.type}
              onClick={() => handleAction(action.type)}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                "text-slate-600 hover:text-blue-700 hover:bg-blue-50",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
              title={action.description}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}

          {/* 分隔线 */}
          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* 自定义指令 */}
          {!customMode ? (
            <button
              onClick={() => setCustomMode(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-600 hover:bg-purple-50 transition-colors"
              title="输入自定义指令"
            >
              <Send className="w-3.5 h-3.5" />
              <span>指令</span>
            </button>
          ) : (
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5">
              <input
                ref={inputRef}
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="输入指令（如：翻译成英文）"
                maxLength={50}
                className="w-40 px-2 py-1.5 text-xs border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
              />
              <button
                type="submit"
                disabled={!customPrompt.trim() || isLoading}
                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCustomMode(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* 选中文本预览 */}
        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 truncate max-w-[300px]">
            {selectedText.slice(0, 60)}{selectedText.length > 60 ? '...' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};