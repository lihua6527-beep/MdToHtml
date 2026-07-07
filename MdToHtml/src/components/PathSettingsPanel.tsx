import React, { useEffect, useState } from 'react';
import { X, Folder, Settings, RefreshCw, FileText, Database, Trash2, AlertTriangle, Edit2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PathSelector } from '@/components/settings/PathSelector';
import { clsx } from 'clsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfigService } from '@/services/ConfigService';
import { TrashService } from '@/services/TrashService';

interface PathInfo {
  inputPath: string;
  outputPath: string;
  dataPath: string;
  recyclePath: string;
  chdProtocolPath: string;
  appRoot: string;
  config: any;
}

interface PathSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type PathKey = 'input' | 'output' | 'data' | 'trash' | 'chdProtocol';

export const PathSettingsPanel: React.FC<PathSettingsPanelProps> = ({ isOpen, onClose }) => {
  const [info, setInfo] = useState<PathInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trashStats, setTrashStats] = useState<{ count: number; size: number } | null>(null);
  const [protocolContent, setProtocolContent] = useState<string>('加载中...');
  const [protocolLoading, setProtocolLoading] = useState(true);
  
  // Path Editing State
  const [editingKey, setEditingKey] = useState<PathKey | null>(null);
  const [saving, setSaving] = useState(false);

  const notifyPathsUpdated = () => {
    window.dispatchEvent(new Event('app-paths-updated'));
  };

  const fetchInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ConfigService.getAppInfo();
      if (!data) throw new Error('Failed to fetch app info');
      setInfo(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrashStats = async () => {
    const stats = await TrashService.getTrashStats();
    setTrashStats(stats);
  };

  const fetchCHDProtocol = async () => {
    setProtocolLoading(true);
    try {
      const response = await fetch('/api/app/chd-protocol');
      if (!response.ok) throw new Error('Failed to fetch CHD protocol');
      const content = await response.text();
      setProtocolContent(content);
    } catch (err: any) {
      console.error('Failed to fetch CHD protocol:', err);
      setProtocolContent(`# CHD协议加载失败\n\n${err.message}`);
    } finally {
      setProtocolLoading(false);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('确定清空回收站吗？此操作不可撤销。')) return;
    const success = await TrashService.emptyTrash();
    if (success) {
      fetchTrashStats();
      alert('回收站已清空');
    } else {
      alert('清空失败');
    }
  };

  const handleUpdateCapacity = async (limit: number) => {
    const success = await ConfigService.updateConfig({ capacityLimit: limit });
    if (success) {
      fetchInfo(); // Refresh config display
    } else {
      alert('设置失败');
    }
  };

  const handleSavePath = async (path: string) => {
    if (!editingKey) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paths: {
            [editingKey]: path
          }
        })
      });

      if (!res.ok) throw new Error('保存配置失败');

      await fetchInfo(); // Refresh to see new resolved paths
      await fetchTrashStats();
      notifyPathsUpdated();
      setEditingKey(null);
    } catch (err: any) {
      alert(`保存失败: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPath = async (key: PathKey) => {
    if (!confirm('确定要重置为默认路径吗？')) return;
    
    setSaving(true);
    try {
        // Sending null/undefined for a key usually merges, but here we might need a way to unset.
        // ConfigManager uses partial merge. 
        // We might need to send a specific value or handle unset in API.
        // For now, let's try sending empty string or implement a reset endpoint if needed.
        // Assuming empty string means "use default" in our logic or we explicitly handle it.
        // Actually ConfigManager implementation:
        // paths: { ...this.config.paths, ...newConfig.paths }
        // So sending undefined won't delete it.
        
        // Let's modify API or just set it to empty string and have PathManager handle empty string as default?
        // PathManager: paths.input ? ... : baseInput. 
        // If paths.input is "", it's falsy, so it uses baseInput.
        
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paths: {
                [key]: "" 
              }
            })
          });
    
          if (!res.ok) throw new Error('重置配置失败');
    
          await fetchInfo();
          await fetchTrashStats();
          notifyPathsUpdated();
    } catch (err: any) {
        alert(`重置失败: ${err.message}`);
    } finally {
        setSaving(false);
    }
  };

  const handleToggleEmitJson = async (value: boolean) => {
    const success = await ConfigService.updateConfig({
      exportOptions: { emitJson: value }
    });
    
    if (success) {
      fetchInfo();
    } else {
      alert('保存输出配置失败');
    }
  };

  const handleToggleShowDivider = async (value: boolean) => {
    const success = await ConfigService.updateConfig({
      renderOptions: { ...info?.config?.renderOptions, showDivider: value }
    });
    
    if (success) {
      fetchInfo();
    } else {
      alert('保存渲染配置失败');
    }
  };

  const handleUpdateTitleSpacing = async (value: string) => {
    const success = await ConfigService.updateConfig({
      renderOptions: { ...info?.config?.renderOptions, titleSpacing: value }
    });
    
    if (success) {
      fetchInfo();
    } else {
      alert('保存渲染配置失败');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInfo();
      fetchTrashStats();
      fetchCHDProtocol();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const renderPathSection = (
    label: string, 
    pathValue: string, 
    pathKey: PathKey, 
    iconColorClass: string,
    description?: string
  ) => {
    const isConfigured = info?.config?.paths?.[pathKey];
    
    return (
        <div className="group relative">
            <div className={clsx("absolute left-0 top-0 bottom-0 w-1 rounded-l-lg", iconColorClass)}></div>
            <div className="pl-4 py-2">
                <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-text-secondary flex items-center gap-2">
                        {label}
                        {isConfigured && <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">自定义</span>}
                    </label>
                    <div className="flex gap-2">
                         {isConfigured && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 px-2 text-xs gap-1" 
                                title="重置为默认"
                                onClick={() => handleResetPath(pathKey)}
                            >
                                <RotateCcw className="w-3 h-3" />
                                重置
                            </Button>
                         )}
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 px-2 text-xs gap-1" 
                            title="修改路径"
                            onClick={() => setEditingKey(pathKey)}
                        >
                            <Edit2 className="w-3 h-3" />
                            修改
                        </Button>
                    </div>
                </div>
                <div className="font-mono text-sm bg-bg-page p-3 rounded border border-border-soft break-all select-all flex items-center justify-between">
                    <span>{pathValue}</span>
                </div>
                {description && (
                    <p className="text-[10px] text-text-muted mt-1">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
  };

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

              {/* 文件管理配置 */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <Folder className="w-4 h-4" /> 文件管理配置
                </h3>
                
                {/* 路径配置 */}
                <div className="space-y-4 pl-4 border-l border-border-soft">
                    {renderPathSection(
                        "输入路径 (Input Path)", 
                        info.inputPath, 
                        "input", 
                        "bg-blue-500",
                        "在此文件夹放入 .md 文件，刷新页面即可在列表中看到。"
                    )}

                    {renderPathSection(
                        "输出路径 (Output Path)", 
                        info.outputPath, 
                        "output", 
                        "bg-green-500",
                        "导出的 HTML 文件将保存到此文件夹。"
                    )}

                    {renderPathSection(
                        "数据存储路径 (Data Path)", 
                        info.dataPath, 
                        "data", 
                        "bg-purple-500",
                        "存储历史记录、缓存等数据。"
                    )}

                    {renderPathSection(
                        "回收站路径 (Recycle Path)", 
                        info.recyclePath, 
                        "trash", 
                        "bg-red-500",
                        "被删除的文件将移动到此文件夹。"
                    )}

                    {renderPathSection(
                        "CHD协议文档路径", 
                        info.chdProtocolPath, 
                        "chdProtocol", 
                        "bg-purple-500",
                        "CHD协议文档的存储路径，文件名将固定为CHD协议.md。"
                    )}
                </div>

                {/* 存储与容量 */}
                <div className="bg-bg-page rounded-lg p-4 border border-border-soft space-y-4 pl-4 border-l border-border-soft">
                    {/* 最大文档容量 */}
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

                    {/* 回收站管理 */}
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

                    {/* 输出配置 */}
                    <div className="pt-4 border-t border-border-soft">
                        <label className="text-xs font-semibold text-text-secondary block mb-2">
                            输出配置
                        </label>
                        <div className="flex items-center justify-between bg-bg-card p-3 rounded border border-border-soft">
                            <div>
                                <div className="text-sm font-medium text-text-primary">同时生成 JSON 元信息文件</div>
                                <div className="text-xs text-text-muted mt-1">与 HTML 同名的 .json 文件，用于博客索引</div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant={(info.config.exportOptions?.emitJson ? 'outline' : 'default') as any}
                                    size="sm"
                                    onClick={() => handleToggleEmitJson(false)}
                                    className="h-7 px-3 text-xs"
                                >
                                    否
                                </Button>
                                <Button 
                                    variant={(info.config.exportOptions?.emitJson ? 'default' : 'outline') as any}
                                    size="sm"
                                    onClick={() => handleToggleEmitJson(true)}
                                    className="h-7 px-3 text-xs"
                                >
                                    是
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
              </div>

              {/* 网页渲染配置 */}
              <div className="space-y-4 pt-4 border-t border-border-soft">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" /> 网页渲染配置
                </h3>
                <div className="bg-bg-page rounded-lg p-4 border border-border-soft space-y-4 pl-4 border-l border-border-soft">
                  {/* 显示分区间分割线 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-text-primary">显示分区间分割线</div>
                      <div className="text-xs text-text-muted mt-1">在文档的各个分区之间显示分割线</div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant={(!info.config.renderOptions?.showDivider ? 'default' : 'outline') as any}
                        size="sm"
                        onClick={() => handleToggleShowDivider(false)}
                        className="h-7 px-3 text-xs"
                      >
                        否
                      </Button>
                      <Button 
                        variant={(info.config.renderOptions?.showDivider ? 'default' : 'outline') as any}
                        size="sm"
                        onClick={() => handleToggleShowDivider(true)}
                        className="h-7 px-3 text-xs"
                      >
                        是
                      </Button>
                    </div>
                  </div>

                  {/* 分区间距 */}
                  <div>
                    <div className="text-sm font-medium text-text-primary mb-2">分区间距</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: '0', label: '无间距' },
                        { value: '2', label: '小间距' },
                        { value: '4', label: '标准间距' },
                        { value: '6', label: '大间距' },
                        { value: '8', label: '超大间距' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleUpdateTitleSpacing(option.value)}
                          className={clsx(
                            "px-3 py-1.5 text-xs rounded-md border transition-colors",
                            (info.config.renderOptions?.titleSpacing || '2') === option.value 
                              ? "bg-primary text-white border-primary" 
                              : "bg-bg-card border-border-soft hover:border-primary text-text-primary"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
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

              {/* CHD Protocol Configuration */}
              <div className="space-y-4 pt-4 border-t border-border-soft">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" /> 协议配置 (CHD Protocol)
                </h3>
                <div className="bg-bg-page rounded-lg p-4 border border-border-soft space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-text-primary">CHD协议预览</div>
                            <div className="text-xs text-text-muted mt-1">查看当前使用的CHD协议规范</div>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={async () => {
                                    try {
                                        const response = await fetch('/api/app/chd-protocol');
                                        if (!response.ok) throw new Error('Failed to fetch CHD protocol');
                                        const protocolContent = await response.text();
                                        await navigator.clipboard.writeText(protocolContent);
                                        alert('CHD协议内容已复制到剪贴板');
                                    } catch (err) {
                                        console.error('Failed to copy CHD protocol:', err);
                                        alert('复制失败，请稍后重试');
                                    }
                                }}
                                className="h-7 px-3 text-xs"
                            >
                                复制协议内容
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(info.chdProtocolPath);
                                        alert('CHD协议路径已复制到剪贴板');
                                    } catch (err) {
                                        console.error('Failed to copy CHD protocol path:', err);
                                        alert('复制失败，请稍后重试');
                                    }
                                }}
                                className="h-7 px-3 text-xs"
                            >
                                复制协议路径
                            </Button>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute top-2 right-2 z-10 bg-bg-card/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-text-muted">
                            CHD协议 v2.0
                        </div>
                        <div className="bg-bg-card p-4 rounded border border-border-soft max-h-64 overflow-auto">
                            <div className="text-xs font-mono whitespace-pre-wrap">
                                {protocolLoading ? '加载中...' : protocolContent}
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border-soft bg-bg-page/50 text-center text-xs text-text-muted">
            MD-To-HTML Converter • v1.0.0
        </div>
      </div>

      {/* Path Selector Dialog */}
      <Dialog open={!!editingKey} onOpenChange={(open) => !open && setEditingKey(null)}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
            <DialogHeader className="p-4 border-b">
                <DialogTitle>选择文件夹</DialogTitle>
            </DialogHeader>
            {editingKey && (
                <PathSelector
                    initialPath={
                        editingKey === 'input' ? info?.inputPath :
                        editingKey === 'output' ? info?.outputPath :
                        editingKey === 'data' ? info?.dataPath :
                        editingKey === 'trash' ? info?.recyclePath :
                        editingKey === 'chdProtocol' ? info?.chdProtocolPath :
                        undefined
                    }
                    onSelect={handleSavePath}
                    onCancel={() => setEditingKey(null)}
                />
            )}
        </DialogContent>
      </Dialog>
    </>
  );
};
