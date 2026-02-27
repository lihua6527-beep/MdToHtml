'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, ChevronRight, Layout, PenTool, Clock, AlertCircle, CheckCircle2, Settings, Trash2, CheckSquare, Square, Eye, X, ArrowUpDown, Calendar, Monitor, Maximize2, Minimize2, Database } from 'lucide-react';
import { clsx } from 'clsx';
import { CHDRenderer } from './CHD/CHDRenderer';
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

interface DocumentListProps {
  initialPosts: FileItem[];
  onOpenSettings?: () => void;
  className?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({ initialPosts, onOpenSettings, className }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { error, isErrorVisible, handleError, clearError } = useErrorHandler();
  const { files: rawFiles, refresh } = useFiles(initialPosts);
  const { stats: capacityStats, refresh: refreshCapacity } = useCapacity();
  const [posts, setPosts] = useState<FileItem[]>(initialPosts);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; slug: string | null }>({ visible: false, x: 0, y: 0, slug: null });
  const [sortMethod, setSortMethod] = useLocalStorage<SortMethod>('chd_sort_method', 'import');
  
  // Layout State (Default: true for Wide Mode)
  const [isExpanded, setIsExpanded] = useLocalStorage<boolean>('chd_sidebar_expanded', true);
  
  // Batch selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [showSortSubmenu, setShowSortSubmenu] = useState(false);
  const [showCapacitySubmenu, setShowCapacitySubmenu] = useState(false);
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
      refresh();
      router.refresh();
    };
    window.addEventListener('app-paths-updated', handlePathsUpdated);
    return () => {
      window.removeEventListener('app-paths-updated', handlePathsUpdated);
    };
  }, [router, refresh]);

  useEffect(() => {
    // Client-side sorting
    try {
        const visitedStr = localStorage.getItem('visited_docs');
        const visitedMap: Record<string, number> = visitedStr ? JSON.parse(visitedStr) : {};

        const sorted = [...(rawFiles || [])].sort((a, b) => {
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

        setPosts(sorted);
    } catch (e) {
        console.error('Failed to sort posts', e);
    }
  }, [rawFiles, sortMethod]);

  useEffect(() => {
    if (!showSettingsMenu) {
        setShowSortSubmenu(false);
        setShowCapacitySubmenu(false);
    }
  }, [showSettingsMenu]);

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
        // showSortSubmenu will be handled by the effect above
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
    <div className={clsx("flex flex-col h-full bg-bg-card transition-all duration-300 border-r border-border-soft", isExpanded ? "w-[50vw]" : "w-64", className)}>
        <CapacityWarningDialog 
            isOpen={warningDialog.isOpen}
            onClose={() => setWarningDialog(prev => ({ ...prev, isOpen: false }))}
            message={warningDialog.message}
            onConfirmCleanup={warningDialog.onConfirm}
            cleanupLabel={warningDialog.cleanupLabel}
            isLoading={warningDialog.isLoading}
        />
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border-soft shrink-0 bg-bg-card z-10">
           {isSelectionMode ? (
             <div className="flex items-center gap-2 w-full">
                <button onClick={selectAll} className="text-text-secondary hover:text-text-primary">
                    {selectedSlugs.size === posts.length && posts.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <span className="text-sm font-medium text-text-primary flex-1">已选 {selectedSlugs.size} 项</span>
                <button 
                    onClick={() => performBatchDelete(false)} 
                    className="text-text-secondary hover:text-red-500 p-1"
                    title="仅删除源文件"
                    disabled={selectedSlugs.size === 0}
                >
                    <FileText size={18} />
                </button>
                <button 
                    onClick={() => performBatchDelete(true)} 
                    className="text-text-secondary hover:text-red-500 p-1"
                    title="删除源文件与输出"
                    disabled={selectedSlugs.size === 0}
                >
                    <Trash2 size={18} />
                </button>
                <button onClick={toggleSelectionMode} className="text-text-secondary hover:text-text-primary ml-2 text-sm">
                    取消
                </button>
             </div>
           ) : (
             <>
               <div className="flex items-center gap-2 font-bold text-text-primary">
                  <Layout className="w-5 h-5 text-primary" />
                  <span>文档列表</span>
               </div>
               <div className="flex items-center gap-1">
                   <button 
                     onClick={() => setIsExpanded(!isExpanded)}
                     className="text-text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-bg-page"
                     title={isExpanded ? "收起列表" : "展开列表"}
                   >
                     {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                   </button>
                   <button 
                     onClick={() => setShowRecycleBin(true)}
                     className="text-text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-bg-page"
                     title="回收站 (拖拽文档至此删除)"
                     onDrop={handleDropToTrash}
                     onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                   >
                     <Trash2 size={18} />
                   </button>
                   <button 
                     onClick={toggleSelectionMode}
                     className="text-text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-bg-page"
                     title="批量管理"
                   >
                     <CheckSquare size={18} />
                   </button>
               </div>
             </>
           )}
        </div>
        
        <CapacityProgressBar />

        {/* List */}
        <div className={clsx("flex-1 overflow-y-auto p-2", isExpanded ? "grid grid-cols-2 gap-2 content-start" : "space-y-1")}>
           {posts.map((post) => {
             const isSelected = selectedSlugs.has(post.slug);
             
             if (isSelectionMode) {
                 return (
                    <div 
                        key={post.slug}
                        onClick={() => toggleSlugSelection(post.slug)}
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
                               {(() => {
                                 const type = post.type || 'project';
                                 const typeLabels: Record<string, string> = {
                                   project: '项目',
                                   paper: '论文',
                                   knowledge: '知识分享',
                                   other: '其他文档'
                                 };
                                 const typeColors: Record<string, string> = {
                                   project: 'bg-blue-100 text-blue-700',
                                   paper: 'bg-green-100 text-green-700',
                                   knowledge: 'bg-purple-100 text-purple-700',
                                   other: 'bg-gray-100 text-gray-700'
                                 };
                                 return (
                                   <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColors[type] || typeColors.project}`}>
                                     {typeLabels[type] || typeLabels.project}
                                   </div>
                                 );
                               })()}
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
                   onDragStart={(e) => handleDragStart(e, post.slug)}
                   onContextMenu={(e) => handleContextMenu(e, post.slug)}
                   className="px-3 py-2 rounded-md hover:bg-bg-page transition-colors flex items-center gap-2 group relative"
                 >
                   <Link 
                     href={`/editor/${post.slug}`}
                     className="flex-1 flex items-center gap-2 min-w-0 text-sm text-text-primary/80 hover:text-text-primary transition-colors"
                   >
                       <FileText className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors shrink-0" />
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                              {/* Document Type Label */}
                              {(() => {
                                const type = post.type || 'project';
                                const typeLabels: Record<string, string> = {
                                  project: '项目',
                                  paper: '论文',
                                  knowledge: '知识分享',
                                  other: '其他文档'
                                };
                                const typeColors: Record<string, string> = {
                                  project: 'bg-blue-100 text-blue-700',
                                  paper: 'bg-green-100 text-green-700',
                                  knowledge: 'bg-purple-100 text-purple-700',
                                  other: 'bg-gray-100 text-gray-700'
                                };
                                return (
                                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColors[type] || typeColors.project}`}>
                                    {typeLabels[type] || typeLabels.project}
                                  </div>
                                );
                              })()}
                              <div className="truncate font-medium">{post.slug}</div>
                              {(post.status === 'pending' || post.status === 'incomplete') && (
                                <div title="未完成" className="text-amber-500 shrink-0">
                                    <AlertCircle size={14} />
                                </div>
                              )}
                              {post.status === 'modified' && (
                                <div title="已修改" className="text-blue-500 shrink-0">
                                    <PenTool size={14} />
                                </div>
                              )}
                              {(post.status === 'done' || post.status === 'completed') && (
                                <div title="已完成" className="text-green-600 shrink-0">
                                    <CheckCircle2 size={14} />
                                </div>
                              )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-text-muted mt-0.5">
                               {sortMethod === 'import' ? <Calendar size={10} /> : <Clock size={10} />}
                               <span>{new Date(sortMethod === 'import' ? (post.birthtime || post.mtime) : post.mtime).toLocaleDateString()}</span>
                           </div>
                       </div>
                   </Link>
                   
                   {/* Preview Button Removed */}
                    
                   <ChevronRight className="w-3 h-3 text-text-secondary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
             );
           })}
        </div>

        {/* Context Menu (Single Item) */}
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
              onClick={() => performDelete(contextMenu.slug!, false)}
            >
              <FileText className="w-4 h-4" />
              仅删除源文件
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-bg-page transition-colors text-red-600 flex items-center gap-2"
              onClick={() => performDelete(contextMenu.slug!, true)}
            >
              <Trash2 className="w-4 h-4" />
              删除源文件与输出
            </button>
          </div>
        )}

        {/* Settings Footer */}
        <div className="p-4 border-t border-border-soft shrink-0 relative">
           {showSettingsMenu && (
               <div 
                className="absolute bottom-16 left-4 w-56 bg-bg-card border border-border-soft rounded-lg shadow-xl p-2 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
               >
                   {/* File Path Button */}
                   <button 
                       onClick={() => {
                           setShowSettingsMenu(false);
                           onOpenSettings?.();
                       }}
                       className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-bg-page transition-colors flex items-center gap-2 text-text-primary mb-1"
                   >
                       <Settings className="w-4 h-4 text-text-secondary" />
                       <span>文件路径</span>
                   </button>

                   {/* Capacity Settings (With Submenu) */}
                   <div className="relative mb-1">
                       <button 
                           onClick={(e) => {
                               e.stopPropagation();
                               setShowCapacitySubmenu(!showCapacitySubmenu);
                               setShowSortSubmenu(false); // Close other submenu
                           }}
                           className={clsx("w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between", showCapacitySubmenu ? "bg-bg-page text-primary" : "hover:bg-bg-page text-text-primary")}
                       >
                           <div className="flex items-center gap-2">
                               <Database className="w-4 h-4 text-text-secondary" />
                               <span>存储容量</span>
                           </div>
                           <div className="flex items-center gap-1">
                               <span className="text-xs text-text-muted">{capacityLimit}</span>
                               <ChevronRight className={clsx("w-3 h-3 text-text-muted transition-transform", showCapacitySubmenu && "rotate-90")} />
                           </div>
                       </button>

                       {/* Capacity Submenu */}
                       {showCapacitySubmenu && (
                           <div 
                               className="absolute left-full bottom-0 ml-2 w-40 bg-bg-card border border-border-soft rounded-lg shadow-xl p-2 animate-in fade-in slide-in-from-left-2 z-50 max-h-60 overflow-y-auto"
                               onClick={(e) => e.stopPropagation()}
                           >
                               {[
                                   { value: 20, label: '20 (极简)' },
                                   { value: 50, label: '50 (轻量)' },
                                   { value: 100, label: '100 (标准)' },
                                   { value: 200, label: '200 (专业)' },
                                   { value: 300, label: '300 (扩容)' },
                                   { value: 500, label: '500 (极限)' }
                               ].map(option => (
                                   <button 
                                       key={option.value}
                                       onClick={() => updateCapacity(option.value)}
                                       className={clsx(
                                           "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                                           capacityLimit === option.value ? "bg-primary/10 text-primary" : "hover:bg-bg-page text-text-primary"
                                       )}
                                   >
                                       <span>{option.label}</span>
                                       {capacityLimit === option.value && <CheckCircle2 className="w-3 h-3" />}
                                   </button>
                               ))}
                           </div>
                       )}
                   </div>

                   {/* Sort Method (With Submenu) */}
                   <div className="relative">
                       <button 
                           onClick={(e) => {
                               e.stopPropagation();
                               setShowSortSubmenu(!showSortSubmenu);
                               setShowCapacitySubmenu(false); // Close other submenu
                           }}
                           className={clsx("w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between", showSortSubmenu ? "bg-bg-page text-primary" : "hover:bg-bg-page text-text-primary")}
                       >
                           <div className="flex items-center gap-2">
                               <ArrowUpDown className="w-4 h-4 text-text-secondary" />
                               <span>排序方式</span>
                           </div>
                           <ChevronRight className={clsx("w-3 h-3 text-text-muted transition-transform", showSortSubmenu && "rotate-90")} />
                       </button>

                       {/* Submenu */}
                       {showSortSubmenu && (
                           <div 
                               className="absolute left-full bottom-0 ml-2 w-48 bg-bg-card border border-border-soft rounded-lg shadow-xl p-2 animate-in fade-in slide-in-from-left-2 z-50"
                               onClick={(e) => e.stopPropagation()}
                           >
                               <button 
                                   onClick={() => { setSortMethod('import'); setShowSettingsMenu(false); }}
                                   className={clsx("w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2", sortMethod === 'import' ? "bg-primary/10 text-primary" : "hover:bg-bg-page text-text-primary")}
                               >
                                   <Calendar className="w-4 h-4" />
                                   <span>导入时间</span>
                                   {sortMethod === 'import' && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                               </button>
                               <button 
                                   onClick={() => { setSortMethod('modified'); setShowSettingsMenu(false); }}
                                   className={clsx("w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2", sortMethod === 'modified' ? "bg-primary/10 text-primary" : "hover:bg-bg-page text-text-primary")}
                               >
                                   <Clock className="w-4 h-4" />
                                   <span>修改时间</span>
                                   {sortMethod === 'modified' && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                               </button>
                               <button 
                                   onClick={() => { setSortMethod('visited'); setShowSettingsMenu(false); }}
                                   className={clsx("w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2", sortMethod === 'visited' ? "bg-primary/10 text-primary" : "hover:bg-bg-page text-text-primary")}
                               >
                                   <Eye className="w-4 h-4" />
                                   <span>最近访问</span>
                                   {sortMethod === 'visited' && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                               </button>
                           </div>
                       )}
                   </div>
               </div>
           )}

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
