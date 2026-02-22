import React, { useEffect, useState } from 'react';
import { X, Folder, Settings, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clsx } from 'clsx';

interface PathInfo {
  inputPath: string;
  outputPath: string;
  dataPath: string;
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

  useEffect(() => {
    if (isOpen) {
      fetchInfo();
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
