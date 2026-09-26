/**
 * AIContextBuilder — AI 上下文构建器
 *
 * 根据选中文本长度自动选择合适的上下文层级，
 * 生成针对性的 Prompt，控制 token 消耗。
 *
 * ===== 上下文层级 =====
 * - 轻量 (<100 字符): 仅选中文本，无额外上下文
 * - 中等 (<500 字符): 选中文本 + 前后各 2 行
 * - 完整 (≥500 字符): 整段 + 位置描述
 */

import { OperationType } from '@/types/operation';

// ──────────────────────────────────────────
// 类型定义
// ──────────────────────────────────────────

export type AIActionType =
  | 'polish'    // 润色
  | 'expand'    // 扩充
  | 'summarize' // 总结
  | 'to_card'   // 转卡片
  | 'custom';   // 自定义指令

interface AIContextOptions {
  /** 全文内容（用于提取上下文） */
  fullContent: string;
  /** 选中的文本 */
  selectedText: string;
  /** 选中文本的起始位置（行号或字符索引） */
  selectionStart?: number;
  /** 选中文本的结束位置 */
  selectionEnd?: number;
  /** AI 操作类型 */
  action: AIActionType;
  /** 自定义指令（action 为 custom 时必填） */
  customPrompt?: string;
}

interface AIContextResult {
  /** 构建好的 prompt 文本 */
  prompt: string;
  /** token 估算：prompt 部分 */
  estimatedPromptTokens: number;
  /** 上下文层级 */
  level: 'lite' | 'medium' | 'full';
  /** 原始选中文本（用于对比） */
  selectedText: string;
}

// ──────────────────────────────────────────
// Prompt 模板
// ──────────────────────────────────────────

function buildSystemPrompt(action: AIActionType, customPrompt?: string): string {
  const baseRules = `你是一个 CHD (Card-based Hierarchical Document) 格式的 Markdown 编辑助手。
CHD 格式规范：
- ## 表示章节 (Section)
- ### 表示卡片 (Card)
- 卡片属性使用 {} 包裹，如 {col-span="2" shape="rect"}
- 支持的卡片样式：normal, highlight, quote, code`;

  const actionPrompts: Record<AIActionType, string> = {
    polish: `请润色以下文本，保持原有 CHD 格式标记不变：
- 修正语法和错别字
- 优化表达流畅度
- 保持原有风格
- 不改变原意
- 不修改 CHD 标记属性`,
    
    expand: `请扩充以下文本，保持原有 CHD 格式标记不变：
- 补充更多细节和说明
- 增加相关示例
- 保持逻辑连贯
- 不修改 CHD 标记属性
- 扩充后的长度约为原来的 2-3 倍`,
    
    summarize: `请总结以下文本，保持原有 CHD 格式标记不变：
- 提取核心要点
- 保持关键信息完整
- 压缩到原文的 1/3 左右
- 不修改 CHD 标记属性`,
    
    to_card: `请将以下文本转换为 CHD 卡片格式：
- 使用 ### 标记卡片标题
- 提取合适的内容组织为卡片
- 添加合理的 col-span 属性
- 如果有多条内容，拆分为多个卡片
- 为每个卡片起一个准确的标题`,

    custom: customPrompt ? `请根据以下指令处理文本：${customPrompt}` : '请处理以下文本：',
  };

  return `${baseRules}\n\n${actionPrompts[action]}`;
}

// ──────────────────────────────────────────
// Token 估算（粗略）
// ──────────────────────────────────────────

function estimateTokens(text: string): number {
  // 中文约 1.5 token/字，英文约 1 token/4 字符
  const chineseChars = (text.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars * 1.5 + otherChars * 0.25);
}

// ──────────────────────────────────────────
// 上下文提取
// ──────────────────────────────────────────

function extractContext(fullContent: string, selectedText: string): {
  before: string;
  after: string;
} {
  const selIndex = fullContent.indexOf(selectedText);
  if (selIndex === -1) return { before: '', after: '' };

  const beforeText = fullContent.slice(0, selIndex);
  const afterText = fullContent.slice(selIndex + selectedText.length);

  // 提取前后各 2 行
  const beforeLines = beforeText.split('\n');
  const afterLines = afterText.split('\n');

  return {
    before: beforeLines.slice(-2).join('\n'),
    after: afterLines.slice(0, 2).join('\n'),
  };
}

// ──────────────────────────────────────────
// 主构建函数
// ──────────────────────────────────────────

export function buildContext(options: AIContextOptions): AIContextResult {
  const { fullContent, selectedText, action, customPrompt } = options;
  const textLen = selectedText.length;

  // 自动选择上下文层级
  let level: 'lite' | 'medium' | 'full';
  let systemPrompt: string;

  if (textLen < 100) {
    level = 'lite';
    systemPrompt = buildSystemPrompt(action, customPrompt);
  } else if (textLen < 500) {
    level = 'medium';
    const { before, after } = extractContext(fullContent, selectedText);
    systemPrompt = [
      buildSystemPrompt(action, customPrompt),
      before ? `前文：\n${before}\n---` : '',
      after ? `---\n后文：\n${after}` : '',
    ].filter(Boolean).join('\n\n');
  } else {
    level = 'full';
    systemPrompt = buildSystemPrompt(action, customPrompt);
  }

  const fullPrompt = `${systemPrompt}\n\n需要处理的文本：\n\`\`\`\n${selectedText}\n\`\`\``;
  const promptTokens = estimateTokens(fullPrompt);

  return {
    prompt: fullPrompt,
    estimatedPromptTokens: promptTokens,
    level,
    selectedText,
  };
}

// ──────────────────────────────────────────
// 操作类型映射
// ──────────────────────────────────────────

export function actionToOperationType(action: AIActionType): OperationType {
  switch (action) {
    case 'polish':
      return OperationType.AI_REWRITE;
    case 'expand':
      return OperationType.AI_GENERATE;
    case 'summarize':
      return OperationType.AI_REPLACE;
    case 'to_card':
      return OperationType.AI_GENERATE;
    case 'custom':
      return OperationType.AI_REPLACE;
  }
}