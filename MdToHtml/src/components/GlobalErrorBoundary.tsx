'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Copy, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

/**
 * Global Error Boundary Component
 * Captures React render errors and displays a friendly fallback UI.
 * Implements "Robustness Improvement" R-01.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error, 
      errorInfo: null,
      copied: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error(`[ErrorBoundary] Error in ${this.props.moduleName || 'Component'}:`, error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = () => {
    if (this.state.error && this.state.errorInfo) {
      const errorMessage = `${this.state.error.toString()}\n\n${this.state.errorInfo.componentStack}`;
      navigator.clipboard.writeText(errorMessage).then(() => {
        this.setState({ copied: true });
        setTimeout(() => {
          this.setState({ copied: false });
        }, 2000);
      });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-6 bg-red-50/50 rounded-lg border border-red-100 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            系统遇到了问题
          </h3>
          <p className="text-sm text-gray-500 max-w-md mb-8">
            {this.props.moduleName ? `在 ${this.props.moduleName} 模块中发生了异常。` : '发生了一个预期外的错误。'}
            系统已拦截此异常以防止页面崩溃，您可以尝试恢复或返回首页。
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="w-full max-w-lg bg-gray-900 text-gray-100 p-4 rounded text-left text-xs font-mono overflow-auto max-h-64 mb-8">
              <div className="flex justify-between items-center mb-2">
                <p className="text-red-400 font-bold">错误信息</p>
                <button
                  onClick={this.handleCopyError}
                  className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                  title="复制错误信息"
                >
                  <Copy className="w-3 h-3" />
                  {this.state.copied ? '已复制' : '复制'}
                </button>
              </div>
              <p className="mb-2">{this.state.error.toString()}</p>
              <pre className="text-gray-400">{this.state.errorInfo?.componentStack}</pre>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              尝试恢复
            </button>
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              刷新页面
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <Home className="w-4 h-4" />
              返回首页
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
