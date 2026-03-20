/**
 * 统一日志管理工具
 * 提供结构化的日志记录功能，支持不同级别的日志和格式化输出
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

interface LogOptions {
  module?: string;
  context?: Record<string, any>;
  timestamp?: boolean;
}

class Logger {
  private static instance: Logger;
  private logs: Array<{
    level: LogLevel;
    message: string;
    module?: string;
    context?: Record<string, any>;
    timestamp: Date;
  }> = [];
  private maxLogs = 1000;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 记录调试级别日志
   */
  public debug(message: string, options?: LogOptions): void {
    this.log(LogLevel.DEBUG, message, options);
  }

  /**
   * 记录信息级别日志
   */
  public info(message: string, options?: LogOptions): void {
    this.log(LogLevel.INFO, message, options);
  }

  /**
   * 记录警告级别日志
   */
  public warn(message: string, options?: LogOptions): void {
    this.log(LogLevel.WARN, message, options);
  }

  /**
   * 记录错误级别日志
   */
  public error(message: string, options?: LogOptions): void {
    this.log(LogLevel.ERROR, message, options);
  }

  /**
   * 记录致命级别日志
   */
  public fatal(message: string, options?: LogOptions): void {
    this.log(LogLevel.FATAL, message, options);
  }

  /**
   * 核心日志记录方法
   */
  private log(level: LogLevel, message: string, options?: LogOptions): void {
    const timestamp = new Date();
    const logEntry = {
      level,
      message,
      module: options?.module,
      context: options?.context,
      timestamp
    };

    // 保存日志到内存
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // 移除最早的日志
    }

    // 格式化并输出到控制台
    const formattedMessage = this.formatLog(logEntry, options?.timestamp !== false);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.log(formattedMessage);
        break;
      case LogLevel.INFO:
        console.log(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.FATAL:
        console.error(formattedMessage);
        break;
    }
  }

  /**
   * 格式化日志消息
   */
  private formatLog(entry: any, includeTimestamp: boolean = true): string {
    let parts: string[] = [];

    if (includeTimestamp) {
      const timeStr = entry.timestamp.toISOString().replace('T', ' ').substr(0, 19);
      parts.push(`[${timeStr}]`);
    }

    parts.push(`[${entry.level.toUpperCase()}]`);

    if (entry.module) {
      parts.push(`[${entry.module}]`);
    }

    parts.push(entry.message);

    if (entry.context) {
      try {
        parts.push('\n' + JSON.stringify(entry.context, null, 2));
      } catch (e) {
        parts.push('\n[Context serialization error]');
      }
    }

    return parts.join(' ');
  }

  /**
   * 获取最近的日志
   */
  public getRecentLogs(limit: number = 50): Array<any> {
    return this.logs.slice(-limit);
  }

  /**
   * 清空日志
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * 导出日志为JSON
   */
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// 导出单例实例
export const logger = Logger.getInstance();

// 导出类型和方法
export default logger;