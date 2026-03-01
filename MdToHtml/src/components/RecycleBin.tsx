'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { FileText, Trash2, RotateCcw, AlertCircle, CheckSquare, Square, X, CheckCircle2, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { mutate } from 'swr';
import { CapacityProgressBar } from './CapacityProgressBar';
import { Button } from '@/components/ui/button';
import { CapacityWarningDialog } from './CapacityWarningDialog';
import { TrashService } from '../services/TrashService';
import { TrashItem } from '../types/file-system';
import { useTrash } from '../hooks/useFileSystem';
import { useToast } from '@/components/ui/use-toast';
import { QUERY_KEYS } from '@/constants/query-keys';

interface RecycleBinProps {
  onClose: () => void;
  className?: string;
  documentCount?: number;
  capacityLimit?: number;
  onDeleteOldestDocuments?: (count: number) => Promise<void>;
  onRestore?: () => void;
}

export const RecycleBin: React.FC<RecycleBinProps> = ({ onClose, className, documentCount = 0, capacityLimit = 100, onDeleteOldestDocuments, onRestore }) => {
  const { files, isLoading, refresh } = useTrash();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [warningDialog, setWarningDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    isLoading?: boolean;
    cleanupLabel?: string;
  }>({ isOpen: false, message: '', onConfirm: () => {}, isLoading: false, cleanupLabel: '' });

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    fileName: string;
  }>({ visible: false, x: 0, y: 0, fileName: '' });

  const trashCount = files.length;

  useEffect(() => {
    const handleGlobalClick = () => {
        setContextMenu(prev => ({ ...prev, visible: false }));
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('contextmenu', handleGlobalClick); // Close on right click elsewhere if not handled
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('contextmenu', handleGlobalClick);
    };
  }, []);


  const handleContextMenu = (e: React.MouseEvent, fileName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        fileName
    });
  };

  useEffect(() => {
    const handlePathsUpdated = () => {
      refresh();
    };
    window.addEventListener('app-paths-updated', handlePathsUpdated);
    return () => {
      window.removeEventListener('app-paths-updated', handlePathsUpdated);
    };
  }, [refresh]);

  const toggleSelection = (fileName: string) => {
    const newSet = new Set(selectedFiles);
    if (newSet.has(fileName)) {
      newSet.delete(fileName);
    } else {
      newSet.add(fileName);
    }
    setSelectedFiles(newSet);
  };

  const selectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.name)));
    }
  };

  const handleDragStart = (e: React.DragEvent, fileName: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'trash-file', name: fileName }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropToRestore = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
        const { type, name } = JSON.parse(data);
        if (type !== 'trash-file' || !name) return;
        await handleRestore([name]);
    } catch (e) {
        console.error('Drop failed', e);
    }
  };

  const performRestore = async (fileNames: string[]) => {
    try {
      const result = await TrashService.restoreFiles(fileNames);
      
      if (result.success > 0 || result.failed === 0) {
        // Add 500ms delay to ensure FS stability and provide visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        
        refresh(); // Refresh trash list
        mutate(QUERY_KEYS.FILES); // Refresh document list
        mutate(QUERY_KEYS.CAPACITY); // Refresh capacity stats

        setSelectedFiles(prev => {
          const newSet = new Set(prev);
          fileNames.forEach(n => newSet.delete(n));
          return newSet;
        });
        if (onRestore) onRestore();
        
        toast({
          title: "恢复成功",
          description: `已成功恢复 ${result.success} 个文件`,
          type: "success",
        });

        if (result.failed > 0) {
           toast({
             title: "部分恢复失败",
             description: result.errors.join(', '),
             type: "warning",
           });
        }
      } else {
        toast({
          title: "恢复失败",
          description: result.errors.join(', '),
          type: "error",
        });
      }
    } catch (e) {
      console.error('Restore failed', e);
      toast({
        title: "恢复出错",
        description: (e as Error).message,
        type: "error",
      });
    }
  };

  const handleRestore = async (fileNames: string[]) => {
    if (fileNames.length === 0) return;

    // Check document capacity
    if (documentCount + fileNames.length > capacityLimit) {
        setWarningDialog({
            isOpen: true,
            message: `文档列表容量不足（${documentCount}/${capacityLimit}）。无法恢复 ${fileNames.length} 个文件。建议先清理文档列表中最早的文件。`,
            cleanupLabel: '删除文档列表最早文件',
            onConfirm: async () => {
                setWarningDialog(prev => ({ ...prev, isLoading: true }));
                try {
                    if (onDeleteOldestDocuments) {
                        // Delete enough files to make space
                        const needed = (documentCount + fileNames.length) - capacityLimit;
                        await onDeleteOldestDocuments(needed);
                        
                        // Proceed with restore
                        await performRestore(fileNames);
                        setWarningDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
                    } else {
                        toast({
                          title: "操作失败",
                          description: "无法执行自动清理",
                          type: "error",
                        });
                        setWarningDialog(prev => ({ ...prev, isLoading: false }));
                    }
                } catch (err) {
                    console.error('Cleanup failed', err);
                    toast({
                      title: "清理失败",
                      description: "无法清理旧文件，请重试",
                      type: "error",
                    });
                    setWarningDialog(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
        return;
    }

    await performRestore(fileNames);
  };

  const handleDelete = async (fileNames: string[]) => {
    if (fileNames.length === 0) return;
    if (!confirm(`确定要永久删除这 ${fileNames.length} 个文件吗？此操作无法撤销。`)) return;

    try {
      const result = await TrashService.deleteFiles(fileNames);
      
      if (result.success > 0 || result.failed === 0) {
        refresh();
        mutate(QUERY_KEYS.CAPACITY); // Refresh capacity stats
        setSelectedFiles(prev => {
          const newSet = new Set(prev);
          fileNames.forEach(n => newSet.delete(n));
          return newSet;
        });

        toast({
          title: "删除成功",
          description: `已永久删除 ${result.success} 个文件`,
          type: "success",
        });
        
        if (result.failed > 0) {
           toast({
             title: "部分删除失败",
             description: result.errors.join(', '),
             type: "warning",
           });
        }
      } else {
        toast({
          title: "删除失败",
          description: result.errors.join(', '),
          type: "error",
        });
      }
    } catch (e) {
      console.error('Delete failed', e);
      toast({
        title: "删除出错",
        description: (e as Error).message,
        type: "error",
      });
    }
  };

  const handleEmptyTrash = async () => {
    if (files.length === 0) return;
    if (!confirm('确定要清空回收站吗？所有文件将被永久删除！')) return;

    try {
      const success = await TrashService.emptyTrash();
      if (success) {
        refresh();
        setSelectedFiles(new Set());
        toast({
           title: "清空成功",
           description: "回收站已清空",
           type: "success",
         });
       } else {
         toast({
           title: "清空失败",
           description: "无法清空回收站，请重试",
           type: "error",
         });
       }
     } catch (e) {
       console.error('Empty trash failed', e);
       toast({
         title: "清空出错",
         description: (e as Error).message,
         type: "error",
       });
     }
   };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={clsx("flex flex-col h-full bg-bg-card transition-all duration-300 border-r border-border-soft", className)}>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border-soft shrink-0 bg-bg-card z-10">
        <div className="flex items-center gap-2">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                title="返回文档列表 (拖拽文件至此恢复)"
                onDrop={handleDropToRestore}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
            >
                <X className="w-5 h-5 text-text-secondary" />
            </Button>
            <div className="flex items-center gap-2 text-text-primary font-medium">
                <Trash2 className="w-4 h-4" />
                <span>回收站</span>
            </div>
        </div>
        
        <div className="flex items-center gap-1">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleEmptyTrash} 
                disabled={files.length === 0}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
                清空
            </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="h-10 flex items-center justify-between px-4 border-b border-border-soft bg-bg-card/50 text-xs text-text-secondary">
        <div className="flex items-center gap-2">
            <button onClick={selectAll} className="hover:text-text-primary flex items-center gap-1">
                {selectedFiles.size === files.length && files.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                ) : (
                    <Square className="w-4 h-4" />
                )}
                <span>全选</span>
            </button>
            <span className="text-border-active">|</span>
            <span>已选 {selectedFiles.size} 项</span>
        </div>
        {selectedFiles.size > 0 && (
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => handleRestore(Array.from(selectedFiles))}>
                    <RotateCcw className="w-3 h-3" /> 恢复
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-red-500 hover:text-red-600" onClick={() => handleDelete(Array.from(selectedFiles))}>
                    <Trash2 className="w-3 h-3" /> 删除
                </Button>
            </div>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 text-text-secondary gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-sm">加载中...</span>
            </div>
        ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-text-secondary gap-2 opacity-60">
                <Trash2 className="w-8 h-8" />
                <span className="text-sm">回收站为空</span>
            </div>
        ) : (
            <div className="flex flex-col">
                {files.map(file => (
                    <div 
                        key={file.name}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, file.name)}
                        className={clsx(
                            "group flex items-center justify-between px-4 py-3 border-b border-border-soft hover:bg-bg-hover cursor-pointer transition-colors",
                            selectedFiles.has(file.name) && "bg-primary/5 border-primary/20",
                            contextMenu.visible && contextMenu.fileName === file.name && "bg-primary/10"
                        )}
                        onClick={() => toggleSelection(file.name)}
                        onContextMenu={(e) => handleContextMenu(e, file.name)}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div onClick={(e) => { e.stopPropagation(); toggleSelection(file.name); }}>
                                {selectedFiles.has(file.name) ? (
                                    <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                                ) : (
                                    <Square className="w-4 h-4 text-text-tertiary group-hover:text-text-secondary shrink-0" />
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className={clsx("text-sm truncate font-medium", selectedFiles.has(file.name) ? "text-primary" : "text-text-primary")}>
                                    {file.originalName}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                                    <span>{formatSize(file.size)}</span>
                                    <span>•</span>
                                    <span>{formatDate(file.deletedAt)}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Hover Actions (Single Item) */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-text-secondary hover:text-primary" 
                                title="恢复"
                                onClick={(e) => { e.stopPropagation(); handleRestore([file.name]); }}
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-text-secondary hover:text-red-500" 
                                title="永久删除"
                                onClick={(e) => { e.stopPropagation(); handleDelete([file.name]); }}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Footer / Capacity */}
      <div className="p-4 border-t border-border-soft bg-bg-card shrink-0">
         <CapacityProgressBar current={trashCount} limit={500} variant="compact" label="回收站容量" />
      </div>

      <CapacityWarningDialog 
        isOpen={warningDialog.isOpen}
        onClose={() => setWarningDialog(prev => ({ ...prev, isOpen: false }))}
        message={warningDialog.message}
        onConfirmCleanup={warningDialog.onConfirm}
        cleanupLabel={warningDialog.cleanupLabel}
        isLoading={warningDialog.isLoading}
      />

      {contextMenu.visible && (
        <div 
          className="fixed z-50 w-48 bg-bg-card rounded-md shadow-lg border border-border-soft py-1 overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm text-text-primary flex items-center gap-2"
            onClick={() => {
              handleRestore([contextMenu.fileName]);
              setContextMenu(prev => ({ ...prev, visible: false }));
            }}
          >
            <RotateCcw className="w-4 h-4" />
            恢复
          </button>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm text-red-500 hover:text-red-600 flex items-center gap-2"
            onClick={() => {
              handleDelete([contextMenu.fileName]);
              setContextMenu(prev => ({ ...prev, visible: false }));
            }}
          >
            <Trash2 className="w-4 h-4" />
            永久删除
          </button>
        </div>
      )}
    </div>
  );
};
