'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
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
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In a real app, log this to Sentry/LogRocket
    console.error(`[ErrorBoundary] Error in ${this.props.moduleName || 'Component'}:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optional: reload page if critical
    // window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-6 bg-red-50/50 rounded-lg border border-red-100 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            组件渲染出错了
          </h3>
          <p className="text-sm text-gray-500 max-w-md mb-6">
            {this.props.moduleName ? `在 ${this.props.moduleName} 模块中发生了异常。` : '发生了一个预期外的错误。'}
            系统已拦截此异常以防止页面崩溃。
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="w-full max-w-lg bg-gray-900 text-gray-100 p-4 rounded text-left text-xs font-mono overflow-auto max-h-48 mb-6">
              <p className="text-red-400 font-bold mb-2">{this.state.error.toString()}</p>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </div>
          )}

          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            尝试恢复
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
