/**
 * AIService — AI 服务核心
 * 
 * 职责：
 * - 封装调用 /api/ai/generate API Route
 * - 提供 generate() 和 regenerate() 方法
 * - 处理错误、重试逻辑
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

export class AIService {
  private static readonly API_ENDPOINT = '/api/ai/generate';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 2000, 4000]; // 退避间隔

  /**
   * 生成 CHD Markdown
   */
  static async generate(options: {
    text: string;
    config: AIServiceConfig;
  }): Promise<AIResult> {
    const { text, config } = options;
    const systemPrompt = PromptEngine.getSystemPrompt(config.promptVariant);

    let lastError: Error | null = null;

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
        // 如果是 AbortError（用户取消），不重试
        if (error.name === 'AbortError') {
          return { markdown: '', error: '已取消' };
        }
        // 最后一次尝试不等待
        if (attempt < this.MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, this.RETRY_DELAYS[attempt]));
        }
      }
    }

    return {
      markdown: '',
      error: lastError?.message || 'AI 生成失败，请重试',
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
    // 切换 Prompt 变体重新生成
    const newConfig: AIServiceConfig = {
      ...options.config,
      promptVariant: options.config.promptVariant === 'default' ? 'alternative' : 'default',
    };
    return this.generate({ text: options.text, config: newConfig });
  }
}