/**
 * 操作类型系统 — 单元测试
 *
 * 覆盖范围：
 * 1. OperationType 枚举完整性
 * 2. Operation 接口结构（TEXT / CARD / AI / META）
 * 3. invertOperation() 逆操作计算
 * 4. 序列化/反序列化
 * 5. 前向兼容扩展点（Plan 04/06/07）
 */

import {
  OperationType,
  type TextOperation,
  type CardOperation,
  type AiOperation,
  type MetaOperation,
  type AnyOperation,
  invertOperation,
  generateOperationId,
} from '@/types/operation';
import { OperationBuilder } from '@/lib/OperationBuilder';

// ──────────────────────────────────────────
// 辅助函数
// ──────────────────────────────────────────

/**
 * 创建一个基础的、用于测试的 TextOperation
 */
function makeTextOp(
  overrides: {
    type: OperationType.TEXT_INSERT | OperationType.TEXT_DELETE | OperationType.TEXT_REPLACE;
    position: number;
    text: string;
    inverse: { position: number; text: string; type: OperationType };
  } & Partial<Omit<TextOperation, 'type' | 'position' | 'text' | 'inverse'>>
): TextOperation {
  return {
    id: generateOperationId(),
    timestamp: Date.now(),
    producer: 'codemirror' as const,
    description: '',
    ...overrides,
  };
}

/**
 * 创建一个基础的、用于测试的 CardOperation
 */
function makeCardOp(
  type: CardOperation['type'],
  overrides?: Partial<Omit<CardOperation, 'type'>>
): CardOperation {
  return {
    id: generateOperationId(),
    timestamp: Date.now(),
    producer: 'card' as const,
    description: '',
    cardId: 'test-card-1',
    before: {},
    after: {},
    type,
    ...overrides,
  };
}

// ──────────────────────────────────────────
// 测试套件
// ──────────────────────────────────────────

describe('OperationType Enums', () => {
  it('should have 14 defined operation types', () => {
    const values = Object.values(OperationType);
    expect(values.length).toBe(14);
  });

  it('should have all text editing types', () => {
    expect(OperationType.TEXT_INSERT).toBe('TEXT_INSERT');
    expect(OperationType.TEXT_DELETE).toBe('TEXT_DELETE');
    expect(OperationType.TEXT_REPLACE).toBe('TEXT_REPLACE');
  });

  it('should have all card operation types', () => {
    expect(OperationType.CARD_CREATE).toBe('CARD_CREATE');
    expect(OperationType.CARD_DELETE).toBe('CARD_DELETE');
    expect(OperationType.CARD_MOVE).toBe('CARD_MOVE');
    expect(OperationType.CARD_UPDATE).toBe('CARD_UPDATE');
  });

  it('should have all AI operation types', () => {
    expect(OperationType.AI_GENERATE).toBe('AI_GENERATE');
    expect(OperationType.AI_REPLACE).toBe('AI_REPLACE');
    expect(OperationType.AI_REWRITE).toBe('AI_REWRITE');
  });

  it('should have all meta operation types', () => {
    expect(OperationType.BATCH).toBe('BATCH');
    expect(OperationType.CHECKPOINT).toBe('CHECKPOINT');
    expect(OperationType.MARKER).toBe('MARKER');
  });
});

describe('Operation Type Guards (Structure)', () => {
  it('should distinguish TextOperation by type field', () => {
    const op: AnyOperation = {
      id: '1',
      timestamp: 100,
      producer: 'codemirror' as const,
      description: '',
      type: OperationType.TEXT_INSERT,
      position: 5,
      text: 'hello',
      inverse: { position: 5, text: 'hello', type: OperationType.TEXT_DELETE },
    };

    // Type guard by discriminator
    if (op.type === OperationType.TEXT_INSERT) {
      expect(op.position).toBe(5);
      expect(op.text).toBe('hello');
    } else {
      fail('Should be a TextOperation');
    }
  });

  it('should distinguish CardOperation by type field', () => {
    const op: AnyOperation = {
      id: '2',
      timestamp: 100,
      producer: 'card' as const,
      description: '',
      type: OperationType.CARD_CREATE,
      cardId: 'card-1',
      before: {},
      after: { title: 'New Card' },
    };

    if (
      op.type === OperationType.CARD_CREATE ||
      op.type === OperationType.CARD_DELETE ||
      op.type === OperationType.CARD_MOVE ||
      op.type === OperationType.CARD_UPDATE
    ) {
      expect(op.cardId).toBe('card-1');
    } else {
      fail('Should be a CardOperation');
    }
  });

  it('should distinguish AiOperation by type field', () => {
    const op: AiOperation = {
      id: '3',
      timestamp: 100,
      producer: 'ai' as const,
      description: '',
      type: OperationType.AI_REPLACE,
      prompt: '润色这段文字',
      tokensUsed: 150,
      diff: { before: 'old', after: 'new', position: 0 },
    };

    expect(op.prompt).toBe('润色这段文字');
    expect(op.tokensUsed).toBe(150);
    expect(op.diff.after).toBe('new');
  });

  it('should distinguish MetaOperation by type field', () => {
    const op: MetaOperation = {
      id: '4',
      timestamp: 100,
      producer: 'checkpoint' as const,
      description: '',
      type: OperationType.CHECKPOINT,
      label: 'v1.0 备份',
    };

    expect(op.label).toBe('v1.0 备份');
  });
});

