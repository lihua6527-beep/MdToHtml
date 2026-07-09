/**
 * env-hot-loader.test.ts — ApiKeyManager 单元测试
 *
 * 覆盖场景：
 * - 未修改时返回 process.env 的值
 * - 修改后返回覆盖值
 * - 重置后恢复 process.env 的值
 * - 多次修改值正确覆盖
 */
import { ApiKeyManager } from '../env-hot-loader';

describe('ApiKeyManager — 惰性覆盖模式', () => {
  const ORIGINAL_KEY = 'sk-test-original-key';

  beforeAll(() => {
    // 模拟 process.env 有初始值
    process.env.DEEPSEEK_API_KEY = ORIGINAL_KEY;
  });

  beforeEach(() => {
    // 每个测试前重置状态
    ApiKeyManager.reset();
  });

  afterAll(() => {
    delete process.env.DEEPSEEK_API_KEY;
  });

  test('未修改时返回 process.env 的值', () => {
    expect(ApiKeyManager.modified).toBe(false);
    expect(ApiKeyManager.get()).toBe(ORIGINAL_KEY);
  });

  test('修改后返回覆盖值', async () => {
    const newKey = 'sk-new-key';
    await ApiKeyManager.set(newKey);

    expect(ApiKeyManager.modified).toBe(true);
    expect(ApiKeyManager.get()).toBe(newKey);
    // process.env 保持不变
    expect(process.env.DEEPSEEK_API_KEY).toBe(ORIGINAL_KEY);
  });

  test('重置后恢复 process.env 的值', async () => {
    await ApiKeyManager.set('sk-temp-key');
    expect(ApiKeyManager.modified).toBe(true);

    ApiKeyManager.reset();
    expect(ApiKeyManager.modified).toBe(false);
    expect(ApiKeyManager.get()).toBe(ORIGINAL_KEY);
  });

  test('多次修改值正确覆盖', async () => {
    await ApiKeyManager.set('sk-first');
    expect(ApiKeyManager.get()).toBe('sk-first');

    await ApiKeyManager.set('sk-second');
    expect(ApiKeyManager.get()).toBe('sk-second');

    await ApiKeyManager.set('sk-third');
    expect(ApiKeyManager.get()).toBe('sk-third');
  });

  test('process.env 未设置时返回 null', () => {
    delete process.env.DEEPSEEK_API_KEY;
    ApiKeyManager.reset();

    expect(ApiKeyManager.get()).toBeNull();

    // 恢复
    process.env.DEEPSEEK_API_KEY = ORIGINAL_KEY;
  });
});