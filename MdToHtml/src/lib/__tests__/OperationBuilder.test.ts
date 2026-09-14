/**
 * OperationBuilder — 操作工厂
 *
 * 验证各工厂方法的：类型正确、逆操作自动计算、描述默认值、生产者标识。
 */
import { OperationBuilder } from '@/lib/OperationBuilder';
import { OperationType } from '@/types/operation';

describe('OperationBuilder — 文本操作', () => {
  it('textInsert 自动生成 id/时间戳，并给出逆操作与默认描述', () => {
    const before = Date.now();
    const op = OperationBuilder.textInsert({ position: 2, text: 'abcdefghijklmnopqrstuvwxyz' });

    expect(op.type).toBe(OperationType.TEXT_INSERT);
    expect(op.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(op.timestamp).toBeGreaterThanOrEqual(before);
    expect(op.producer).toBe('codemirror');
    expect(op.inverse).toEqual({ position: 2, text: op.text, type: OperationType.TEXT_DELETE });
    // 描述中文本被截断到 20 字符
    expect(op.description).toBe(`插入「${op.text.slice(0, 20)}」`);
    expect(op.description).not.toContain('z');
  });

  it('textDelete 的默认描述以「删除」开头', () => {
    const op = OperationBuilder.textDelete({ position: 0, text: 'x' });
    expect(op.description).toBe('删除「x」');
    expect(op.inverse.type).toBe(OperationType.TEXT_INSERT);
  });

  it('textReplace 保存新文本并记录旧文本为逆操作', () => {
    const op = OperationBuilder.textReplace({ position: 1, oldText: 'a', newText: 'b' });
    expect(op.text).toBe('b');
    expect(op.inverse).toEqual({ position: 1, text: 'a', type: OperationType.TEXT_REPLACE });
    expect(op.description).toBe('替换文本');
  });

  it('显式 description 与 producer 会覆盖默认值', () => {
    const op = OperationBuilder.textInsert({
      position: 0,
      text: 'x',
      description: '自定义',
      producer: 'ai',
    });
    expect(op.description).toBe('自定义');
    expect(op.producer).toBe('ai');
  });
});

describe('OperationBuilder — 卡片操作', () => {
  it('cardCreate 把 cardData 放进 after，before 为空', () => {
    const op = OperationBuilder.cardCreate({ cardId: 'c1', cardData: { title: 'T' }, sectionId: 's1' });
    expect(op.type).toBe(OperationType.CARD_CREATE);
    expect(op.after).toEqual({ title: 'T' });
    expect(op.before).toEqual({});
    expect(op.sectionId).toBe('s1');
    expect(op.description).toBe('创建卡片「c1」');
  });

  it('cardDelete 把 beforeState 放进 before，after 为空', () => {
    const op = OperationBuilder.cardDelete({ cardId: 'c2', beforeState: { title: 'T' } });
    expect(op.type).toBe(OperationType.CARD_DELETE);
    expect(op.before).toEqual({ title: 'T' });
    expect(op.after).toEqual({});
  });

  it('cardUpdate 原样保留 before / after', () => {
    const op = OperationBuilder.cardUpdate({ cardId: 'c3', before: { a: 1 }, after: { a: 2 } });
    expect(op.type).toBe(OperationType.CARD_UPDATE);
    expect(op.before).toEqual({ a: 1 });
    expect(op.after).toEqual({ a: 2 });
    expect(op.description).toBe('更新卡片属性');
  });
});

describe('OperationBuilder — AI 与元操作', () => {
  it('aiOperation 保留 prompt / tokensUsed / diff，描述按 prompt 截断', () => {
    const prompt = '这是一个超过三十个字符的提示词用于验证截断行为是否正确';
    const op = OperationBuilder.aiOperation({
      type: OperationType.AI_REWRITE,
      prompt,
      tokensUsed: 42,
      diff: { before: 'a', after: 'b', position: 0 },
    });

    expect(op.type).toBe(OperationType.AI_REWRITE);
    expect(op.tokensUsed).toBe(42);
    expect(op.description).toBe(`AI：${prompt.slice(0, 30)}`);
  });

  it('batch 描述包含子操作数量', () => {
    const children = [
      OperationBuilder.textInsert({ position: 0, text: 'a' }),
      OperationBuilder.textInsert({ position: 1, text: 'b' }),
    ];
    const op = OperationBuilder.batch({ children });
    expect(op.type).toBe(OperationType.BATCH);
    expect(op.children).toHaveLength(2);
    expect(op.description).toBe('批量操作（2 项）');
  });

  it('checkpoint 使用 checkpoint 生产者', () => {
    const op = OperationBuilder.checkpoint({ label: '里程碑' });
    expect(op.type).toBe(OperationType.CHECKPOINT);
    expect(op.label).toBe('里程碑');
    expect(op.producer).toBe('checkpoint');
    expect(op.description).toBe('暂存点：里程碑');
  });

  it('marker 使用 marker 生产者并记录用途', () => {
    const op = OperationBuilder.marker({ purpose: 'validation_point' });
    expect(op.type).toBe(OperationType.MARKER);
    expect(op.markerPurpose).toBe('validation_point');
    expect(op.producer).toBe('marker');
  });

  it('连续创建的操作 id 互不相同', () => {
    const ids = new Set(
      Array.from({ length: 50 }, () => OperationBuilder.textInsert({ position: 0, text: 'x' }).id)
    );
    expect(ids.size).toBe(50);
  });
});
