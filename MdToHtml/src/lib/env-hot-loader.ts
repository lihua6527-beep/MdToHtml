/**
 * env-hot-loader.ts — 运行时环境变量热加载器
 *
 * 设计模式：惰性覆盖（Lazy Override）
 * - 初始化时以 process.env 为基准值
 * - 用户修改 Key 时，写入内存覆盖值 + 持久化到文件
 * - AI 请求时根据 modified 标志决定取哪个值
 * - 运行时零文件 I/O，只在保存时写一次文件
 *
 * @see plans/AI配置面板计划/API_Key热存储技术方案讨论_20260709.md
 */

export class ApiKeyManager {
  /** 内存覆盖值，用户修改后保存于此 */
  private static overrideValue: string | null = null;

  /** 修改标志 */
  private static _modified = false;

  /** localStorage 键名（用于跨会话持久化） */
  private static readonly STORAGE_KEY = 'deepseek_api_key';

  /** 是否已完成初始化恢复（从 localStorage 恢复到内存） */
  private static _initialized = false;

  /** 当前是否使用了覆盖值（而非 process.env） */
  static get modified(): boolean {
    return this._modified;
  }

  /**
   * 从 localStorage 恢复到内存（仅在首次 get() 时执行一次）
   */
  private static ensureLocalStorageRestored(): void {
    if (this._initialized) return;
    this._initialized = true;

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.overrideValue = stored;
        this._modified = true;
      }
    }
  }

  /**
   * 获取当前有效的 API Key
   * 
   * 查询优先级（零 I/O）：
   * 1. 内存覆盖值（同页面内用户手动设置 / localStorage 恢复）
   * 2. process.env（服务端渲染 / 静态构建）
   */
  static get(): string | null {
    // 首次调用时从 localStorage 恢复到内存
    this.ensureLocalStorageRestored();

    // 1. 内存覆盖值（含 localStorage 恢复的值）
    if (this._modified) {
      return this.overrideValue;
    }

    // 2. process.env（服务端渲染时）
    return process.env.DEEPSEEK_API_KEY || null;
  }

  /**
   * 保存新的 API Key
   * 
   * 三路持久化：
   * - 内存（立即生效，零延迟）
   * - localStorage（浏览器端，关闭重开不丢失）████ 关键修复
   * - .env.local（服务端，重启不丢失）
   */
  static async set(newKey: string): Promise<{ success: boolean; error?: string }> {
    this.overrideValue = newKey;
    this._modified = true;
    this._initialized = true;

    // 同步写入 localStorage（浏览器端持久化，关闭重开仍存在）
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, newKey);
    }

    // 异步持久化到服务端 .env.local
    try {
      const res = await fetch('/api/ai/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newKey }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.warn('[ApiKeyManager] 服务端持久化失败:', body?.error || res.statusText);
        return { success: true, error: body?.error || '文件写入失败，但内存已生效' };
      }

      return { success: true };
    } catch (err: any) {
      console.warn('[ApiKeyManager] 持久化请求异常，但内存已生效:', err.message);
      return { success: true, error: '网络异常，但内存已生效' };
    }
  }

  /** 清除所有层的 Key 覆盖 */
  static reset(): void {
    this.overrideValue = null;
    this._modified = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
