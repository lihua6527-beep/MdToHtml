/**
 * POST /api/ai/generate — 实验版（mock）
 *
 * 现状：不调用任何外部服务，延迟数百毫秒后返回一段固定的 Markdown，
 *       仅用于验证界面流程与数据形状。
 *
 * 待办：真实模型接入（API Key 管理、超时控制、模型白名单、错误码映射）
 *       属于协作阶段的工作，将在本文件上替换实现。
 */

import { NextRequest, NextResponse } from 'next/server';
import { PromptEngine } from '@/services/ai/PromptEngine';

const MOCK_MARKDOWN = `## 生成结果（示例）

- 真实模型接入后，这一段将替换为模型输出
- 当前仅用于验证「输入 → 生成 → 展示」链路`;

export async function POST(request: NextRequest) {
  const { text, promptVariant } = await request.json().catch(() => ({} as any));

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: '缺少必要参数: text' }, { status: 400 });
  }

  // 载入 Prompt，确保链路完整（当前 mock 不实际使用其内容）
  const systemPrompt = PromptEngine.getSystemPrompt(
    promptVariant === 'alternative' ? 'alternative' : 'default'
  );

  await new Promise((resolve) => setTimeout(resolve, 600));

  return NextResponse.json({
    markdown: `> 输入 ${text.length} 字符，System Prompt ${systemPrompt.length} 字符（mock）\n\n${MOCK_MARKDOWN}`,
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  });
}
