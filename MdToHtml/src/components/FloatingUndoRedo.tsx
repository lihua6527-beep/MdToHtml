import React from 'react';
import { ArrowLeft, RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingUndoRedoProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const FloatingUndoRedo: React.FC<FloatingUndoRedoProps> = ({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 bg-white/90 backdrop-blur shadow-sm border border-slate-200 p-1.5 rounded-lg animate-in fade-in slide-in-from-right-4">
      <Button
        onClick={onUndo}
        disabled={!canUndo}
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30"
        title="撤销 (Ctrl+Z)"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
      <Button
        onClick={onRedo}
        disabled={!canRedo}
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30"
        title="重做 (Ctrl+Y)"
      >
        <RotateCw className="w-4 h-4" />
      </Button>
    </div>
  );
};
