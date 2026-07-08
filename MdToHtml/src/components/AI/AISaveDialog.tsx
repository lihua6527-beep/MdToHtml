'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

export interface AISaveDialogProps {
  open: boolean;
  unsavedCount: number;
  unsavedFileNames: string[];
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const AISaveDialog: React.FC<AISaveDialogProps> = ({
  open,
  unsavedCount,
  unsavedFileNames,
  onSave,
  onDiscard,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-sm w-[90%] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-2">
          ⚠️ 是否保存临时文档？
        </h3>
        <p className="text-xs text-text-secondary mb-3 leading-relaxed">
          您有以下未保存的 AI 生成文档，关闭后将丢失：
        </p>

        {/* 文件列表 */}
        <div className="bg-bg-card rounded-lg px-3 py-2 mb-4 max-h-[120px] overflow-y-auto">
          {unsavedFileNames.map((name, i) => (
            <div key={i} className="text-xs text-text-primary py-1 flex items-center gap-1.5">
              <span>📄</span>
              <span className="truncate">{name}</span>
            </div>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onDiscard}>
            🗑️ 不保存
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>
            取消
          </Button>
          <Button variant="default" size="sm" onClick={onSave}>
            💾 保存
          </Button>
        </div>
      </div>
    </div>
  );
};