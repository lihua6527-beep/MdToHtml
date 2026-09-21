import React from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CheckpointPanel } from '@/components/CheckpointPanel';

interface CheckpointInfo {
  id: string;
  label: string;
  timestamp: number;
}

interface FloatingUndoRedoProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // ── 暂存点 ──
  getCheckpoints: () => CheckpointInfo[];
  goToCheckpoint: (checkpointId: string) => string | null;
  setCheckpoint: (label: string) => void;
}

export const FloatingUndoRedo: React.FC<FloatingUndoRedoProps> = ({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  getCheckpoints,
  goToCheckpoint,
  setCheckpoint,
}) => {
  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col items-end gap-2">
      {/* 撤销/重做按钮组 */}
      <div className="bg-white/90 backdrop-blur shadow-sm border border-slate-200 p-1.5 rounded-lg flex flex-col gap-2 animate-in fade-in slide-in-from-right-4">
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

        {/* 分隔线 */}
        <div className="w-full h-px bg-slate-100" />

        {/* 暂存点入口 */}
        <div className="flex justify-center">
          <CheckpointPanel
            getCheckpoints={getCheckpoints}
            goToCheckpoint={goToCheckpoint}
            setCheckpoint={setCheckpoint}
          />
        </div>
      </div>
    </div>
  );
};