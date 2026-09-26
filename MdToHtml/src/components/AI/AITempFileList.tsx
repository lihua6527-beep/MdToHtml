'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import type { TempFileItem } from '@/services/ai/TempFileManager';

/** 格式化文件大小 */
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export interface AITempFileListProps {
  files: TempFileItem[];
  selectedFileId: string | null;
  onSelect: (id: string) => void;
  onOpenPreview: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveOne: (id: string) => void;   // 保存单个到左侧列表
  onSaveAll: () => void;
  onClearAll: () => void;
}

export const AITempFileList: React.FC<AITempFileListProps> = ({
  files,
  selectedFileId,
  onSelect,
  onOpenPreview,
  onDownload,
  onDelete,
  onSaveOne,
  onSaveAll,
  onClearAll,
}) => {
  if (files.length === 0) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 列表头部 */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
          📄 生成结果
          <span className="font-normal text-text-muted bg-bg-card px-1.5 py-0.5 rounded-full text-[10px]">
            {files.length}
          </span>
          <span className="font-normal text-text-muted text-[10px]">— 多版本并列</span>
        </div>
        <button
          onClick={onSaveAll}
          className="text-[10px] text-indigo-500 hover:text-indigo-700"
        >
          全部保存
        </button>
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-y-auto space-y-[2px]">
        {files.map((file) => {
          const isSelected = file.id === selectedFileId;
          return (
            <div
              key={file.id}
              onClick={() => onSelect(file.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                isSelected
                  ? 'bg-indigo-50 border-l-2 border-indigo-500'
                  : 'hover:bg-bg-card border-l-2 border-transparent'
              }`}
            >
              <span className="text-xs shrink-0">📄</span>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-xs truncate ${
                    isSelected ? 'text-indigo-700 font-semibold' : 'text-text-primary'
                  }`}
                >
                  {file.fileName}
                </div>
                <div className="flex gap-1 mt-0.5 items-center">
                  <span
                    className={`text-[9px] px-1.5 py-[1px] rounded font-medium ${
                      file.usedPrompt === 'default'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-pink-50 text-pink-600'
                    }`}
                  >
                    {file.usedPrompt === 'default' ? 'Prompt A' : 'Prompt B'}
                  </span>
                  <span className="text-[9px] px-1.5 py-[1px] rounded bg-sky-50 text-sky-600 font-medium">
                    Flash
                  </span>
                  <span className="text-[9px] text-text-muted ml-1 font-medium">
                    {formatSize(file.contentSize || 0)}
                  </span>
                </div>
              </div>
              <div
                className="flex items-center gap-0.5 transition-opacity"
                style={{ opacity: isSelected ? 1 : 0.4 }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveOne(file.id);
                  }}
                  className="w-6 h-6 flex items-center justify-center text-xs text-amber-600 hover:bg-amber-50 rounded"
                  title="保存到左侧文档列表"
                >
                  💾
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPreview(file.id);
                  }}
                  className="w-6 h-6 flex items-center justify-center text-xs text-indigo-500 hover:bg-indigo-50 rounded"
                  title="新页面渲染"
                >
                  🔗
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(file.id);
                  }}
                  className="w-6 h-6 flex items-center justify-center text-xs text-green-600 hover:bg-green-50 rounded"
                  title="下载 HTML"
                >
                  ⬇️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(file.id);
                  }}
                  className="w-6 h-6 flex items-center justify-center text-xs text-red-400 hover:bg-red-50 hover:text-red-600 rounded"
                  title="删除"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between shrink-0 pt-2 mt-2 border-t border-border-soft">
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
          <span>
            模型: <span className="font-medium">DeepSeek Flash ⚡</span>
          </span>
          <span className="bg-bg-card px-1.5 py-0.5 rounded text-[10px]">
            {files.length} 个临时文件
          </span>
        </div>
        <button
          onClick={onClearAll}
          className="text-[10px] text-text-muted hover:text-red-500"
        >
          🗑️ 清空所有
        </button>
      </div>
    </div>
  );
};