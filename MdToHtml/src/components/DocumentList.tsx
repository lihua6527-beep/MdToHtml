'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, ChevronRight, Layout, PenTool, Clock, AlertCircle, CheckCircle2, Settings } from 'lucide-react';
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

  return (
    <div className="flex flex-col h-full">
        <div className="h-14 flex items-center px-4 border-b border-border-soft shrink-0">
           <div className="flex items-center gap-2 font-bold text-text-primary">
              <Layout className="w-5 h-5 text-primary" />
              <span>文档列表</span>
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
           {posts.map((post) => (
             <Link 
               key={post.slug} 
               href={`/${post.slug}`}
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
           ))}
        </div>

        <div className="p-4 border-t border-border-soft shrink-0 relative">
           {/* Settings Menu Popup */}
           {showSettingsMenu && (
               <div className="absolute bottom-16 left-4 w-48 bg-bg-card border border-border-soft rounded-lg shadow-xl p-1 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
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
             onClick={() => setShowSettingsMenu(!showSettingsMenu)}
             className="flex items-center gap-2 w-full px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-page rounded-md transition-colors text-sm font-medium"
           >
             <Settings className="w-4 h-4" />
             设置
           </button>
        </div>
    </div>
  );
};