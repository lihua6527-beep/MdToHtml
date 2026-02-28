import React from 'react';
import { AlertCircle, X, RefreshCw, WifiOff, Lock, Server, AlertTriangle } from 'lucide-react';
import { Button } from './button';
import { AppError, ErrorType } from '@/types/file-system';

interface ErrorDialogProps {
  error: AppError | null;
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

const getErrorIcon = (type: ErrorType) => {
  switch (type) {
    case ErrorType.NETWORK:
      return <WifiOff className="w-6 h-6 text-red-500" />;
    case ErrorType.API:
      return <AlertCircle className="w-6 h-6 text-orange-500" />;
    case ErrorType.VALIDATION:
      return <AlertTriangle className="w-6 h-6 text-amber-500" />;
    case ErrorType.AUTH:
      return <Lock className="w-6 h-6 text-blue-500" />;
    case ErrorType.SERVER:
      return <Server className="w-6 h-6 text-purple-500" />;
    default:
      return <AlertCircle className="w-6 h-6 text-gray-500" />;
  }
};

const getErrorTitle = (type: ErrorType) => {
  switch (type) {
    case ErrorType.NETWORK:
      return '网络连接错误';
    case ErrorType.API:
      return '请求失败';
    case ErrorType.VALIDATION:
      return '输入验证错误';
    case ErrorType.AUTH:
      return '认证失败';
    case ErrorType.SERVER:
      return '服务器错误';
    default:
      return '操作失败';
  }
};

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  error,
  isOpen,
  onClose,
  onRetry
}) => {
  if (!isOpen || !error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-bg-card rounded-lg shadow-xl max-w-md w-full p-6 border border-border-soft">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getErrorIcon(error.type)}
            <h3 className="text-lg font-semibold text-text-primary">
              {getErrorTitle(error.type)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-md hover:bg-bg-page"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 text-text-secondary">
          <p>{error.message}</p>
          {error.details && (
            <div className="mt-2 text-sm text-text-muted">
              <pre className="whitespace-pre-wrap">{JSON.stringify(error.details, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          {onRetry && (error.type === ErrorType.NETWORK || error.type === ErrorType.API) && (
            <Button
              variant="secondary"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </Button>
          )}
          <Button variant="default" onClick={onClose}>
            确定
          </Button>
        </div>
      </div>
    </div>
  );
};
