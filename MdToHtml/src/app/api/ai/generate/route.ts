/**
 * POST /api/ai/generate
 * 
 * AI 生成 API Route
 * - 接收前端请求，代理调用 DeepSeek V4 API
 * - API Key 从 ApiKeyManager 获取（支持惰性覆盖热加载）
 * - 不暴露到前端
 * - 支持 Flash (deepseek-chat) 和 Pro (deepseek-reasoner) 两种模型
 *
 * @see plans/AI配置面板计划/AI配置面板完整实施方案_20260709.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyManager } from '@/lib/env-hot-loader';

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const VALID_MODELS = ['deepseek-chat', 'deepseek-reasoner'];
const API_TIMEOUT_MS = 120000;
const MAX_TOKENS = 4096;
const TEMPERATURE = 0.3;

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const { text, model, systemPrompt } = await request.json();

    // 2. 校验参数
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '缺少必要参数: text' },
        { status: 400 }
      );
    }

    const selectedModel = VALID_MODELS.includes(model) ? model : 'deepseek-chat';

    // 3. 从 ApiKeyManager 获取 Key（支持惰性覆盖热加载）
    const apiKey = ApiKeyManager.get();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'DEEPSEEK_API_KEY 未配置',
          detail: '请在设置页面配置 DeepSeek API Key，或在 .env.local 中设置 DEEPSEEK_API_KEY=sk-your-key',
        },
        { status: 500 }
      );
    }

    // 4. 构造 DeepSeek API 请求
    const requestBody = {
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt || '' },
        { role: 'user', content: text },
      ],
      stream: false,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    };

    // 5. 调用 DeepSeek API（带超时控制）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 6. 处理错误响应
    if (!response.ok) {
      let errorMessage = `DeepSeek API 错误 [${response.status}]`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody?.error?.message || errorMessage;
      } catch {}

      // 区分不同错误类型
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'API Key 无效，请检查 DEEPSEEK_API_KEY 配置' },
          { status: 401 }
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: '请求频率超限，请稍后重试' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // 7. 解析成功响应
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'AI 返回内容为空' },
        { status: 500 }
      );
    }

    // 8. 返回结果
    return NextResponse.json({
      markdown: content,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    });
  } catch (error: any) {
    // 处理超时
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: '请求超时，请重试或选择更简单的文档' },
        { status: 504 }
      );
    }

    console.error('[AI Generate API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'AI 生成失败' },
      { status: 500 }
    );
  }
}