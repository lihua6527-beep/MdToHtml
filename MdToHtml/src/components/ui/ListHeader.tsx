import React from 'react';
import { Layout, Minimize2, Maximize2, Trash2, CheckSquare, Search, Database } from 'lucide-react';
import { clsx } from 'clsx';
import SelectionMode from './SelectionMode';

interface ListHeaderProps {
  isSelectionMode: boolean;
  selectedSlugs: Set<string>;
  posts: any[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onToggleRecycleBin: () => void;
  onToggleSelectionMode: () => void;
  onSelectAll: () => void;
  onBatchDelete: (deleteOutput: boolean) => void;
  onDropToTrash: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onSearch?: () => void;
  onCapacityClick?: () => void;
}

const ListHeader: React.FC<ListHeaderProps> = ({
  isSelectionMode,
  selectedSlugs,
  posts,
  isExpanded,
  onToggleExpanded,
  onToggleRecycleBin,
  onToggleSelectionMode,
  onSelectAll,
  onBatchDelete,
  onDropToTrash,
  onDragOver,
  onSearch,
  onCapacityClick
}) => {
  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-border-soft shrink-0 bg-bg-card z-10">
      {isSelectionMode ? (
        <SelectionMode
          selectedCount={selectedSlugs.size}
          totalCount={posts.length}
          onSelectAll={onSelectAll}
          onBatchDelete={onBatchDelete}
          onCancel={onToggleSelectionMode}
          disabled={selectedSlugs.size === 0}
        />
      ) : (
        <>
          <div className="flex items-center gap-2 font-bold text-text-primary">
            <Layout className="w-5 h-5 text-primary shrink-0" />
            <span className={clsx("transition-all duration-300 overflow-hidden", isExpanded ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0")}>文档列表</span>
          </div>
          <div className="flex items-center gap-1">
            {onCapacityClick && (
              <button 
                onClick={onCapacityClick}
                className="text-text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-bg-page"
                title="存储容量管理"
              >
                <Database size={18} />
              </button>
            )}
            <button 
              onClick={onSearch}
              className="text-text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-bg-page"
              title="搜索文档"
            >
              <Search size={18} />
            </button>
            <button 
              onClick={onToggleExpanded}
              className="text-text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-bg-page"
              title={isExpanded ? "收起列表" : "展开列表"}
            >
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button 
              onClick={onToggleRecycleBin}
              className="text-text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-bg-page"
              title="回收站 (拖拽文档至此删除)"
              onDrop={onDropToTrash}
              onDragOver={onDragOver}
            >
              <Trash2 size={18} />
            </button>
            <button 
              onClick={onToggleSelectionMode}
              className="text-text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-bg-page"
              title="批量管理"
            >
              <CheckSquare size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(ListHeader);