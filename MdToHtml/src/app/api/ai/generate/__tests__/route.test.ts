/**
 * @jest-environment node
 *
 * POST /api/ai/generate 路由
 *
 * 重点验证「API Key 不出前端」这条对外主张：
 *   - Key 只出现在服务端发往 DeepSeek 的 Authorization 头中
 *   - 任何响应体（成功/失败）都不得回显 Key
 */
import { POST } from '../route';
import { ApiKeyManager } from '@/lib/env-hot-loader';
import type { NextRequest } from 'next/server';

jest.mock('@/lib/env-hot-loader', () => ({
  ApiKeyManager: { get: jest.fn() },
}));

const mockedGetKey = ApiKeyManager.get as jest.MockedFunction<typeof ApiKeyManager.get>;
const TEST_KEY = 'sk-test-secret-key-do-not-leak';

/** 路由只用到 request.json()，构造最小可用的请求对象即可 */
function makeRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

/** 构造上游 fetch 的响应 */
function upstreamResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const originalFetch = global.fetch;

describe('/api/ai/generate', () => {
  beforeEach(() => {
    mockedGetKey.mockReset();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('缺少 text 参数时返回 400，且不调用上游', async () => {
    const res = await POST(makeRequest({ model: 'deepseek-chat' }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('text');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('text 类型不为字符串时返回 400', async () => {
    const res = await POST(makeRequest({ text: 123 }));
    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('未配置 API Key 时返回 500，且响应体中不含任何 Key 痕迹', async () => {
    mockedGetKey.mockReturnValue(null as unknown as string);

    const res = await POST(makeRequest({ text: 'hello' }));
    const body = JSON.stringify(await res.json());

    expect(res.status).toBe(500);
    expect(body).toContain('DEEPSEEK_API_KEY 未配置');
    expect(body).not.toContain(TEST_KEY);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('成功路径：Key 仅出现在上游 Authorization 头，响应体不回显', async () => {
    mockedGetKey.mockReturnValue(TEST_KEY);
    (global.fetch as jest.Mock).mockResolvedValue(
      upstreamResponse(200, {
        choices: [{ message: { content: '## 生成结果' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      })
    );

    const res = await POST(makeRequest({ text: '请生成', systemPrompt: '你是助手' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.markdown).toBe('## 生成结果');
    expect(data.usage).toEqual({ promptTokens: 10, completionTokens: 20, totalTokens: 30 });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe(`Bearer ${TEST_KEY}`);

    expect(JSON.stringify(data)).not.toContain(TEST_KEY);
    expect(data).not.toHaveProperty('apiKey');
    expect(data).not.toHaveProperty('key');
  });

  it('非法 model 回退到 deepseek-chat', async () => {
    mockedGetKey.mockReturnValue(TEST_KEY);
    (global.fetch as jest.Mock).mockResolvedValue(
      upstreamResponse(200, { choices: [{ message: { content: 'ok' } }] })
    );

    await POST(makeRequest({ text: 'x', model: 'gpt-5' }));

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body).model).toBe('deepseek-chat');
  });

  it('合法 model 原样透传，并带上超时控制信号', async () => {
    mockedGetKey.mockReturnValue(TEST_KEY);
    (global.fetch as jest.Mock).mockResolvedValue(
      upstreamResponse(200, { choices: [{ message: { content: 'ok' } }] })
    );

    await POST(makeRequest({ text: 'x', model: 'deepseek-reasoner' }));

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const sent = JSON.parse(init.body);
    expect(sent.model).toBe('deepseek-reasoner');
    expect(sent.stream).toBe(false);
    expect(sent.messages[1]).toEqual({ role: 'user', content: 'x' });
    expect(init.signal).toBeDefined();
  });

  it('未提供 systemPrompt 时使用空字符串', async () => {
    mockedGetKey.mockReturnValue(TEST_KEY);
    (global.fetch as jest.Mock).mockResolvedValue(
      upstreamResponse(200, { choices: [{ message: { content: 'ok' } }] })
    );

    await POST(makeRequest({ text: 'x' }));

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body).messages[0]).toEqual({ role: 'system', content: '' });
  });

  it('上游 401 转成可读提示，且不回显 Key', async () => {
    mockedGetKey.mockReturnValue(TEST_KEY);
    (global.fetch as jest.Mock).mockResolvedValue(
      upstreamResponse(401, { error: { message: `invalid key ${TEST_KEY}` } })
    );

    const res = await POST(makeRequest({ text: 'x' }));
    const body = JSON.stringify(await res.json());

    expect(res.status).toBe(401);
    expect(body).toContain('API Key 无效');
    expect(body).not.toContain(TEST_KEY);
  });

  it('上游 429 转成限流提示', async () => {
    mockedGetKey.mockReturnValue(TEST_KEY);
    (global.fetch as jest.Mock).mockResolvedValue(upstreamResponse(429, {}));

    const res = await POST(makeRequest({ text: 'x' }));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toContain('频率超限');
  });

  it('其它上游错误透传状态码与错误信息', async () => {
    mockedGetKey.mockReturnValue(TEST_KEY);
    (global.fetch as jest.Mock).mockResolvedValue(
      upstreamResponse(503, { error: { message: 'service unavailable' } })
    );

    const res = await POST(makeRequest({ text: 'x' }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('service unavailable');
  });

  it('上游返回空内容时给出明确错误', async () => {
    mockedGetKey.mockReturnValue(TEST_KEY);
    (global.fetch as jest.Mock).mockResolvedValue(upstreamResponse(200, { choices: [] }));

    const res = await POST(makeRequest({ text: 'x' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('AI 返回内容为空');
  });

  it('请求被中止时返回 504 超时提示', async () => {
    mockedGetKey.mockReturnValue(TEST_KEY);
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    (global.fetch as jest.Mock).mockRejectedValue(abortError);

    const res = await POST(makeRequest({ text: 'x' }));
    expect(res.status).toBe(504);
    expect((await res.json()).error).toContain('超时');
  });

  it('未知异常返回 500 并携带错误信息', async () => {
    mockedGetKey.mockReturnValue(TEST_KEY);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    const res = await POST(makeRequest({ text: 'x' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('network down');
  });
});
