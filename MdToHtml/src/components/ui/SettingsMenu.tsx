import React from 'react';
import { Settings, FileText, Code, FileJson } from 'lucide-react';

interface SettingsMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onOpenSettings?: (type: 'file' | 'render' | 'protocol') => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isVisible,
  onClose,
  onOpenSettings
}) => {
  if (!isVisible) return null;

  return (
    <div 
      className="absolute bottom-16 left-4 w-56 bg-bg-card border border-border-soft rounded-lg shadow-xl p-2 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 文件设置 */}
      <button 
        onClick={() => {
          onClose();
          onOpenSettings?.('file');
        }}
        className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-bg-page transition-colors flex items-center gap-2 text-text-primary mb-1"
      >
        <FileJson className="w-4 h-4 text-text-secondary" />
        <span>文件设置</span>
      </button>

      {/* 渲染配置 */}
      <button 
        onClick={() => {
          onClose();
          onOpenSettings?.('render');
        }}
        className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-bg-page transition-colors flex items-center gap-2 text-text-primary mb-1"
      >
        <Code className="w-4 h-4 text-text-secondary" />
        <span>渲染配置</span>
      </button>

      {/* 协议配置 */}
      <button 
        onClick={() => {
          onClose();
          onOpenSettings?.('protocol');
        }}
        className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-bg-page transition-colors flex items-center gap-2 text-text-primary"
      >
        <FileText className="w-4 h-4 text-text-secondary" />
        <span>协议配置</span>
      </button>
    </div>
  );
};

export default React.memo(SettingsMenu);
