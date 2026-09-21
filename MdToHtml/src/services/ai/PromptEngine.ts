/**
 * PromptEngine — Prompt 模板引擎（实验版）
 *
 * 现状：一份精简的 System Prompt 内嵌在代码里，只服务于本地 mock 生成流程，
 *       目的是先把「输入 → 生成 → 展示」的链路跑通。
 *
 * 待办：正式契约（报文 + 风格切换 + 外部可配置）由协作阶段实现后替换本文件。
 */

export type PromptVariant = 'default' | 'alternative';

const DEFAULT_PROMPT = `你是一个 Markdown 结构化助手。
请把用户提供的文本整理为结构化 Markdown：保留原意、合并同类信息、适当分点。`;

const ALTERNATIVE_PROMPT = `你是一个学术写作助手。
请把用户提供的文本整理为结构化 Markdown：突出论点、保留术语、按小节组织。`;

export class PromptEngine {
  /** 实验版：同步返回内嵌 Prompt，不读外部配置 */
  static getSystemPrompt(variant: PromptVariant = 'default'): string {
    return variant === 'alternative' ? ALTERNATIVE_PROMPT : DEFAULT_PROMPT;
  }
}
