import React from 'react';
import Link from 'next/link';
import { AlertCircle, PenTool, CheckCircle2, Clock, CheckSquare, Square } from 'lucide-react';
import { clsx } from 'clsx';
import { FileItem } from '@/types/file-system';

interface DocumentItemProps {
  post: FileItem;
  isSelected: boolean;
  isSelectionMode: boolean;
  sortMethod: string;
  onToggleSelection?: (slug: string) => void;
  onDragStart?: (e: React.DragEvent, slug: string) => void;
  onContextMenu?: (e: React.MouseEvent, slug: string) => void;
}

const DocumentItem: React.FC<DocumentItemProps> = ({
  post,
  isSelected,
  isSelectionMode,
  sortMethod,
  onToggleSelection,
  onDragStart,
  onContextMenu
}) => {
  // Type to label mapping
  const typeLabels: Record<string, string> = {
    project: '项目',
    paper: '论文',
    knowledge: '知识',
    other: '其他'
  };

  // Type to color mapping
  const typeColors: Record<string, string> = {
    project: 'bg-blue-100 text-blue-700',
    paper: 'bg-green-100 text-green-700',
    knowledge: 'bg-purple-100 text-purple-700',
    other: 'bg-gray-100 text-gray-700'
  };

  // Get document type
  const type = post.type || 'project';

  if (isSelectionMode) {
    return (
      <div 
        key={post.slug}
        onClick={() => onToggleSelection?.(post.slug)}
        className={clsx(
          "block px-3 py-2 rounded-md transition-colors flex items-center gap-3 cursor-pointer select-none",
          isSelected ? "bg-primary/10" : "hover:bg-bg-page"
        )}
      >
        <div className={clsx("shrink-0", isSelected ? "text-primary" : "text-text-secondary")}>
          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Document Type Label */}
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColors[type] || typeColors.project}`}>
              {typeLabels[type] || typeLabels.project}
            </div>
            <div className={clsx("truncate font-medium", isSelected ? "text-primary" : "text-text-primary")}>{post.slug}</div>
            {/* Status Icons */}
            {(post.status === 'pending' || post.status === 'incomplete') && (
              <div title="未完成" className="text-amber-500 shrink-0"><AlertCircle size={14} /></div>
            )}
            {post.status === 'modified' && (
              <div title="已修改" className="text-blue-500 shrink-0"><PenTool size={14} /></div>
            )}
            {(post.status === 'done' || post.status === 'completed') && (
              <div title="已完成" className="text-green-600 shrink-0"><CheckCircle2 size={14} /></div>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-text-muted mt-0.5">
            <Clock size={10} />
            <span>{new Date(post.mtime).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      key={post.slug} 
      draggable={true}
      onDragStart={(e) => onDragStart?.(e, post.slug)}
      onContextMenu={(e) => onContextMenu?.(e, post.slug)}
      className="px-3 py-3 rounded-md hover:bg-bg-page transition-colors flex items-start gap-3 group relative"
    >
      <Link 
        href={`/editor/${post.slug}`}
        className="flex-1 flex items-start gap-3 min-w-0 text-sm text-text-primary/80 hover:text-text-primary transition-colors"
      >
        {/* Document Type Label */}
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[type] || typeColors.project} shrink-0 mt-0.5`}>
          {typeLabels[type] || typeLabels.project}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="truncate font-medium flex-1 pr-6">{post.slug}</div>
            <div className="flex items-center gap-2 shrink-0">
              {(post.status === 'pending' || post.status === 'incomplete') && (
                <div title="未完成" className="text-amber-500 shrink-0 p-1">
                  <AlertCircle size={16} />
                </div>
              )}
              {post.status === 'modified' && (
                <div title="已修改" className="text-blue-500 shrink-0 p-1">
                  <PenTool size={16} />
                </div>
              )}
              {(post.status === 'done' || post.status === 'completed') && (
                <div title="已完成" className="text-green-600 shrink-0 p-1">
                  <CheckCircle2 size={16} />
                </div>
              )}
            </div>
          </div>
          <div className="text-[12px] text-text-muted mt-1">
            {new Date(sortMethod === 'import' ? (post.birthtime || post.mtime) : post.mtime).toLocaleDateString()}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default React.memo(DocumentItem);
