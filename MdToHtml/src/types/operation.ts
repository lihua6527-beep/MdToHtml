/**
 * 操作类型系统 — 操作引擎基座
 *
 * ===== 设计决策 (ADR) =====
 * ADR-001: 使用 crypto.randomUUID() 而非 uuid 第三方包，减少依赖
 * ADR-002: Operation 接口使用联合类型（Discriminated Union）而非继承，利于类型守卫
 * ADR-003: 逆操作作为独立计算函数，非 Operation 方法，保持接口纯净
 * ADR-004: 所有接口使用 readonly 属性确保不可变性
 *
 * ===== 扩展指南 =====
 * 新增操作类型时：
 * 1. 在 OperationType 枚举中添加新值
 * 2. 创建对应的接口（extends Operation）
 * 3. 在 OperationBuilder 中添加工厂方法
 * 4. 在 invertOperation() 中添加逆操作映射
 */

// ──────────────────────────────────────────
// UUID 生成（使用 Node.js 内置 crypto）
// ──────────────────────────────────────────

/**
 * 生成 UUID v4，无需外部依赖
 * 兼容 Node 19+ 和现代浏览器
 */
export function generateOperationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 降级方案：手动生成
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ──────────────────────────────────────────
// OperationType 枚举
// ──────────────────────────────────────────

/** 操作类型枚举 */
export enum OperationType {
  // ── 文本编辑操作 ──
  TEXT_INSERT = 'TEXT_INSERT',
  TEXT_DELETE = 'TEXT_DELETE',
  TEXT_REPLACE = 'TEXT_REPLACE',

  // ── 卡片操作 ──
  CARD_CREATE = 'CARD_CREATE',
  CARD_DELETE = 'CARD_DELETE',
  CARD_MOVE = 'CARD_MOVE',
  CARD_UPDATE = 'CARD_UPDATE',

  // ── AI 辅助操作 ──
  AI_GENERATE = 'AI_GENERATE',
  AI_REPLACE = 'AI_REPLACE',
  AI_REWRITE = 'AI_REWRITE',

  // ── 元操作 ──
  BATCH = 'BATCH',
  CHECKPOINT = 'CHECKPOINT',
  MARKER = 'MARKER',
}

/** 操作生产者标识 */
export type OperationProducer =
  | 'codemirror'
  | 'card'
  | 'ai'
  | 'drag'
  | 'checkpoint'
  | 'marker';

// ──────────────────────────────────────────
// 操作基接口
// ──────────────────────────────────────────

/** 操作基接口 */
export interface Operation {
  /** 唯一标识（UUID v4） */
  readonly id: string;

  /** 操作类型 */
  readonly type: OperationType;

  /** 时间戳（毫秒） */
  readonly timestamp: number;

  /** 操作生产者标识 */
  readonly producer: OperationProducer;

  /** 操作描述（用于 UI 显示，如"撤销：插入文本"） */
  readonly description: string;
}

// ──────────────────────────────────────────
// 文本编辑操作
// ──────────────────────────────────────────

/** 文本编辑操作 */
export interface TextOperation extends Operation {
  readonly type:
    | OperationType.TEXT_INSERT
    | OperationType.TEXT_DELETE
    | OperationType.TEXT_REPLACE;

  /** 操作位置（CodeMirror position/ch） */
  readonly position: number;

  /** 操作涉及的文本内容 */
  readonly text: string;

  /** 逆操作数据（用于撤销时反转） */
  readonly inverse: {
    readonly position: number;
    readonly text: string;
    readonly type: OperationType;
  };
}

// ──────────────────────────────────────────
// 卡片操作
// ──────────────────────────────────────────

/** 卡片操作 */
export interface CardOperation extends Operation {
  readonly type:
    | OperationType.CARD_CREATE
    | OperationType.CARD_DELETE
    | OperationType.CARD_MOVE
    | OperationType.CARD_UPDATE;

  /** 卡片 ID */
  readonly cardId: string;

  /** 变更前的状态（用于撤销恢复） */
  readonly before: Readonly<Record<string, unknown>>;

  /** 变更后的状态（用于重做恢复） */
  readonly after: Readonly<Record<string, unknown>>;

  /** 相关 Section ID（可选） */
  readonly sectionId?: string;
}

// ──────────────────────────────────────────
// AI 辅助操作
// ──────────────────────────────────────────

