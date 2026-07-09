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

  /** 当前是否使用了覆盖值（而非 process.env） */
  static get modified(): boolean {
    return this._modified;
  }

  /**
   * 获取当前有效的 API Key
   * - 若未修改：返回 process.env 的值（零 I/O）
   * - 若已修改：返回内存中的覆盖值（零 I/O）
   */
  static get(): string | null {
    if (this._modified) {
      return this.overrideValue;
    }
    return process.env.DEEPSEEK_API_KEY || null;
  }

  /**
   * 保存新的 API Key 到内存，并异步持久化到 .env.local
   *
   * ⚠️ 内存立即生效，文件写入失败不影响当前会话
   */
  static async set(newKey: string): Promise<{ success: boolean; error?: string }> {
    this.overrideValue = newKey;
    this._modified = true;

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

  /** 重置为 process.env 的值（清除覆盖） */
  static reset(): void {
    this.overrideValue = null;
    this._modified = false;
  }
}