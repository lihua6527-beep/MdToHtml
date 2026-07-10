/**
 * AIService — AI 服务核心
 * 
 * 职责：
 * - 封装调用 /api/ai/generate API Route
 * - 提供 generate() 和 regenerate() 方法
 * - 处理错误、重试逻辑
 * - 提供结构化的错误码 → 中文提示映射
 * 
 * 注意：API Key 不在此文件中出现，通过服务端 API Route 保护
 */

import { PromptEngine } from './PromptEngine';

export interface AIServiceConfig {
  model: 'deepseek-chat' | 'deepseek-reasoner';
  promptVariant: 'default' | 'alternative';
  signal?: AbortSignal;
}

export interface AIResult {
  markdown: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

/** HTTP 状态码 → 中文友好提示映射 */
const HTTP_ERROR_MAP: Record<number, string> = {
  401: 'API Key 无效，请检查设置面板中的 Key 是否正确',
  403: '账户余额不足或权限受限，请检查 DeepSeek 账户',
  429: '请求过于频繁，请稍后重试',
};

const DEFAULT_HTTP_ERROR = 'AI 服务暂时不可用，请稍后重试';

/** 网络错误 → 中文友好提示 */
const NETWORK_ERROR_MESSAGE = '网络连接超时，请检查网络后重试';

export class AIService {
  private static readonly API_ENDPOINT = '/api/ai/generate';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 2000, 4000];

  /**
   * 将错误对象解析为结构化的中文错误信息
   */
  private static parseError(error: any, status?: number): string {
    // HTTP 状态码优先
    if (status) {
      if (status >= 500) return DEFAULT_HTTP_ERROR;
      return HTTP_ERROR_MAP[status] || DEFAULT_HTTP_ERROR;
    }

    // 网络层错误
    if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      return NETWORK_ERROR_MESSAGE;
    }

    // AbortError → 用户取消
    if (error?.name === 'AbortError') {
      return '已取消';
    }

    // 兜底：使用原始错误消息
    return error?.message || DEFAULT_HTTP_ERROR;
  }

  /**
   * 生成 CHD Markdown
   */
  static async generate(options: {
    text: string;
    config: AIServiceConfig;
  }): Promise<AIResult> {
    const { text, config } = options;
    const systemPrompt = await PromptEngine.getSystemPrompt(config.promptVariant);

    let lastError: Error | null = null;
    let lastStatus: number | undefined;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(this.API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            model: config.model,
            systemPrompt,
          }),
          signal: config.signal,
        });

        if (!response.ok) {
          lastStatus = response.status;
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            `AI 服务错误 [${response.status}]: ${errorBody?.error || response.statusText}`
          );
        }

        const data = await response.json();
        return {
          markdown: data.markdown,
          usage: data.usage,
        };
      } catch (error: any) {
        lastError = error;
        if (error.name === 'AbortError') {
          return { markdown: '', error: '已取消' };
        }
        if (attempt < this.MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, this.RETRY_DELAYS[attempt]));
        }
      }
    }

    return {
      markdown: '',
      error: this.parseError(lastError, lastStatus),
    };
  }

  /**
   * 重新生成（使用备选 Prompt）
   */
  static async regenerate(options: {
    text: string;
    previousResult: string;
    config: AIServiceConfig;
  }): Promise<AIResult> {
    const newConfig: AIServiceConfig = {
      ...options.config,
      promptVariant: options.config.promptVariant === 'default' ? 'alternative' : 'default',
    };
    return this.generate({ text: options.text, config: newConfig });
  }
}