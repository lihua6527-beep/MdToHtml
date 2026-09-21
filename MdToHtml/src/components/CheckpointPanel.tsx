'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bookmark, 
  Clock, 
  RotateCcw, 
  Plus,
  ChevronDown,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────
// 类型
// ──────────────────────────────────────────

interface CheckpointInfo {
  id: string;
  label: string;
  timestamp: number;
}

interface CheckpointPanelProps {
  /** 获取所有暂存点 */
  getCheckpoints: () => CheckpointInfo[];
  /** 跳转到指定暂存点 */
  goToCheckpoint: (checkpointId: string) => string | null;
  /** 创建暂存点 */
  setCheckpoint: (label: string) => void;
}

// ──────────────────────────────────────────
// 时间格式化
// ──────────────────────────────────────────

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return '刚刚';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ──────────────────────────────────────────
// 组件：暂存点列表弹窗
// ──────────────────────────────────────────

interface CheckpointListProps {
  checkpoints: CheckpointInfo[];
  onGoTo: (id: string) => void;
  onClose: () => void;
}

const CheckpointList: React.FC<CheckpointListProps> = ({
  checkpoints,
  onGoTo,
  onClose,
}) => {
  // 点击外部关闭
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // 延迟绑定，避免触发当前点击
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 shadow-xl rounded-xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <History className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-800">暂存点</span>
        <span className="text-xs text-slate-400 ml-auto">{checkpoints.length} 个</span>
      </div>

      {/* List */}
      <div className="max-h-64 overflow-y-auto">
        {checkpoints.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            暂无暂存点
          </div>
        ) : (
          checkpoints.map((cp, index) => (
            <button
              key={cp.id}
              onClick={() => {
                onGoTo(cp.id);
                onClose();
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-start gap-3 group"
            >
              {/* Icon */}
              <div className={cn(
                "mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                index === 0
                  ? "bg-blue-100 text-blue-600"
                  : "bg-slate-100 text-slate-500"
              )}>
                {index === 0 ? (
                  <Clock className="w-3.5 h-3.5" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">
                  {cp.label}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {formatTime(cp.timestamp)}
                </div>
              </div>

              {/* Action */}
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                <RotateCcw className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────
// 组件：命名暂存点弹窗
// ──────────────────────────────────────────

interface CheckpointNamerProps {
  onSave: (label: string) => void;
  onClose: () => void;
  /** 默认标签建议 */
  defaultLabel?: string;
}

const CheckpointNamer: React.FC<CheckpointNamerProps> = ({
  onSave,
  onClose,
  defaultLabel = '',
}) => {
  const [label, setLabel] = useState(defaultLabel);
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (trimmed) {
      onSave(trimmed);
      onClose();
    }
  };

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-xl z-[100] animate-in fade-in zoom-in-95 duration-150"
    >
      <form onSubmit={handleSubmit} className="p-4">
        <div className="text-sm font-semibold text-slate-800 mb-2">
          保存暂存点
        </div>
        <input
          ref={inputRef}
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="给当前状态命名..."
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          maxLength={50}
        />
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!label.trim()}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            保存
          </button>
        </div>
      </form>
    </div>
  );
};

// ──────────────────────────────────────────
// 主组件
// ──────────────────────────────────────────

export const CheckpointPanel: React.FC<CheckpointPanelProps> = ({
  getCheckpoints,
  goToCheckpoint,
  setCheckpoint,
}) => {
  const [showList, setShowList] = useState(false);
  const [showNamer, setShowNamer] = useState(false);
  const [checkpoints, setCheckpoints] = useState<CheckpointInfo[]>([]);

  // 刷新列表
  const refresh = () => {
    setCheckpoints(getCheckpoints());
  };

  // 打开列表时刷新
  const handleToggleList = () => {
    refresh();
    setShowList((v) => !v);
    setShowNamer(false);
  };

  // 打开命名弹窗
  const handleOpenNamer = (e: React.MouseEvent) => {
    e.stopPropagation();
    refresh();
    setShowNamer(true);
    setShowList(false);
  };

  // 创建暂存点
  const handleSaveCheckpoint = (label: string) => {
    setCheckpoint(label);
    // 短暂延迟后刷新列表
    setTimeout(refresh, 100);
  };

  // 跳转到暂存点
  const handleGoTo = (id: string) => {
    goToCheckpoint(id);
    // 跳转后刷新列表
    setTimeout(refresh, 100);
  };

  return (
    <div className="relative">
      {/* 暂存点入口按钮组 */}
      <div className="flex items-center gap-1">
        {/* 创建暂存点 */}
        <button
          onClick={handleOpenNamer}
          className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="保存暂存点"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* 查看暂存点列表 */}
        <button
          onClick={handleToggleList}
          className={cn(
            "h-8 w-8 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors",
            showList && "bg-slate-100 text-slate-800"
          )}
          title="查看暂存点"
        >
          <Bookmark className="w-4 h-4" />
        </button>
      </div>

      {/* 暂存点列表弹窗 */}
      {showList && (
        <CheckpointList
          checkpoints={checkpoints}
          onGoTo={handleGoTo}
          onClose={() => setShowList(false)}
        />
      )}

      {/* 命名暂存点弹窗 */}
      {showNamer && (
        <CheckpointNamer
          onSave={handleSaveCheckpoint}
          onClose={() => setShowNamer(false)}
          defaultLabel={`进度 ${checkpoints.length}`}
        />
      )}
    </div>
  );
};