describe('invertOperation', () => {
  describe('Text Operations', () => {
    it('should invert TEXT_INSERT to TEXT_DELETE', () => {
      const insertOp = makeTextOp({
        type: OperationType.TEXT_INSERT,
        position: 5,
        text: 'hello',
        inverse: { position: 5, text: 'hello', type: OperationType.TEXT_DELETE },
      });

      const inverted = invertOperation(insertOp) as TextOperation;

      expect(inverted.type).toBe(OperationType.TEXT_DELETE);
      expect(inverted.position).toBe(5);
      expect(inverted.inverse.type).toBe(OperationType.TEXT_INSERT);
    });

    it('should invert TEXT_DELETE to TEXT_INSERT', () => {
      const deleteOp = makeTextOp({
        type: OperationType.TEXT_DELETE,
        position: 3,
        text: 'world',
        inverse: { position: 3, text: 'world', type: OperationType.TEXT_INSERT },
      });

      const inverted = invertOperation(deleteOp) as TextOperation;

      expect(inverted.type).toBe(OperationType.TEXT_INSERT);
      expect(inverted.position).toBe(3);
    });

    it('should invert TEXT_REPLACE by swapping old/new text', () => {
      const replaceOp = makeTextOp({
        type: OperationType.TEXT_REPLACE,
        position: 0,
        text: 'new',
        inverse: { position: 0, text: 'old', type: OperationType.TEXT_REPLACE },
      });

      const inverted = invertOperation(replaceOp) as TextOperation;

      expect(inverted.type).toBe(OperationType.TEXT_REPLACE);
      expect(inverted.text).toBe('old');
      expect(inverted.inverse.text).toBe('new');
    });

    it('should roundtrip invert(invert(op)) === op', () => {
      const original = makeTextOp({
        type: OperationType.TEXT_INSERT,
        position: 10,
        text: 'abc',
        inverse: { position: 10, text: 'abc', type: OperationType.TEXT_DELETE },
      });

      const inverted = invertOperation(original) as TextOperation;
      const doubleInverted = invertOperation(inverted) as TextOperation;

      expect(doubleInverted.type).toBe(OperationType.TEXT_INSERT);
      expect(doubleInverted.position).toBe(10);
      expect(doubleInverted.text).toBe('abc');
    });
  });

  describe('Card Operations', () => {
    it('should invert CARD_CREATE to CARD_DELETE', () => {
      const op = makeCardOp(OperationType.CARD_CREATE, {
        after: { title: 'New Card', color: 'chart-1' },
      });

      const inverted = invertOperation(op) as CardOperation;

      expect(inverted.type).toBe(OperationType.CARD_DELETE);
      expect(inverted.before).toEqual({ title: 'New Card', color: 'chart-1' });
    });

    it('should invert CARD_DELETE to CARD_CREATE', () => {
      const op = makeCardOp(OperationType.CARD_DELETE, {
        before: { title: 'Deleted Card', style: 'normal' },
      });

      const inverted = invertOperation(op) as CardOperation;

      expect(inverted.type).toBe(OperationType.CARD_CREATE);
      expect(inverted.after).toEqual({ title: 'Deleted Card', style: 'normal' });
    });

    it('should invert CARD_UPDATE by swapping before/after', () => {
      const op = makeCardOp(OperationType.CARD_UPDATE, {
        before: { color: 'default' },
        after: { color: 'chart-1' },
      });

      const inverted = invertOperation(op) as CardOperation;

      expect(inverted.type).toBe(OperationType.CARD_UPDATE);
      expect(inverted.before).toEqual({ color: 'chart-1' });
      expect(inverted.after).toEqual({ color: 'default' });
    });
  });

  describe('AI Operations', () => {
    it('should swap diff.before and diff.after', () => {
      const op: AiOperation = {
        id: 'ai-1',
        timestamp: 100,
        producer: 'ai' as const,
        description: '',
        type: OperationType.AI_REPLACE,
        prompt: '润色',
        tokensUsed: 100,
        diff: { before: '旧文本', after: '新文本', position: 0 },
      };

      const inverted = invertOperation(op) as AiOperation;

      expect(inverted.diff.before).toBe('新文本');
      expect(inverted.diff.after).toBe('旧文本');
    });
  });

  describe('Meta Operations (Idempotent)', () => {
    it('should return checkpoint operation as-is (with description prefix)', () => {
      const op: MetaOperation = {
        id: 'cp-1',
        timestamp: 100,
        producer: 'checkpoint' as const,
        description: '备份点',
        type: OperationType.CHECKPOINT,
        label: 'v1.0',
      };

      const inverted = invertOperation(op);
      expect(inverted.type).toBe(OperationType.CHECKPOINT);
    });
  });
});

