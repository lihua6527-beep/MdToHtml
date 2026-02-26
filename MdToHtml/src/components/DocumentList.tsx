'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FileText, ChevronRight, Layout, PenTool, Clock, AlertCircle, CheckCircle2, Settings, Trash2, CheckSquare, Square } from 'lucide-react';
import { clsx } from 'clsx';

interface Post {
  slug: string;
  mtime: number;
  status?: string;
}

interface DocumentListProps {
  initialPosts: Post[];
  onOpenSettings?: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ initialPosts, onOpenSettings }) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; slug: string | null }>({ visible: false, x: 0, y: 0, slug: null });
  
  // Batch selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Client-side sorting based on 'Recently Visited'
    try {
        const visitedStr = localStorage.getItem('visited_docs');
        const visitedMap: Record<string, number> = visitedStr ? JSON.parse(visitedStr) : {};

        const sorted = [...initialPosts].sort((a, b) => {
            const timeA = visitedMap[a.slug] || 0;
            const timeB = visitedMap[b.slug] || 0;

            // 1. Visited time (Recent first)
            if (timeA !== timeB) {
                return timeB - timeA;
            }

            // 2. Modified time (Recent first)
            return b.mtime - a.mtime;
        });

        setPosts(sorted);
    } catch (e) {
        console.error('Failed to sort posts', e);
    }
  }, [initialPosts]);

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

  const performDelete = useCallback(async (slug: string, deleteOutput: boolean) => {
    const confirmText = deleteOutput ? `确认删除“${slug}”的 Markdown 与输出HTML？此操作不可撤销。` : `确认删除“${slug}”的 Markdown 源文件？此操作不可撤销。`;
    if (!confirm(confirmText)) return;
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, deleteOutput })
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.slug !== slug));
      } else {
        alert('删除失败');
      }
    } catch (err) {
      console.error('Delete failed', err);
      alert('删除出错');
    } finally {
      setContextMenu(prev => ({ ...prev, visible: false }));
    }
  }, []);

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
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs: Array.from(selectedSlugs), deleteOutput })
      });

      if (res.ok) {
        setPosts(prev => prev.filter(p => !selectedSlugs.has(p.slug)));
        setSelectedSlugs(new Set());
        setIsSelectionMode(false);
      } else {
        alert('批量删除失败');
      }
    } catch (err) {
        console.error('Batch delete failed', err);
        alert('批量删除出错');
    }
  };

  const selectAll = () => {
    if (selectedSlugs.size === posts.length) {
        setSelectedSlugs(new Set());
    } else {
        setSelectedSlugs(new Set(posts.map(p => p.slug)));
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-card">
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
               <button 
                 onClick={toggleSelectionMode}
                 className="text-text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-bg-page"
                 title="批量管理"
               >
                 <CheckSquare size={18} />
               </button>
             </>
           )}
        </div>
        
        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
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
                <Link 
                   key={post.slug} 
                   href={`/${post.slug}`}
                   onContextMenu={(e) => handleContextMenu(e, post.slug)}
                   className="block px-3 py-2 rounded-md hover:bg-bg-page text-sm text-text-primary/80 hover:text-text-primary transition-colors flex items-center gap-2 group"
                 >
                   <FileText className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
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
                           <Clock size={10} />
                           <span>{new Date(post.mtime).toLocaleDateString()}</span>
                       </div>
                   </div>
                   <ChevronRight className="w-3 h-3 text-text-secondary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </Link>
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
                className="absolute bottom-16 left-4 w-48 bg-bg-card border border-border-soft rounded-lg shadow-xl p-1 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
               >
                   <button 
                       onClick={() => {
                           setShowSettingsMenu(false);
                           onOpenSettings?.();
                       }}
                       className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-bg-page transition-colors flex items-center gap-2 text-text-primary"
                   >
                       <Settings className="w-4 h-4 text-text-secondary" />
                       <span>文件路径</span>
                   </button>
               </div>
           )}

           <button 
             onClick={(e) => {
                 e.stopPropagation();
                 setShowSettingsMenu(!showSettingsMenu);
             }}
             className="flex items-center gap-2 w-full px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-page rounded-md transition-colors text-sm font-medium"
           >
             <Settings className="w-4 h-4" />
             设置
           </button>
        </div>
    </div>
  );
};
