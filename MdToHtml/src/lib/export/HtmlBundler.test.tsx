
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

describe('HtmlBundler', () => {
  let HtmlBundler: any;

  beforeAll(async () => {
    // Mock document.styleSheets
    Object.defineProperty(document, 'styleSheets', {
      value: [{
        cssRules: [{ cssText: '.test-class { color: red; }' }]
      }],
      writable: true,
      configurable: true
    });

    // Dynamic import to ensure polyfills are applied
    const mod = await import('./HtmlBundler');
    HtmlBundler = mod.HtmlBundler;
  });

  it('bundles markdown to HTML blob correctly', async () => {
    const markdown = '# Hello World\n\nThis is a test.';
    const title = 'Test Document';
    
    const blob = await HtmlBundler.bundle(markdown, title);
    
    expect(blob).toBeInstanceOf(Blob);
    
    // Read blob using FileReader (Node/JSDOM compatible)
    const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(blob);
    });
    
    // Check Template Structure
    expect(text).toContain('<!DOCTYPE html>');
    expect(text).toContain(`<title>${title}</title>`);
    
    // Check CSS Injection
    expect(text).toContain('.test-class { color: red; }');
    
    // Check Content Rendering (Mocked)
    expect(text).toContain('mock-renderer');
    expect(text).toContain(markdown); // The mock renders raw markdown
  });
});
