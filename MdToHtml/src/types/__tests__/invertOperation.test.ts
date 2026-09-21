/**
 * invertOperation — 逆操作计算（撤销/重做引擎的数学基础）
 *
 * 核心不变量：
 *   1. 逆操作的逆操作应回到原操作（文本类可精确往返）
 *   2. 逆操作必须把 before/after（或 diff）互换，且不改变操作身份（id）
 */
import {
  OperationType,
  invertOperation,
  type AnyOperation,
  type TextOperation,
  type CardOperation,
  type AiOperation,
  type MetaOperation,
} from '@/types/operation';
import { OperationBuilder } from '@/lib/OperationBuilder';

describe('invertOperation — 文本操作', () => {
  it('TEXT_INSERT 的逆是 TEXT_DELETE，且位置不变、文本互换', () => {
    const op = OperationBuilder.textInsert({ position: 5, text: 'hello' });
    const inv = invertOperation(op) as TextOperation;

    expect(inv.type).toBe(OperationType.TEXT_DELETE);
    expect(inv.position).toBe(5);
    expect(inv.text).toBe('hello');
    expect(inv.inverse).toEqual({ position: 5, text: 'hello', type: OperationType.TEXT_INSERT });
    expect(inv.id).toBe(op.id);
    expect(inv.description).toBe('撤销：插入文本');
  });

  it('TEXT_DELETE 的逆是 TEXT_INSERT', () => {
    const op = OperationBuilder.textDelete({ position: 3, text: 'bye' });
    const inv = invertOperation(op) as TextOperation;

    expect(inv.type).toBe(OperationType.TEXT_INSERT);
    expect(inv.text).toBe('bye');
    expect(inv.inverse.type).toBe(OperationType.TEXT_DELETE);
  });

  it('TEXT_REPLACE 的逆仍是 TEXT_REPLACE，但新旧文本互换', () => {
    const op = OperationBuilder.textReplace({ position: 0, oldText: 'old', newText: 'new' });
    const inv = invertOperation(op) as TextOperation;

    expect(inv.type).toBe(OperationType.TEXT_REPLACE);
    expect(inv.text).toBe('old');
    expect(inv.inverse.text).toBe('new');
  });

  it('不变量：文本操作连续两次取逆可回到原文本', () => {
    const op = OperationBuilder.textReplace({ position: 1, oldText: 'A', newText: 'B' });
    const roundTrip = invertOperation(invertOperation(op)) as TextOperation;

    expect(roundTrip.type).toBe(op.type);
    expect(roundTrip.text).toBe(op.text);
    expect(roundTrip.inverse.text).toBe(op.inverse.text);
  });
});

describe('invertOperation — 卡片操作', () => {
  it('CARD_CREATE 的逆是 CARD_DELETE，before/after 互换', () => {
    const op = OperationBuilder.cardCreate({ cardId: 'c1', cardData: { title: 'A' } });
    const inv = invertOperation(op) as CardOperation;

    expect(inv.type).toBe(OperationType.CARD_DELETE);
    expect(inv.cardId).toBe('c1');
    expect(inv.before).toEqual({ title: 'A' });
    expect(inv.after).toEqual({});
  });

  it('CARD_DELETE 的逆是 CARD_CREATE', () => {
    const op = OperationBuilder.cardDelete({ cardId: 'c2', beforeState: { title: 'B' } });
    const inv = invertOperation(op) as CardOperation;

    expect(inv.type).toBe(OperationType.CARD_CREATE);
    expect(inv.after).toEqual({ title: 'B' });
  });

  it('CARD_UPDATE 保持类型不变，仅互换 before/after', () => {
    const op = OperationBuilder.cardUpdate({
      cardId: 'c3',
      before: { style: 'normal' },
      after: { style: 'highlight' },
    });
    const inv = invertOperation(op) as CardOperation;

    expect(inv.type).toBe(OperationType.CARD_UPDATE);
    expect(inv.before).toEqual({ style: 'highlight' });
    expect(inv.after).toEqual({ style: 'normal' });
    expect(inv.description).toBe('撤销：更新卡片');
  });

  it('CARD_MOVE 保持类型不变并提示「移动卡片」', () => {
    const op: CardOperation = {
      id: 'move-1',
      timestamp: 1,
      producer: 'drag',
      description: '',
      type: OperationType.CARD_MOVE,
      cardId: 'c4',
      before: { order: 1 },
      after: { order: 3 },
    };
    const inv = invertOperation(op) as CardOperation;

    expect(inv.type).toBe(OperationType.CARD_MOVE);
    expect(inv.before).toEqual({ order: 3 });
    expect(inv.after).toEqual({ order: 1 });
    expect(inv.description).toBe('撤销：移动卡片');
  });
});

describe('invertOperation — AI 操作', () => {
  it.each([
    OperationType.AI_GENERATE,
    OperationType.AI_REPLACE,
    OperationType.AI_REWRITE,
  ])('%s 的逆互换 diff.before / diff.after', (type) => {
    const op = OperationBuilder.aiOperation({
      type: type as OperationType.AI_GENERATE,
      prompt: '润色这段',
      tokensUsed: 128,
      diff: { before: '原文', after: '改写后', position: 7 },
    });
    const inv = invertOperation(op) as AiOperation;

    expect(inv.type).toBe(type);
    expect(inv.diff).toEqual({ before: '改写后', after: '原文', position: 7 });
    expect(inv.prompt).toBe('润色这段');
    expect(inv.tokensUsed).toBe(128);
    expect(inv.description).toBe('撤销：AI 操作');
  });
});

describe('invertOperation — 元操作（幂等）', () => {
  it('BATCH / CHECKPOINT / MARKER 的逆操作类型不变', () => {
    const children = [OperationBuilder.textInsert({ position: 0, text: 'a' })];
    const batch = OperationBuilder.batch({ children });
    const checkpoint = OperationBuilder.checkpoint({ label: '起点' });
    const marker = OperationBuilder.marker({ purpose: 'context_boundary' });

    expect(invertOperation(batch).type).toBe(OperationType.BATCH);
    expect(invertOperation(checkpoint).type).toBe(OperationType.CHECKPOINT);
    expect(invertOperation(marker).type).toBe(OperationType.MARKER);
  });

  it('元操作取逆后 id 与描述前缀保持可追溯', () => {
    const checkpoint = OperationBuilder.checkpoint({ label: 'v1' }) as MetaOperation;
    const inv = invertOperation(checkpoint);

    expect(inv.id).toBe(checkpoint.id);
    expect(inv.description).toBe(`撤销：${checkpoint.description}`);
  });
});

describe('invertOperation — 异常路径', () => {
  it('未知操作类型抛出明确错误', () => {
    const bogus = { type: 'NOT_A_TYPE', id: 'x' } as unknown as AnyOperation;
    expect(() => invertOperation(bogus)).toThrow(/Unknown operation type/);
  });
});