describe('Serialization / Deserialization', () => {
  it('should serialize and deserialize TextOperation via JSON', () => {
    const original = makeTextOp({
      type: OperationType.TEXT_INSERT,
      position: 5,
      text: 'hello',
      inverse: { position: 5, text: 'hello', type: OperationType.TEXT_DELETE },
    });

    const json = JSON.stringify(original);
    const parsed = JSON.parse(json) as TextOperation;

    expect(parsed.type).toBe(OperationType.TEXT_INSERT);
    expect(parsed.position).toBe(5);
    expect(parsed.text).toBe('hello');
    expect(parsed.inverse.type).toBe(OperationType.TEXT_DELETE);
  });

  it('should serialize and deserialize CardOperation via JSON', () => {
    const original = makeCardOp(OperationType.CARD_CREATE, {
      cardId: 'card-x',
      before: {},
      after: { title: 'X' },
    });

    const json = JSON.stringify(original);
    const parsed = JSON.parse(json) as CardOperation;

    expect(parsed.cardId).toBe('card-x');
    expect(parsed.after).toEqual({ title: 'X' });
  });
});

// ──────────────────────────────────────────
// 前向兼容扩展点（Plan 04 / 06 / 07）
// ──────────────────────────────────────────

describe('Forward Compatibility', () => {
  it('[Plan 04] should support AiOperation structure for AI context building', () => {
    // Plan 04 需要 AiOperation 的 tokensUsed 和 diff 字段
    const aiOp = OperationBuilder.aiOperation({
      type: OperationType.AI_REPLACE,
      prompt: '优化这段文字使其更简洁',
      tokensUsed: 250,
      diff: {
        before: '这是一个很长的句子需要进行优化。',
        after: '优化后的短句。',
        position: 0,
      },
      producer: 'ai',
    });

    expect(aiOp.type).toBe(OperationType.AI_REPLACE);
    expect(aiOp.tokensUsed).toBe(250);
    expect(aiOp.diff.before).toContain('很长的句子');
    expect(aiOp.diff.after).toContain('短句');

    // 验证逆操作可用
    const inverted = invertOperation(aiOp) as AiOperation;
    expect(inverted.type).toBe(OperationType.AI_REPLACE);
    expect(inverted.diff.before).toContain('短句');
  });

  it('[Plan 06] should support Checkpoint meta-operation for manual save points', () => {
    // Plan 06 需要 CHECKPOINT 操作类型
    const checkpoint = OperationBuilder.checkpoint({
      label: '完成第一章编写',
      description: '手动暂存点：第一章',
    });

    expect(checkpoint.type).toBe(OperationType.CHECKPOINT);
    expect(checkpoint.label).toBe('完成第一章编写');
    expect(checkpoint.producer).toBe('checkpoint');

    // 验证幂等逆操作
    const inverted = invertOperation(checkpoint);
    expect(inverted.type).toBe(OperationType.CHECKPOINT);
  });

  it('[Plan 07] should support CardUpdate operation for card attribute changes', () => {
    // Plan 07 需要 CARD_UPDATE 操作和 before/after 状态记录
    const updateOp = OperationBuilder.cardUpdate({
      cardId: 'card-color-demo',
      before: { color: 'default', shape: 'rect' },
      after: { color: 'chart-1', shape: 'round' },
      sectionId: 'section-1',
      producer: 'card',
    });

    expect(updateOp.type).toBe(OperationType.CARD_UPDATE);
    expect(updateOp.cardId).toBe('card-color-demo');
    expect(updateOp.before).toEqual({ color: 'default', shape: 'rect' });
    expect(updateOp.after).toEqual({ color: 'chart-1', shape: 'round' });

    // 验证撤销时恢复原始状态
    const inverted = invertOperation(updateOp) as CardOperation;
    expect(inverted.before).toEqual({ color: 'chart-1', shape: 'round' });
    expect(inverted.after).toEqual({ color: 'default', shape: 'rect' });
  });
});