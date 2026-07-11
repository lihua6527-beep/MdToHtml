'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Trash2, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useFiles, useCapacity } from '../hooks/useFileSystem';
import { CapacityProgressBar } from './CapacityProgressBar';
import { RecycleBin } from './RecycleBin';
import { CapacityWarningDialog } from './CapacityWarningDialog';
import { FileItem, SortMethod } from '../types/file-system';
import { DEFAULT_CAPACITY } from '../lib/constants';
import { ConfigService } from '@/services/ConfigService';
import { TrashService } from '@/services/TrashService';
import { FileService } from '@/services/FileService';
import { useToast } from '@/components/ui/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import DocumentItem from '@/components/ui/DocumentItem';
import ListHeader from '@/components/ui/ListHeader';
import SettingsMenu from '@/components/ui/SettingsMenu';

interface DocumentListProps {
  initialPosts: FileItem[];
  onOpenSettings?: (type: 'file' | 'render' | 'protocol' | 'ai') => void;
  onSearch?: () => void;
  searchQuery?: string;
  className?: string;
}

const DocumentListComponent: React.FC<DocumentListProps> = ({ initialPosts, onOpenSettings, onSearch, searchQuery, className }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { error, isErrorVisible, handleError, clearError } = useErrorHandler();
  const { files: rawFiles, refresh } = useFiles(initialPosts);
  const { stats: capacityStats, refresh: refreshCapacity } = useCapacity();
  const [posts, setPosts] = useState<FileItem[]>(initialPosts);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; slug: string | null }>({ visible: false, x: 0, y: 0, slug: null });
  const [sortMethod, setSortMethod] = useLocalStorage<SortMethod>('chd_sort_method', 'import');
  
  // 收藏 & 置顶状态（localStorage 存储）
  const [pinnedDocs, setPinnedDocs] = useLocalStorage<Record<string, number>>('chd_pinned_docs', {});
  const [favoritedDocs, setFavoritedDocs] = useLocalStorage<string[]>('chd_favorited_docs', []);

  const isPinned = useCallback((slug: string) => slug in pinnedDocs, [pinnedDocs]);
  const isFavorited = useCallback((slug: string) => favoritedDocs.includes(slug), [favoritedDocs]);

  const togglePin = useCallback((slug: string) => {
    setPinnedDocs(prev => {
      const next = { ...prev };
      if (slug in next) {
        delete next[slug];
      } else {
        next[slug] = Date.now(); // 最新置顶的数值最大
      }
      return next;
    });
  }, [setPinnedDocs]);

  const toggleFavorite = useCallback((slug: string) => {
    setFavoritedDocs(prev => {
      if (prev.includes(slug)) {
        return prev.filter(s => s !== slug);
      }
      return [...prev, slug];
    });
  }, [setFavoritedDocs]);

  // Layout State (Default: true for Wide Mode)
  const [isExpanded, setIsExpanded] = useLocalStorage<boolean>('chd_sidebar_expanded', true);
  
  // 将 localStorage 中的状态合并到 posts 中
  const enrichedPosts = useMemo(() => {
    return (rawFiles || []).map(p => ({
      ...p,
      isPinned: p.slug in pinnedDocs,
      isFavorited: favoritedDocs.includes(p.slug),
      pinOrder: pinnedDocs[p.slug] || 0,
    }));
  }, [rawFiles, pinnedDocs, favoritedDocs]);
  
  // Batch selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const capacityLimit = capacityStats?.limit || DEFAULT_CAPACITY;
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [warningDialog, setWarningDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    isLoading?: boolean;
    cleanupLabel?: string;
  }>({ isOpen: false, message: '', onConfirm: () => {}, isLoading: false, cleanupLabel: '' });

  useEffect(() => {
    const handlePathsUpdated = () => {
      console.log('Received app-paths-updated event, refreshing files and capacity');
      refresh();
      refreshCapacity();
      router.refresh();
    };
    window.addEventListener('app-paths-updated', handlePathsUpdated);
    return () => {
      window.removeEventListener('app-paths-updated', handlePathsUpdated);
    };
  }, [router, refresh, refreshCapacity]);

  // Client-side sorting with useMemo — 置顶文档排在最前面，再按原有排序
  const sortedPosts = useMemo(() => {
    try {
        let visitedMap: Record<string, number> = {};
        // Check if localStorage is available (not in server-side rendering)
        if (typeof window !== 'undefined' && window.localStorage) {
            const visitedStr = localStorage.getItem('visited_docs');
            visitedMap = visitedStr ? JSON.parse(visitedStr) : {};
        }

        return [...(enrichedPosts || [])].sort((a, b) => {
            // 置顶文档优先
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            if (a.isPinned && b.isPinned) {
                // 同为置顶按 pinOrder 降序（最后置顶的排最上面）
                return (b.pinOrder || 0) - (a.pinOrder || 0);
            }

            if (sortMethod === 'visited') {
                const timeA = visitedMap[a.slug] || 0;
                const timeB = visitedMap[b.slug] || 0;
                if (timeA !== timeB) return timeB - timeA;
                return b.mtime - a.mtime;
            } else if (sortMethod === 'import') {
                // Import time (birthtime) descending
                const timeA = a.birthtime || a.mtime;
                const timeB = b.birthtime || b.mtime;
                return timeB - timeA;
            } else {
                // Modified time descending
                return b.mtime - a.mtime;
            }
        });
    } catch (e) {
        console.error('Failed to sort posts', e);
        return enrichedPosts || [];
    }
  }, [enrichedPosts, sortMethod]);

  useEffect(() => {
    setPosts(sortedPosts);
  }, [sortedPosts]);

  const updateCapacity = async (limit: number) => {
    try {
        const success = await ConfigService.updateCapacityLimit(limit);
        
        if (success) {
            refreshCapacity();
            setShowSettingsMenu(false);
            toast({
                title: "容量已更新",
                description: `存储容量限制已设置为 ${limit} 个文件`,
                type: "success"
            });
        } else {
            toast({
                title: "更新失败",
                description: "无法更新存储容量限制",
                type: "error"
            });
        }
    } catch (e) {
        console.error('Error updating capacity:', e);
        const appError = handleError(e);
        toast({
            title: "更新出错",
            description: appError.message,
            type: "error"
        });
    }
  };

  useEffect(() => {
    const handleGlobalClick = () => {
        setContextMenu(prev => ({ ...prev, visible: false }));
        setShowSettingsMenu(false);
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('contextmenu', handleGlobalClick); // Close on right click elsewhere
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('contextmenu', handleGlobalClick);
    };
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSelectionMode) return; // Disable context menu in selection mode
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, slug });
  }, [isSelectionMode]);

  const performDelete = useCallback(async (slug: string, deleteOutput: boolean, skipConfirm = false) => {
    if (!skipConfirm) {
        const confirmText = deleteOutput ? `确认将"${slug}"的 Markdown 与输出HTML移入回收站？` : `确认将"${slug}"的 Markdown 源文件移入回收站？`;
        if (!confirm(confirmText)) return;
    }
    try {
      const success = await FileService.deleteFile(slug, deleteOutput);
      
      if (success) {
        toast({
            title: "已移入回收站",
            description: `文档 "${slug}" 已成功删除`,
            type: "success"
        });
        // SWR auto-updates, but we can also trigger manual refresh if needed
        // refresh(); 
      } else {
        toast({
            title: "删除失败",
            description: "无法删除文档，请重试",
            type: "error"
        });
      }
    } catch (err) {
      console.error('Delete failed', err);
      const appError = handleError(err);
      toast({
          title: "删除出错",
          description: appError.message,
          type: "error"
      });
    } finally {
      setContextMenu(prev => ({ ...prev, visible: false }));
    }
  }, [toast, handleError]);

  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    setSelectedSlugs(new Set());
  };

  const toggleSlugSelection = (slug: string) => {
    const newSet = new Set(selectedSlugs);
    if (newSet.has(slug)) {
      newSet.delete(slug);
    } else {
      newSet.add(slug);
    }
    setSelectedSlugs(newSet);
  };

  const performBatchDelete = async (deleteOutput: boolean) => {
    if (selectedSlugs.size === 0) return;
    const confirmText = deleteOutput 
        ? `确认删除选中的 ${selectedSlugs.size} 个文档（Markdown 与输出HTML）？此操作不可撤销。` 
        : `确认删除选中的 ${selectedSlugs.size} 个文档（仅 Markdown 源文件）？此操作不可撤销。`;
    
    if (!confirm(confirmText)) return;

    try {
      const slugs = Array.from(selectedSlugs);
      const success = await FileService.deleteMultipleFiles(slugs, deleteOutput);

      if (success) {
        toast({
            title: "批量删除成功",
            description: `已删除 ${slugs.length} 个文档`,
            type: "success"
        });
        setSelectedSlugs(new Set());
        setIsSelectionMode(false);
      } else {
        toast({
            title: "批量删除失败",
            description: "部分文档可能未被删除",
            type: "error"
        });
      }
    } catch (err) {
        console.error('Batch delete failed', err);
        const appError = handleError(err);
        toast({
            title: "批量删除出错",
            description: appError.message,
            type: "error"
        });
    }
  };

  const selectAll = () => {
    if (selectedSlugs.size === posts.length) {
        setSelectedSlugs(new Set());
    } else {
        setSelectedSlugs(new Set(posts.map(p => p.slug)));
    }
  };

  const handleDragStart = (e: React.DragEvent, slug: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'document', slug }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropToTrash = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
        const { type, slug } = JSON.parse(data);
        if (type !== 'document' || !slug) return;

        // Check trash capacity
        const stats = await TrashService.getTrashStats();
        
        if (stats.count >= 500) {
            setWarningDialog({
                isOpen: true,
                message: `回收站已满（${stats.count}/500）。无法继续删除。建议先清理回收站中最早的文件。`,
                cleanupLabel: '删除回收站最早文件',
                onConfirm: async () => {
                    setWarningDialog(prev => ({ ...prev, isLoading: true }));
                    try {
                        // Find oldest file in trash
                        const files = await TrashService.getTrashFiles();
                        if (files && files.length > 0) {
                            // Sort by deletedAt ascending (oldest first)
                            files.sort((a: any, b: any) => a.deletedAt - b.deletedAt);
                            const oldest = files[0];
                            
                            // Delete oldest
                            await TrashService.deleteFiles([oldest.name]);

                            // Proceed with original delete
                            await performDelete(slug, false, true); 
                            setWarningDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
                        }
                    } catch (err) {
                        console.error('Cleanup failed', err);
                        const appError = handleError(err);
                        toast({
                            title: "清理失败",
                            description: appError.message || "无法清理回收站",
                            type: "error"
                        });
                        setWarningDialog(prev => ({ ...prev, isLoading: false }));
                    }
                }
            });
            return;
        }

        // Normal delete
        await performDelete(slug, false, true);
    } catch (e) {
        console.error('Drag drop failed', e);
        const appError = handleError(e);
        toast({
            title: "操作失败",
            description: appError.message || "无法移动到回收站",
            type: "error"
        });
    }
  };

  const refreshList = async () => {
      // 1. Trigger server refresh
      router.refresh();
      
      // 2. Fetch latest list manually to update UI immediately
      refresh();
  };

  if (showRecycleBin) {
    return (
        <RecycleBin 
            onClose={() => {
                setShowRecycleBin(false);
                refreshList();
            }} 
            onRestore={() => {
                refreshList();
            }}
            className={clsx(isExpanded ? "w-[50vw]" : "w-64", className)}
            documentCount={posts.length}
            capacityLimit={capacityLimit}
            onDeleteOldestDocuments={async (count: number) => {
                if (count <= 0) return;
                // Find oldest documents
                const sorted = [...posts].sort((a, b) => {
                     const timeA = a.birthtime || a.mtime;
                     const timeB = b.birthtime || b.mtime;
                     return timeA - timeB; // Ascending: oldest first
                });
                
                const toDelete = sorted.slice(0, count);
                if (toDelete.length > 0) {
                    await Promise.all(toDelete.map(p => performDelete(p.slug, false, true)));
                }
            }}
        />
    );
  }

  return (
    <div className={clsx("flex flex-col h-full bg-transparent transition-all duration-300 border-r border-border-soft", isExpanded ? "w-[50vw]" : "w-64", className)}>
        <CapacityWarningDialog 
            isOpen={warningDialog.isOpen}
            onClose={() => setWarningDialog(prev => ({ ...prev, isOpen: false }))}
            message={warningDialog.message}
            onConfirmCleanup={warningDialog.onConfirm}
            cleanupLabel={warningDialog.cleanupLabel}
            isLoading={warningDialog.isLoading}
        />
        
        {/* Header */}
        <ListHeader
          isSelectionMode={isSelectionMode}
          selectedSlugs={selectedSlugs}
          posts={posts}
          isExpanded={isExpanded}
          onToggleExpanded={() => setIsExpanded(!isExpanded)}
          onToggleRecycleBin={() => setShowRecycleBin(true)}
          onToggleSelectionMode={toggleSelectionMode}
          onSelectAll={selectAll}
          onBatchDelete={performBatchDelete}
          onDropToTrash={handleDropToTrash}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onSearch={onSearch}
        />
        
        <CapacityProgressBar />

        {/* List */}
        <div className={clsx("flex-1 overflow-y-auto p-3", isExpanded ? "grid grid-cols-2 gap-3 content-start" : "space-y-3")}>
           {posts.map((post) => {
             const isSelected = selectedSlugs.has(post.slug);
             
             return (
               <DocumentItem
                 key={post.slug}
                 post={post}
                 isSelected={isSelected}
                 isSelectionMode={isSelectionMode}
                 sortMethod={sortMethod}
                 onToggleSelection={toggleSlugSelection}
                 onDragStart={handleDragStart}
                 onContextMenu={handleContextMenu}
               />
             );
           })}
        </div>

        {/* Context Menu (Single Item) — 收藏/置顶/删除 */}
        {contextMenu.visible && contextMenu.slug && !isSelectionMode && (
          <div
            className="fixed z-50 w-56 bg-bg-card border border-border-soft rounded-lg shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y + 4, left: contextMenu.x + 4 }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="px-2 py-1.5 text-xs text-text-secondary border-b border-border-soft mb-1 truncate font-mono">
                {contextMenu.slug}
            </div>
            <button
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-bg-page transition-colors text-text-primary flex items-center gap-2"
              onClick={() => { toggleFavorite(contextMenu.slug!); setContextMenu(prev => ({ ...prev, visible: false })); }}
            >
              <span className="w-4 h-4 flex items-center justify-center">{isFavorited(contextMenu.slug!) ? '⭐' : '☆'}</span>
              {isFavorited(contextMenu.slug!) ? '取消收藏' : '收藏'}
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-bg-page transition-colors text-text-primary flex items-center gap-2"
              onClick={() => { togglePin(contextMenu.slug!); setContextMenu(prev => ({ ...prev, visible: false })); }}
            >
              <span className="w-4 h-4 flex items-center justify-center">{isPinned(contextMenu.slug!) ? '📌' : '📍'}</span>
              {isPinned(contextMenu.slug!) ? '取消置顶' : '置顶'}
            </button>
            <div className="border-t border-border-soft my-1" />
            <button
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-bg-page transition-colors text-red-600 flex items-center gap-2"
              onClick={() => { setContextMenu(prev => ({ ...prev, visible: false })); performDelete(contextMenu.slug!, true); }}
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </div>
        )}

        {/* Settings Footer */}
        <div className="p-4 border-t border-border-soft shrink-0 relative">
           <SettingsMenu
             isVisible={showSettingsMenu}
             onClose={() => setShowSettingsMenu(false)}
             onOpenSettings={onOpenSettings}
           />

           <button 
             onClick={(e) => {
                 e.stopPropagation();
                 setShowSettingsMenu(!showSettingsMenu);
             }}
             className="flex items-center gap-2 w-full px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-page rounded-md transition-colors text-sm font-medium"
             title="设置 (S)"
           >
             <Settings className="w-4 h-4" />
             设置
           </button>
        </div>
    </div>
  );
};

export const DocumentList = React.memo(DocumentListComponent);
