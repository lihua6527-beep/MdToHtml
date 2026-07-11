'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, FileText, Tag, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import type { FileItem } from '@/types/file-system';

interface SearchPanelProps {
  query: string;
  results: FileItem[];
  onSearch: (q: string) => void;
  onClear: () => void;
  onClose: () => void;
}

/** 高亮搜索关键词 */
function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5 text-inherit">{part}</mark>
      : part
  );
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  query,
  results,
  onSearch,
  onClear,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState(query);

  // 自动聚焦
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 同步外部 query 变化
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    onSearch(value);
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    onClear();
    inputRef.current?.focus();
  }, [onClear]);

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between shrink-0 pb-5 border-b border-border-soft mb-5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
            🔍 文档搜索
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-all border border-indigo-200"
        >
          ✕ 关闭搜索
        </button>
      </div>

      {/* 搜索框 */}
      <div className="shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={handleChange}
            placeholder="搜索文档标题、标签、文件名..."
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-bg-page border-2 border-primary/30 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-text-primary placeholder:text-text-muted"
          />
          {localQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 搜索结果统计 */}
      {localQuery && (
        <div className="shrink-0 mt-3 text-xs text-text-muted">
          找到 <span className="font-semibold text-text-primary">{results.length}</span> 个结果
        </div>
      )}

      {/* 搜索结果列表 */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-2">
        {!localQuery && (
          <div className="flex flex-col items-center justify-center h-40 text-text-muted/40">
            <Search className="w-12 h-12 mb-3" />
            <p className="text-sm">输入关键词搜索文档</p>
            <p className="text-xs mt-1">可搜索标题、标签、文件名、内容摘要</p>
          </div>
        )}

        {localQuery && results.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-text-muted">
            <FileText className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">未找到匹配的文档</p>
            <p className="text-xs mt-1 opacity-70">试试其他关键词？</p>
          </div>
        )}

        {localQuery && results.map((item) => (
          <a
            key={item.slug || item.name}
            href={`/editor/${item.slug || item.name?.replace(/\.md$/, '')}`}
            className="block px-4 py-3 rounded-xl bg-bg-card border border-border-soft hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-text-primary truncate">
                  {highlightText(item.slug || item.name || '', localQuery)}
                </div>
                {item.title && (
                  <div className="text-xs text-text-muted mt-0.5 truncate">
                    标题: {highlightText(item.title, localQuery)}
                  </div>
                )}
                {(item.tags && item.tags.length > 0) && (
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    <Tag className="w-3 h-3 text-text-muted" />
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg-page text-text-muted">
                        {highlightText(tag, localQuery)}
                      </span>
                    ))}
                  </div>
                )}
                {item.brief && (
                  <div className="text-[11px] text-text-muted mt-1 line-clamp-2">
                    {highlightText(item.brief, localQuery)}
                  </div>
                )}
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-text-muted">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(item.mtime).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* 底部提示 */}
      {localQuery && results.length > 0 && (
        <div className="shrink-0 pt-3 text-[10px] text-text-muted/50 text-center border-t border-border-soft mt-3">
          ⌘ 点击可打开文档 • Fuse.js 模糊搜索
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchPanel);