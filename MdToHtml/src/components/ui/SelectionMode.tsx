import React from 'react';
import { CheckSquare, Square, FileText, Trash2 } from 'lucide-react';

interface SelectionModeProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onBatchDelete: (deleteOutput: boolean) => void;
  onCancel: () => void;
  disabled: boolean;
}

const SelectionMode: React.FC<SelectionModeProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onBatchDelete,
  onCancel,
  disabled
}) => {
  const isAllSelected = selectedCount > 0 && selectedCount === totalCount;

  return (
    <div className="flex items-center gap-2 w-full">
      <button 
        onClick={onSelectAll} 
        className="text-text-secondary hover:text-text-primary"
      >
        {isAllSelected ? <CheckSquare size={18} /> : <Square size={18} />}
      </button>
      <span className="text-sm font-medium text-text-primary flex-1">已选 {selectedCount} 项</span>
      <button 
        onClick={() => onBatchDelete(false)} 
        className="text-text-secondary hover:text-red-500 p-1"
        title="仅删除源文件"
        disabled={disabled}
      >
        <FileText size={18} />
      </button>
      <button 
        onClick={() => onBatchDelete(true)} 
        className="text-text-secondary hover:text-red-500 p-1"
        title="删除源文件与输出"
        disabled={disabled}
      >
        <Trash2 size={18} />
      </button>
      <button 
        onClick={onCancel} 
        className="text-text-secondary hover:text-text-primary ml-2 text-sm"
      >
        取消
      </button>
    </div>
  );
};

export default React.memo(SelectionMode);
