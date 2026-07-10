import React from 'react';
import { ArrowLeft, Edit, Save, Eye, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExportButton from './ExportButton';
import { clsx } from 'clsx';
import { ThemeId } from '@/lib/themes';

interface NavigationHeaderProps {
  // Document info
  decodedSlug: string;
  theme: ThemeId;
  
  // Status
  docStatus: string | null;
  isStatusUpdating: boolean;
  handleStatusChange: (newStatus: string) => void;
  
  // Edit state
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  
  // Save state
  isSaving: boolean;
  saveSuccess: boolean;
  handleSave: () => Promise<void>;
  
  // Export state
  content: string;
  isExporting: boolean;
  setIsExporting: (isExporting: boolean) => void;
  
  // Navigation
  handleBack: () => void;
  isSavingRef: React.MutableRefObject<boolean>;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  decodedSlug,
  theme,
  docStatus,
  isStatusUpdating,
  handleStatusChange,
  isEditing,
  setIsEditing,
  isSaving,
  saveSuccess,
  handleSave,
  content,
  isExporting,
  setIsExporting,
  handleBack,
  isSavingRef
}) => {
  return (
    <div className="sticky top-0 z-50 h-14 bg-bg-card/80 backdrop-blur-md border-b border-border-soft flex items-center px-4 justify-between shadow-sm print:hidden">
      <div className="flex items-center gap-4">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-text-secondary hover:text-primary"
          onClick={handleBack}
          disabled={isSaving}
        >
          <ArrowLeft size={20} />
        </Button>

        {/* Status Toggle Group (Always Visible) */}
        <div className="flex items-center gap-1 mx-4 bg-secondary/10 p-1 rounded-lg border border-border-soft">
          <button
            onClick={() => handleStatusChange('incomplete')}
            disabled={isStatusUpdating}
            className={clsx(
              "flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all",
              ['pending', 'modified', 'incomplete', ''].includes(docStatus || '')
                ? "bg-amber-100 text-amber-700 shadow-sm" 
                : "text-text-secondary hover:bg-secondary/20",
              isStatusUpdating && "opacity-70 cursor-wait"
            )}
            title="文档需要修改"
          >
            {isStatusUpdating && ['pending', 'modified', 'incomplete', ''].includes(docStatus || '') && (
              <Loader2 className="w-3 h-3 animate-spin" />
            )}
            未完成
          </button>
          <button
            onClick={() => handleStatusChange('completed')}
            disabled={isStatusUpdating}
            className={clsx(
              "flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all",
              ['done', 'completed'].includes(docStatus || '')
                ? "bg-green-100 text-green-700 shadow-sm" 
                : "text-text-secondary hover:bg-secondary/20",
              isStatusUpdating && "opacity-70 cursor-wait"
            )}
            title="文档已完成并锁定"
          >
            {isStatusUpdating && ['done', 'completed'].includes(docStatus || '') && (
              <Loader2 className="w-3 h-3 animate-spin" />
            )}
            已完成
          </button>
        </div>
      </div>
      
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
         <div className="text-sm font-bold text-text-primary truncate max-w-[200px]">
            {decodedSlug}
         </div>
      </div>

      <div className="flex items-center gap-2">
        
        <div className="h-4 w-px bg-border-soft mx-2" />

        {/* Export Button (Top Bar) */}
        <ExportButton
          content={content}
          decodedSlug={decodedSlug}
          theme={theme}
          isExporting={isExporting}
          setIsExporting={setIsExporting}
        />

        {isEditing ? (
          <>
            <Button 
              onClick={() => setIsEditing(false)} 
              variant="ghost" 
              size="sm"
              className="gap-2 text-text-secondary"
            >
              <Eye size={14} /> 取消/预览
            </Button>
            <Button 
              onClick={handleSave} 
              variant="default" 
              size="sm"
              className={clsx("gap-2 transition-all", saveSuccess && "bg-green-600 hover:bg-green-700")}
              disabled={isSaving}
            >
              {saveSuccess ? <CheckCircle size={14} /> : <Save size={14} />} 
              {isSaving ? '保存中...' : (saveSuccess ? '已保存' : '保存修改')}
            </Button>
          </>
        ) : (
          <Button 
            onClick={() => setIsEditing(true)} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <Edit size={14} /> 编辑页面
          </Button>
        )}
      </div>
    </div>
  );
};

export default React.memo(NavigationHeader);