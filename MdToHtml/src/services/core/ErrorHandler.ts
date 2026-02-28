import { ApiResponse, ErrorType, AppError } from '@/types/file-system';

// Re-export types for convenience
export { type ErrorType, type AppError };

/**
 * 错误处理工具类
 */
export class ErrorHandler {
  /**
   * 处理 API 响应错误
   */
  static handleApiError(error: any): AppError {
    if (error instanceof Response) {
      return {
        type: ErrorType.API,
        message: `API 错误: ${error.status} ${error.statusText}`,
        statusCode: error.status,
        originalError: error
      };
    }

    if (error.message) {
      return {
        type: ErrorType.API,
        message: error.message,
        originalError: error
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      message: '未知 API 错误',
      originalError: error
    };
  }

  /**
   * 处理网络错误
   */
  static handleNetworkError(error: any): AppError {
    return {
      type: ErrorType.NETWORK,
      message: '网络连接失败，请检查网络设置',
      originalError: error
    };
  }

  /**
   * 处理验证错误
   */
  static handleValidationError(message: string, details?: any): AppError {
    return {
      type: ErrorType.VALIDATION,
      message,
      details
    };
  }

  /**
   * 处理认证错误
   */
  static handleAuthError(message: string = '认证失败'): AppError {
    return {
      type: ErrorType.AUTH,
      message
    };
  }

  /**
   * 处理服务器错误
   */
  static handleServerError(message: string = '服务器内部错误'): AppError {
    return {
      type: ErrorType.SERVER,
      message
    };
  }

  /**
   * 处理未知错误
   */
  static handleUnknownError(error: any): AppError {
    return {
      type: ErrorType.UNKNOWN,
      message: '未知错误',
      originalError: error
    };
  }

  /**
   * 通用错误处理
   */
  static handleError(error: any): AppError {
    if (!error) {
      return this.handleUnknownError(error);
    }

    if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('network'))) {
      return this.handleNetworkError(error);
    }

    if (error.response) {
      return this.handleApiError(error.response);
    }

    if (error.message) {
      return {
        type: ErrorType.UNKNOWN,
        message: error.message,
        originalError: error
      };
    }

    return this.handleUnknownError(error);
  }

  /**
   * 格式化错误消息为用户友好的形式
   */
  static formatUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return '网络连接失败，请检查您的网络设置后重试';
      case ErrorType.API:
        return error.message || '服务器请求失败';
      case ErrorType.VALIDATION:
        return error.message || '输入数据无效';
      case ErrorType.AUTH:
        return error.message || '认证失败，请重新登录';
      case ErrorType.SERVER:
        return '服务器内部错误，请稍后重试';
      default:
        return '操作失败，请稍后重试';
    }
  }
}
