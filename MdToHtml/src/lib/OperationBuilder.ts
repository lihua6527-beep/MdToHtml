/**
 * OperationBuilder — 操作工厂
 *
 * 提供静态工厂方法，用于创建各种类型的 Operation。
 * 使用工厂模式确保：
 * 1. UUID、时间戳等字段自动生成
 * 2. 逆操作数据（inverse）自动计算
 * 3. 类型安全
 */

import {
  type TextOperation,
  type CardOperation,
  type AiOperation,
  type MetaOperation,
  type OperationProducer,
  OperationType,
  generateOperationId,
} from '@/types/operation';

// ──────────────────────────────────────────
// 默认值
// ──────────────────────────────────────────

const DEFAULT_PRODUCER: OperationProducer = 'codemirror';

/** 生成基础字段（id / timestamp / producer / description） */
function buildBase(producer?: OperationProducer, description?: string) {
  return {
    id: generateOperationId(),
    timestamp: Date.now(),
    producer: producer ?? DEFAULT_PRODUCER,
    description: description ?? '',
  };
}

// ──────────────────────────────────────────
// OperationBuilder 类
// ──────────────────────────────────────────

export class OperationBuilder {
  // ── 文本编辑操作 ──

  /**
   * 创建文本插入操作
   */
  static textInsert(opts: {
    position: number;
    text: string;
    producer?: OperationProducer;
    description?: string;
  }): TextOperation {
    const { position, text, producer, description } = opts;
    const type = OperationType.TEXT_INSERT as const;
    return {
      ...buildBase(producer, description),
      type,
      position,
      text,
      inverse: { position, text, type: OperationType.TEXT_DELETE },
      description: description ?? `插入「${text.slice(0, 20)}」`,
    };
  }

  /**
   * 创建文本删除操作
   */
  static textDelete(opts: {
    position: number;
    text: string;
    producer?: OperationProducer;
    description?: string;
  }): TextOperation {
    const { position, text, producer, description } = opts;
    const type = OperationType.TEXT_DELETE as const;
    return {
      ...buildBase(producer, description),
      type,
      position,
      text,
      inverse: { position, text, type: OperationType.TEXT_INSERT },
      description: description ?? `删除「${text.slice(0, 20)}」`,
    };
  }

  /**
   * 创建文本替换操作
   */
  static textReplace(opts: {
    position: number;
    oldText: string;
    newText: string;
    producer?: OperationProducer;
    description?: string;
  }): TextOperation {
    const { position, oldText, newText, producer, description } = opts;
    const type = OperationType.TEXT_REPLACE as const;
    return {
      ...buildBase(producer, description),
      type,
      position,
      text: newText,
      inverse: { position, text: oldText, type: OperationType.TEXT_REPLACE },
      description: description ?? `替换文本`,
    };
  }

  // ── 卡片操作 ──

  /**
   * 创建卡片（逆操作为 CARD_DELETE）
   */
  static cardCreate(opts: {
    cardId: string;
    cardData: Record<string, unknown>;
    sectionId?: string;
    producer?: OperationProducer;
    description?: string;
  }): CardOperation {
    const type = OperationType.CARD_CREATE as const;
    return {
      ...buildBase(opts.producer, opts.description),
      type,
      cardId: opts.cardId,
      before: {},
      after: opts.cardData,
      sectionId: opts.sectionId,
      description: opts.description ?? `创建卡片「${opts.cardId}」`,
    };
  }

  /**
   * 删除卡片（逆操作为 CARD_CREATE）
   */
  static cardDelete(opts: {
    cardId: string;
    beforeState: Record<string, unknown>;
    sectionId?: string;
    producer?: OperationProducer;
    description?: string;
  }): CardOperation {
    const type = OperationType.CARD_DELETE as const;
    return {
      ...buildBase(opts.producer, opts.description),
      type,
      cardId: opts.cardId,
      before: opts.beforeState,
      after: {},
      sectionId: opts.sectionId,
      description: opts.description ?? `删除卡片「${opts.cardId}」`,
    };
  }

  /**
   * 更新卡片属性
   */
  static cardUpdate(opts: {
    cardId: string;
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    sectionId?: string;
    producer?: OperationProducer;
    description?: string;
  }): CardOperation {
    const type = OperationType.CARD_UPDATE as const;
    return {
      ...buildBase(opts.producer, opts.description),
      type,
      cardId: opts.cardId,
      before: opts.before,
      after: opts.after,
      sectionId: opts.sectionId,
      description: opts.description ?? `更新卡片属性`,
    };
  }

  // ── AI 操作 ──

  /**
   * 创建 AI 操作
   */
  static aiOperation(opts: {
    type: OperationType.AI_GENERATE | OperationType.AI_REPLACE | OperationType.AI_REWRITE;
    prompt: string;
    tokensUsed: number;
    diff: {
      before: string;
      after: string;
      position: number;
    };
    producer?: OperationProducer;
    description?: string;
  }): AiOperation {
    return {
      ...buildBase(opts.producer, opts.description),
      type: opts.type,
      prompt: opts.prompt,
      tokensUsed: opts.tokensUsed,
      diff: opts.diff,
      description: opts.description ?? `AI：${opts.prompt.slice(0, 30)}`,
    };
  }

  // ── 元操作 ──

  /**
   * 批量操作（用于防抖合并）
   */
  static batch(opts: {
    children: import('@/types/operation').Operation[];
    description?: string;
    producer?: OperationProducer;
  }): MetaOperation {
    const type = OperationType.BATCH as const;
    return {
      ...buildBase(opts.producer, opts.description),
      type,
      children: opts.children,
      description: opts.description ?? `批量操作（${opts.children.length} 项）`,
    };
  }

  /**
   * 手动暂存点
   */
  static checkpoint(opts: {
    label: string;
    description?: string;
  }): MetaOperation {
    const type = OperationType.CHECKPOINT as const;
    return {
      ...buildBase('checkpoint', opts.description),
      type,
      label: opts.label,
      description: opts.description ?? `暂存点：${opts.label}`,
    };
  }

  /**
   * 语义标记
   */
  static marker(opts: {
    purpose: 'context_boundary' | 'validation_point';
    description?: string;
  }): MetaOperation {
    const type = OperationType.MARKER as const;
    return {
      ...buildBase('marker', opts.description),
      type,
      markerPurpose: opts.purpose,
      description: opts.description ?? `标记：${opts.purpose}`,
    };
  }
}