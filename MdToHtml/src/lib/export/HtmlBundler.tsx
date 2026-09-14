import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CHDRenderer } from '@/components/CHD/CHDRenderer';
import { CssExtractor } from './CssExtractor';
import { getCleanCSS } from './getCleanCSS';
import { HTML_TEMPLATE } from './template';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeId, DEFAULT_THEME } from '@/lib/themes';

export class HtmlBundler {
  /**
   * 将 Markdown 内容打包为独立的、自包含的 HTML 文件。
   * 
   * 项目定位：浏览器是运行时环境，因此我们利用浏览器能力来可靠工作。
   * CSS 抽取通过隐藏 iframe 在干净上下文中完成，避免主题切换导致样式残留。
   * 
   * @param markdown - 要渲染的 Markdown 内容
   * @param title - 文档标题
   * @param theme - 主题 ID
   * @returns 包含完整 HTML 的 Blob 对象
   */
  static async bundle(markdown: string, title: string, theme: ThemeId = DEFAULT_THEME): Promise<Blob> {
    // 1. 渲染 HTML 组件为静态标记
    const htmlContent = renderToStaticMarkup(
      <ThemeProvider defaultTheme={theme}>
        <div className="chd-renderer-root">
            <CHDRenderer 
                markdown={markdown} 
                editMode={false} 
                onCardClick={() => {}}
                onCardUpdate={() => {}}
                onBatchCardUpdate={() => {}}
                onContentUpdate={() => {}}
                onTitleUpdate={() => {}}
                onCardMove={() => {}}
                onCardDelete={() => {}}
                onCardAdd={() => {}}
            />
        </div>
      </ThemeProvider>
    );

    // 2. 从干净上下文抽取 CSS（隔离主题残留）
    let css: string;
    try {
      css = await getCleanCSS(theme);
    } catch (e) {
      console.warn('[HtmlBundler] Clean CSS extraction failed, falling back to current context:', e);
      css = CssExtractor.extract();
    }

    // 3. 构建主题脚本（简洁，一次设置）
    const themeScript = `
        document.documentElement.setAttribute('data-theme', '${escapeTemplate(theme)}');
    `;

    // 4. 安全注入模板（所有用户输入都经过转义）
    const fullHtml = HTML_TEMPLATE
      .replace('{{TITLE}}', escapeTemplate(title || 'Untitled Document'))
      .replace('{{THEME}}', escapeTemplate(theme))
      .replace('{{CONTENT}}', htmlContent)
      .replace('{{CSS}}', css)
      .replace('{{THEME_SCRIPT}}', themeScript)
      .replace('{{SCRIPT}}', '');

    return new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  }
}

/**
 * 模板字符串安全转义
 * 
 * 防止用户输入内容（标题、主题名等）中的特殊字符破坏 HTML 模板结构。
 * 处理以下场景：
 *   - 标题含 ${var} → JavaScript 模板字符串注入
 *   - 标题含 & < > " ' → HTML 实体注入
 *   - 标题含 \ → 字符串转义破坏
 * 
 * @param text - 要转义的文本
 * @returns 转义后安全的文本
 */
function escapeTemplate(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\$/g, '&#36;')
    .replace(/\\/g, '&#92;');
}
