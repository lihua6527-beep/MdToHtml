import { TextEncoder, TextDecoder } from 'util';

// Polyfill Environment
global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;

// Mock CHDRenderer to avoid ESM issues with react-markdown
jest.mock('@/components/CHD/CHDRenderer', () => ({
  CHDRenderer: ({ markdown }: { markdown: string }) => <div className="mock-renderer">{markdown}</div>
}));

// Mock ThemeProvider
jest.mock('@/components/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: any }) => <div className="mock-theme-provider">{children}</div>
}));

// Mock getCleanCSS：真实实现依赖隐藏 iframe 抽取样式表。
// 在此隔离它，以便分别验证「主路径（getCleanCSS 成功）」与「降级路径（失败回退 CssExtractor）」
jest.mock('@/lib/export/getCleanCSS', () => ({
  getCleanCSS: jest.fn(),
}));

import { getCleanCSS } from '@/lib/export/getCleanCSS';
import { CssExtractor } from '@/lib/export/CssExtractor';
import { DEFAULT_THEME } from '@/lib/themes';

describe('HtmlBundler', () => {
  const mockedGetCleanCSS = getCleanCSS as jest.MockedFunction<typeof getCleanCSS>;
  let HtmlBundler: typeof import('./HtmlBundler').HtmlBundler;

  beforeAll(async () => {
    // Dynamic import to ensure polyfills are applied
    const mod = await import('./HtmlBundler');
    HtmlBundler = mod.HtmlBundler;
  });

  beforeEach(() => {
    mockedGetCleanCSS.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** 读取 Blob 的文本内容（Node / JSDOM 兼容） */
  async function readBlob(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(blob);
    });
  }

  it('bundles markdown to HTML blob correctly（CSS 走 getCleanCSS 主路径）', async () => {
    mockedGetCleanCSS.mockResolvedValue('.test-class { color: red; }');

    const markdown = '# Hello World\n\nThis is a test.';
    const title = 'Test Document';

    const blob = await HtmlBundler.bundle(markdown, title);

    expect(blob).toBeInstanceOf(Blob);

    const text = await readBlob(blob);

    // Template Structure
    expect(text).toContain('<!DOCTYPE html>');
    expect(text).toContain(`<title>${title}</title>`);

    // CSS Injection：来自 getCleanCSS（而非 document.styleSheets）
    expect(text).toContain('.test-class { color: red; }');
    expect(mockedGetCleanCSS).toHaveBeenCalledWith(DEFAULT_THEME);

    // Content Rendering (Mocked)
    expect(text).toContain('mock-renderer');
    expect(text).toContain(markdown); // The mock renders raw markdown
  });

  it('falls back to CssExtractor.extract when clean CSS extraction fails', async () => {
    mockedGetCleanCSS.mockRejectedValue(new Error('iframe unavailable'));
    const extractSpy = jest
      .spyOn(CssExtractor, 'extract')
      .mockReturnValue('.fallback-class { color: blue; }');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const text = await readBlob(await HtmlBundler.bundle('# doc', 'Fallback Doc'));

    expect(extractSpy).toHaveBeenCalledTimes(1);
    expect(text).toContain('.fallback-class { color: blue; }');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('injects the selected theme and HTML-escapes the title', async () => {
    mockedGetCleanCSS.mockResolvedValue('/* noop */');

    const text = await readBlob(
      await HtmlBundler.bundle('# doc', 'A & B <script>alert(1)</script>', 'mint')
    );

    // 主题写入 documentElement，且透传给 CSS 抽取
    expect(text).toContain("setAttribute('data-theme', 'mint')");
    expect(mockedGetCleanCSS).toHaveBeenCalledWith('mint');

    // 标题中的标签必须被转义，不允许原样注入（含 &）
    expect(text).not.toContain('<script>alert(1)</script>');
    expect(text).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(text).toContain('&amp;');
  });
});
