import React, { useEffect, useState } from 'react';
import { X, Folder, Settings, RefreshCw, FileText, Database, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clsx } from 'clsx';

interface PathInfo {
  inputPath: string;
  outputPath: string;
  dataPath: string;
  recyclePath: string;
  appRoot: string;
  config: any;
}

interface PathSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PathSettingsPanel: React.FC<PathSettingsPanelProps> = ({ isOpen, onClose }) => {
  const [info, setInfo] = useState<PathInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trashStats, setTrashStats] = useState<{ count: number; size: number } | null>(null);

  const fetchInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/app-info');
      if (!res.ok) throw new Error('Failed to fetch app info');
      const data = await res.json();
      setInfo(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrashStats = async () => {
    try {
      const res = await fetch('/api/trash/stats');
      if (res.ok) {
        setTrashStats(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch trash stats', e);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('确定清空回收站吗？此操作不可撤销。')) return;
    try {
      const res = await fetch('/api/trash/empty', { method: 'POST' });
      if (res.ok) {
        fetchTrashStats();
        alert('回收站已清空');
      } else {
        alert('清空失败');
      }
    } catch (e) {
      alert('清空出错');
    }
  };

  const handleUpdateCapacity = async (limit: number) => {
    try {
      const res = await fetch('/api/config/capacity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit })
      });
      if (res.ok) {
        fetchInfo(); // Refresh config display
      } else {
        alert('设置失败');
      }
    } catch (e) {
      alert('设置出错');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInfo();
      fetchTrashStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full md:w-1/2 bg-bg-card border-l border-border-soft shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-soft bg-bg-page/50 backdrop-blur">
          <div className="flex items-center gap-2 text-text-primary font-bold text-lg">
            <Settings className="w-5 h-5" />
            <span>环境配置与路径</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-10 text-text-secondary">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              正在获取配置信息...
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
              获取配置失败: {error}
            </div>
          )}

          {info && !loading && (
            <>
              {/* Status Overview */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-secondary/10 rounded-xl border border-border-soft">
                    <div className="text-xs text-text-secondary mb-1">运行环境</div>
                    <div className="font-mono font-bold text-text-primary text-sm truncate" title={info.appRoot}>
                        {info.appRoot}
                    </div>
                 </div>
                 <div className="p-4 bg-secondary/10 rounded-xl border border-border-soft">
                    <div className="text-xs text-text-secondary mb-1">配置文件</div>
                    <div className="font-bold text-text-primary text-sm">
                        {Object.keys(info.config).length > 0 ? '已加载 config.json' : '使用默认配置'}
                    </div>
                 </div>
              </div>

              {/* Path Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <Folder className="w-4 h-4" /> 路径配置
                </h3>
                
                <div className="group relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>
                    <div className="pl-4 py-2">
                        <label className="text-xs font-semibold text-text-secondary block mb-1">
                            输入路径 (Input Path)
                        </label>
                        <div className="font-mono text-sm bg-bg-page p-3 rounded border border-border-soft break-all select-all">
                            {info.inputPath}
                        </div>
                        <p className="text-[10px] text-text-muted mt-1">
                            在此文件夹放入 .md 文件，刷新页面即可在列表中看到。
                        </p>
                    </div>
                </div>

                <div className="group relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-lg"></div>
                    <div className="pl-4 py-2">
                        <label className="text-xs font-semibold text-text-secondary block mb-1">
                            输出路径 (Output Path)
                        </label>
                        <div className="font-mono text-sm bg-bg-page p-3 rounded border border-border-soft break-all select-all">
                            {info.outputPath}
                        </div>
                        <p className="text-[10px] text-text-muted mt-1">
                            导出的 HTML 文件将保存到此文件夹。
                        </p>
                    </div>
                </div>

                <div className="group relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-lg"></div>
                    <div className="pl-4 py-2">
                        <label className="text-xs font-semibold text-text-secondary block mb-1">
                            数据存储路径 (Data Path)
                        </label>
                        <div className="font-mono text-sm bg-bg-page p-3 rounded border border-border-soft break-all select-all">
                            {info.dataPath}
                        </div>
                    </div>
                </div>

                <div className="group relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg"></div>
                    <div className="pl-4 py-2">
                        <label className="text-xs font-semibold text-text-secondary block mb-1">
                            回收站路径 (Recycle Path)
                        </label>
                        <div className="font-mono text-sm bg-bg-page p-3 rounded border border-border-soft break-all select-all">
                            {info.recyclePath}
                        </div>
                        <p className="text-[10px] text-text-muted mt-1">
                            删除的 Markdown 文件将移动到此文件夹。
                        </p>
                    </div>
                </div>
              </div>

              {/* Storage Settings */}
              <div className="space-y-4 pt-4 border-t border-border-soft">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4" /> 存储与容量
                </h3>
                
                <div className="bg-bg-page rounded-lg p-4 border border-border-soft space-y-4">
                    {/* Capacity Limit */}
                    <div>
                        <label className="text-xs font-semibold text-text-secondary block mb-2">
                            最大文档容量 (超过此数量将自动清理旧文档)
                        </label>
                        <div className="flex flex-wrap gap-2">
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
                                    onClick={() => handleUpdateCapacity(option.value)}
                                    className={clsx(
                                        "px-3 py-1.5 text-xs rounded-md border transition-colors",
                                        (info.config.capacityLimit || 100) === option.value 
                                            ? "bg-primary text-white border-primary" 
                                            : "bg-bg-card border-border-soft hover:border-primary text-text-primary"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-text-muted mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            当前设置: {info.config.capacityLimit || 100} 个文档。修改后立即生效。
                        </p>
                    </div>

                    {/* Trash Management */}
                    <div className="pt-4 border-t border-border-soft">
                         <label className="text-xs font-semibold text-text-secondary block mb-2">
                            回收站管理
                        </label>
                        <div className="flex items-center justify-between bg-bg-card p-3 rounded border border-border-soft">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 text-red-500 rounded-full">
                                    <Trash2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-text-primary">
                                        {trashStats ? `${trashStats.count} 个文件` : '加载中...'}
                                    </div>
                                    <div className="text-xs text-text-muted">
                                        占用空间: {trashStats ? (trashStats.size / 1024 / 1024).toFixed(2) : '0'} MB
                                    </div>
                                </div>
                            </div>
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={handleEmptyTrash}
                                disabled={!trashStats || trashStats.count === 0}
                            >
                                清空回收站
                            </Button>
                        </div>
                    </div>
                </div>
              </div>

              {/* Config Content */}
              {Object.keys(info.config).length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-border-soft">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4" /> 当前配置 (config.json)
                    </h3>
                    <pre className="bg-bg-page p-3 rounded border border-border-soft text-xs font-mono overflow-auto max-h-40">
                        {JSON.stringify(info.config, null, 2)}
                    </pre>
                  </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border-soft bg-bg-page/50 text-center text-xs text-text-muted">
            MD-To-HTML Converter • v1.0.0
        </div>
      </div>
    </>
  );
};
