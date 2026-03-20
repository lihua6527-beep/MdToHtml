import React, { useState, useEffect, useCallback } from 'react';
import { Folder, ArrowUp, RefreshCw, AlertTriangle, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { clsx } from 'clsx';

interface PathSelectorProps {
  initialPath?: string;
  onSelect: (path: string) => void;
  onCancel: () => void;
}

interface FolderItem {
  name: string;
  path: string;
  type: 'folder';
}

interface FolderListResponse {
  current: string;
  parent: string | null;
  folders: FolderItem[];
  error?: string;
}

export const PathSelector: React.FC<PathSelectorProps> = ({ initialPath, onSelect, onCancel }) => {
  const [currentPath, setCurrentPath] = useState(initialPath || '');
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const fetchPath = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    setSelectedFolder(null);
    try {
      const res = await fetch(`/api/fs/list?path=${encodeURIComponent(path)}`);
      const data: FolderListResponse = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setCurrentPath(data.current);
      setParentPath(data.parent);
      setFolders(data.folders);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPath(initialPath || '');
  }, [fetchPath, initialPath]);

  const handleNavigate = (path: string) => {
    fetchPath(path);
  };

  const handleUp = () => {
    if (parentPath) {
      fetchPath(parentPath);
    }
  };
  
  const handleSelectFolder = (path: string) => {
      setSelectedFolder(path === selectedFolder ? null : path);
  };

  const handleDoubleClick = (path: string) => {
      fetchPath(path);
  };

  const handleConfirm = () => {
    // If a subfolder is selected, use that. Otherwise use current path.
    onSelect(selectedFolder || currentPath);
  };

  const validateFolderName = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return '文件夹名称不能为空';
    }
    if (trimmed.length > 255) {
      return '文件夹名称长度不能超过255个字符';
    }
    if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes(':')) {
      return '文件夹名称不能包含斜杠或冒号';
    }
    if (trimmed.match(/[<>"|?*]/)) {
      return '文件夹名称不能包含特殊字符 < > " | ? *';
    }
    return null;
  };

  const handleCreateFolder = async () => {
    const validationError = validateFolderName(newFolderName);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const res = await fetch('/api/fs/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: currentPath,
          name: newFolderName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '创建文件夹失败');
      }

      // Refresh list and clear creation state
      setIsCreating(false);
      setNewFolderName('');
      setError(null);
      fetchPath(currentPath);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full bg-background border rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
        <Button variant="ghost" size="icon" onClick={handleUp} disabled={!parentPath} title="返回上一级">
          <ArrowUp className="w-4 h-4" />
        </Button>
        <div className="flex-1 px-2 py-1 bg-background border rounded text-sm overflow-hidden whitespace-nowrap text-ellipsis" title={currentPath}>
            {currentPath || 'Root'}
        </div>
        <Button variant="ghost" size="icon" onClick={() => fetchPath(currentPath)} title="刷新">
            <RefreshCw className="w-4 h-4" />
        </Button>
        <Button 
            variant="outline" 
            size="sm" 
            className="ml-2 gap-1"
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
        >
            <Plus className="w-3 h-3" />
            新建文件夹
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                加载中...
            </div>
        ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-destructive gap-2">
                <AlertTriangle className="w-8 h-8" />
                <p>{error}</p>
                <Button variant="outline" onClick={() => fetchPath('')}>返回默认路径</Button>
            </div>
        ) : (
            <div className="grid grid-cols-4 gap-4">
                {isCreating && (
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-primary/5 animate-in fade-in zoom-in duration-200">
                        <Folder className="w-12 h-12 fill-primary/20 text-primary opacity-50" />
                        <div className="w-full flex items-center gap-1">
                            <Input 
                                autoFocus
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateFolder();
                                    if (e.key === 'Escape') {
                                        setIsCreating(false);
                                        setNewFolderName('');
                                    }
                                }}
                                className="h-6 text-xs px-1"
                                placeholder="文件夹名称"
                            />
                            <Button size="icon" className="h-6 w-6 shrink-0" onClick={handleCreateFolder}>
                                <Check className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => {
                                setIsCreating(false);
                                setNewFolderName('');
                            }}>
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                )}
                {folders.map((folder) => (
                    <div 
                        key={folder.path}
                        className={clsx(
                            "flex flex-col items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors border",
                            selectedFolder === folder.path 
                                ? "bg-primary/10 border-primary" 
                                : "hover:bg-muted border-transparent",
                            "text-center"
                        )}
                        onClick={() => handleSelectFolder(folder.path)}
                        onDoubleClick={() => handleDoubleClick(folder.path)}
                    >
                        <Folder className={clsx(
                            "w-12 h-12 transition-colors", 
                            selectedFolder === folder.path ? "fill-primary/20 text-primary" : "fill-yellow-500/20 text-yellow-600"
                        )} />
                        <span className="text-xs break-all line-clamp-2 w-full">{folder.name}</span>
                    </div>
                ))}
                {folders.length === 0 && (
                    <div className="col-span-4 text-center text-muted-foreground py-10">
                        此文件夹为空
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t bg-muted/30">
        <div className="flex-1 mr-4">
            <div className="text-xs text-muted-foreground mb-1">已选择路径:</div>
            <div className="text-sm font-medium text-foreground truncate" title={selectedFolder || currentPath}>
                {selectedFolder || currentPath}
            </div>
        </div>
        <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={onCancel}>取消</Button>
            <Button onClick={handleConfirm}>选择此文件夹</Button>
        </div>
      </div>
    </div>
  );
};
