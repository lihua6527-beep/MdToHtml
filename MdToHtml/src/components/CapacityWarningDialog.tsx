import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

interface CapacityWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  onConfirmCleanup: () => void;
  cleanupLabel?: string;
  isLoading?: boolean;
}

export const CapacityWarningDialog: React.FC<CapacityWarningDialogProps> = ({
  isOpen,
  onClose,
  title = "容量已满",
  message,
  onConfirmCleanup,
  cleanupLabel = "清理旧文件",
  isLoading = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <AlertTriangle className="h-6 w-6" />
            <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-base">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex sm:justify-between gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
                取消操作
            </Button>
            <Button 
                variant="destructive" 
                onClick={onConfirmCleanup} 
                disabled={isLoading}
                className="gap-2"
            >
                <Trash2 className="h-4 w-4" />
                {isLoading ? "处理中..." : cleanupLabel}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
