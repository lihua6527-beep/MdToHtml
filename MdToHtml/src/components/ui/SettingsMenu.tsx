import React, { useState } from 'react';
import { Settings, Database, ArrowUpDown, ChevronRight, CheckCircle2, Calendar, Clock, Eye } from 'lucide-react';
import { clsx } from 'clsx';
import { SortMethod } from '@/types/file-system';

interface SettingsMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onOpenFilePaths: () => void;
  capacityLimit: number;
  onUpdateCapacity: (limit: number) => void;
  sortMethod: SortMethod;
  onUpdateSortMethod: (method: SortMethod) => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isVisible,
  onClose,
  onOpenFilePaths,
  capacityLimit,
  onUpdateCapacity,
  sortMethod,
  onUpdateSortMethod
}) => {
  const [showCapacitySubmenu, setShowCapacitySubmenu] = useState(false);
  const [showSortSubmenu, setShowSortSubmenu] = useState(false);

  if (!isVisible) return null;

  return (
    <div 
      className="absolute bottom-16 left-4 w-56 bg-bg-card border border-border-soft rounded-lg shadow-xl p-2 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* File Path Button */}
      <button 
        onClick={() => {
          onClose();
          onOpenFilePaths();
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
                onClick={() => {
                  onUpdateCapacity(option.value);
                  onClose();
                }}
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
              onClick={() => {
                onUpdateSortMethod('import');
                onClose();
              }}
              className={clsx("w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2", sortMethod === 'import' ? "bg-primary/10 text-primary" : "hover:bg-bg-page text-text-primary")}
            >
              <Calendar className="w-4 h-4" />
              <span>导入时间</span>
              {sortMethod === 'import' && <CheckCircle2 className="w-3 h-3 ml-auto" />}
            </button>
            <button 
              onClick={() => {
                onUpdateSortMethod('modified');
                onClose();
              }}
              className={clsx("w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2", sortMethod === 'modified' ? "bg-primary/10 text-primary" : "hover:bg-bg-page text-text-primary")}
            >
              <Clock className="w-4 h-4" />
              <span>修改时间</span>
              {sortMethod === 'modified' && <CheckCircle2 className="w-3 h-3 ml-auto" />}
            </button>
            <button 
              onClick={() => {
                onUpdateSortMethod('visited');
                onClose();
              }}
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
  );
};

export default React.memo(SettingsMenu);
