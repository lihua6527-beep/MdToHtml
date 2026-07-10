import React from 'react';
import Link from 'next/link';
import { Clock, CheckSquare, Square } from 'lucide-react';
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
  if (isSelectionMode) {
    return (
      <div 
        key={post.slug}
        onClick={() => onToggleSelection?.(post.slug)}
        className={clsx(
          "document-item-card px-3 py-2 flex items-center gap-3 cursor-pointer select-none",
          isSelected ? "bg-primary/15 border-primary/30 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]" : ""
        )}
      >
        <div className={clsx("shrink-0", isSelected ? "text-primary" : "text-text-secondary")}>
          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={clsx("truncate font-medium", isSelected ? "text-primary" : "text-text-primary")}>{post.slug}</div>
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
      className="document-item-card px-3 py-3 flex items-start gap-3 group relative"
    >
      <Link 
        href={`/editor/${post.slug}`}
        className="flex-1 flex items-start gap-3 min-w-0 text-sm text-text-primary/80 hover:text-text-primary transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="truncate font-medium flex-1 pr-2">{post.slug}</div>
            <div className="flex items-center gap-1.5 shrink-0">
              {post.isFavorited && <span className="text-[11px]" title="已收藏">⭐</span>}
              {post.isPinned && <span className="text-[11px]" title="已置顶">📌</span>}
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