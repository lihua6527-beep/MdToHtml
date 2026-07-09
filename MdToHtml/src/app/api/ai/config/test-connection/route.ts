/**
 * POST /api/ai/config/test-connection
 *
 * 验证 API Key 有效性
 * - 向 DeepSeek API 发送一条极小请求（消耗约 10-50 tokens）
 * - 返回连接状态、延迟、错误详情
 *
 * @see plans/AI配置面板计划/AI配置面板完整实施方案_20260709.md
 */

import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

/** HTTP 状态码 → 用户可理解的错误消息 */
const ERROR_MESSAGES: Record<number, string> = {
  401: 'API Key 无效或已吊销，请在 DeepSeek 平台检查',
  403: '该 Key 无调用权限，请在 DeepSeek 平台检查权限设置',
  429: '请求过于频繁（Rate Limit），请稍后重试',
  500: 'DeepSeek 服务端错误，请稍后重试',
  502: 'DeepSeek 网关错误，请稍后重试',
  503: 'DeepSeek 服务暂时不可用，请稍后重试',
};

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const { apiKey } = await request.json();

    // 2. 校验参数
    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { success: false, code: 'FORMAT_ERROR', message: '缺少 API Key 参数' },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey.trim();

    if (!trimmedKey.startsWith('sk-')) {
      return NextResponse.json(
        { success: false, code: 'FORMAT_ERROR', message: 'API Key 格式不正确，DeepSeek Key 应以 sk- 开头' },
        { status: 400 }
      );
    }

    // 3. 发送极小验证请求
    const start = Date.now();

    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${trimmedKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1, // 仅生成 1 个 token，极小消耗
      }),
    });

    const latency = Date.now() - start;

    // 4. 处理成功响应
    if (response.ok) {
      return NextResponse.json({
        success: true,
        latency,
        message: `连接成功 (${latency}ms)`,
      });
    }

    // 5. 处理错误响应
    const errorMessage = ERROR_MESSAGES[response.status]
      || `服务端错误 (${response.status})`;

    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error?.message || '';
    } catch {}

    return NextResponse.json({
      success: false,
      code: String(response.status),
      message: errorMessage,
      detail,
    });
  } catch (error: any) {
    // 网络错误（DNS 解析失败、连接超时等）
    const isNetworkError = error.cause === 'EAI_AGAIN'
      || error.message?.includes('ENOTFOUND')
      || error.message?.includes('ECONNREFUSED')
      || error.message?.includes('ETIMEDOUT');

    return NextResponse.json({
      success: false,
      code: isNetworkError ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR',
      message: isNetworkError
        ? `无法连接到 DeepSeek API，请检查网络连接和代理设置`
        : `验证过程出现异常: ${error.message || '未知错误'}`,
    });
  }
}