/** AI 辅助操作 */
export interface AiOperation extends Operation {
  readonly type:
    | OperationType.AI_GENERATE
    | OperationType.AI_REPLACE
    | OperationType.AI_REWRITE;

  /** AI 指令 */
  readonly prompt: string;

  /** 消耗 tokens 数 */
  readonly tokensUsed: number;

  /** 操作前后的文本对比 */
  readonly diff: {
    readonly before: string;
    readonly after: string;
    readonly position: number;
  };
}

// ──────────────────────────────────────────
// 元操作（批量/标记/暂存点）
// ──────────────────────────────────────────

/** 元操作（批量/标记/暂存点） */
export interface MetaOperation extends Operation {
  readonly type:
    | OperationType.BATCH
    | OperationType.CHECKPOINT
    | OperationType.MARKER;

  /** 子操作列表（BATCH 类型时） */
  readonly children?: readonly Operation[];

  /** 暂存点名称（CHECKPOINT 类型时） */
  readonly label?: string;

  /** 标记用途（MARKER 类型时） */
  readonly markerPurpose?: 'context_boundary' | 'validation_point';
}

// ──────────────────────────────────────────
// 联合类型
// ──────────────────────────────────────────

/** 所有操作类型的联合 */
export type AnyOperation =
  | TextOperation
  | CardOperation
  | AiOperation
  | MetaOperation;

// ──────────────────────────────────────────
// 逆操作计算
// ──────────────────────────────────────────

/**
 * 计算给定操作的逆操作
 *
 * 原则：
 * - TEXT_INSERT ↔ TEXT_DELETE（位置不变，内容互换）
 * - TEXT_REPLACE → TEXT_REPLACE（新旧内容互换）
 * - Card/Meta 操作使用 before/after 交换
 * - AI 操作交换 diff.before / diff.after
 * - CHECKPOINT/MARKER/BATCH 的逆操作为自身（幂等）
 */
export function invertOperation(op: AnyOperation): AnyOperation {
  switch (op.type) {
    case OperationType.TEXT_INSERT: {
      return {
        ...op,
        type: OperationType.TEXT_DELETE,
        text: op.inverse.text,
        inverse: {
          position: op.position,
          text: op.text,
          type: OperationType.TEXT_INSERT,
        },
        description: `撤销：插入文本`,
      };
    }

    case OperationType.TEXT_DELETE: {
      return {
        ...op,
        type: OperationType.TEXT_INSERT,
        text: op.inverse.text,
        inverse: {
          position: op.position,
          text: op.text,
          type: OperationType.TEXT_DELETE,
        },
        description: `撤销：删除文本`,
      };
    }

    case OperationType.TEXT_REPLACE: {
      const origText = op.text;
      return {
        ...op,
        text: op.inverse.text,
        inverse: {
          position: op.position,
          text: origText,
          type: OperationType.TEXT_REPLACE,
        },
        description: `撤销：替换文本`,
      };
    }

    case OperationType.CARD_CREATE: {
      return {
        ...op,
        type: OperationType.CARD_DELETE,
        before: op.after,
        after: op.before,
        description: `撤销：创建卡片`,
      };
    }

    case OperationType.CARD_DELETE: {
      return {
        ...op,
        type: OperationType.CARD_CREATE,
        before: op.after,
        after: op.before,
        description: `撤销：删除卡片`,
      };
    }

    case OperationType.CARD_UPDATE:
    case OperationType.CARD_MOVE: {
      return {
        ...op,
        before: op.after,
        after: op.before,
        description: `撤销：${op.type === OperationType.CARD_UPDATE ? '更新卡片' : '移动卡片'}`,
      };
    }

    case OperationType.AI_GENERATE:
    case OperationType.AI_REPLACE:
    case OperationType.AI_REWRITE: {
      return {
        ...op,
        diff: {
          before: op.diff.after,
          after: op.diff.before,
          position: op.diff.position,
        },
        description: `撤销：AI 操作`,
      };
    }

    // 元操作：幂等
    case OperationType.BATCH:
    case OperationType.CHECKPOINT:
    case OperationType.MARKER: {
      return { ...op, description: `撤销：${op.description}` };
    }

    default:
      throw new Error(`Unknown operation type: ${(op as Operation).type}`);
  }
}