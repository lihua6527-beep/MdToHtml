'use client';

import * as React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (props: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback(({ duration = 3000, ...props }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, duration, ...props }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-lg border animate-in slide-in-from-right-full fade-in duration-300",
            t.type === 'success' && "bg-background border-green-500/50 text-foreground",
            t.type === 'error' && "bg-destructive text-destructive-foreground border-destructive",
            t.type === 'warning' && "bg-yellow-50 border-yellow-500/50 text-yellow-900",
            t.type === 'info' && "bg-background border-border text-foreground",
            !t.type && "bg-background border-border text-foreground"
          )}
        >
          {t.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
          {t.type === 'error' && <AlertCircle className="w-5 h-5 text-destructive-foreground shrink-0" />}
          {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />}
          {t.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
          
          <div className="flex-1 grid gap-1">
            {t.title && <div className="font-semibold text-sm">{t.title}</div>}
            {t.description && <div className="text-xs opacity-90">{t.description}</div>}
          </div>
          
          <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-50 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
