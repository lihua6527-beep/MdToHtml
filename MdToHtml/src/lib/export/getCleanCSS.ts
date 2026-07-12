/**
 * 干净上下文 CSS 抽取模块
 * 
 * 在隐藏 iframe 中创建一个干净的页面上下文，从中抽取完整的 CSS，
 * 避免当前页面中因主题切换、动态样式注入等导致的样式残留。
 * 
 * 设计定位：
 *   - 浏览器是我们的运行时环境，我们不试图消除这一依赖
 *   - 我们充分利用浏览器的能力来可靠工作
 *   - iframe 隔离确保抽取的 CSS 与文档内容完全匹配
 * 
 * @module getCleanCSS
 */

import { ThemeId, DEFAULT_THEME } from '@/lib/themes';

/**
 * CHD 渲染引擎使用到的所有 Tailwind 工具类集合
 * 
 * 用于在 iframe 采样元素中声明，确保 Tailwind 的构建时扫描覆盖所有需要用到的类。
 * 注意：Tailwind 是构建时生成 CSS 的，理论上构建时已扫描了所有源文件。
 * 这里的采样元素是一个安全网，确保如果某些类因动态拼接（如 \`bg-\${color}\`）
 * 而未在源文件中直接出现时，仍能被正确包含。
 * 
 * 维护说明：当新增卡片样式、布局类型或配色方案时，请同步更新此数组。
 */
const REQUIRED_CLASSES = [
  // === 卡片样式（来自 Card.tsx shapeVariants） ===
  'bg-white',
  'shadow-sm',
  'shadow-md',
  'shadow-inner',
  'border',
  'border-2',
  'border-border-soft',
  'border-slate-200',
  'hover:border-slate-300',
  'hover:shadow-md',
  'text-text-primary',
  'text-text-secondary',
  'italic',
  'pl-4',
  'font-mono',
  'text-sm',
  'bg-slate-50/50',
  'bg-slate-100/50',
  'border-l-[6px]',
  'border-l-slate-300',

  // === 卡片配色（chart colors） ===
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
  'border-none',
  'text-white',

  // === 字体大小（text-xs ~ text-5xl） ===
  'text-xs',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'text-3xl',
  'text-4xl',
  'text-5xl',

  // === 对齐方式 ===
  'text-left',
  'text-center',
  'text-right',

  // === 卡片布局 ===
  'h-full',
  'col-span-1',
  'col-span-2',
  'col-span-3',
  'col-span-4',
  'col-span-6',
  'col-span-12',

  // === 网格布局 ===
  'grid',
  'grid-cols-1',
  'grid-cols-2',
  'grid-cols-3',
  'grid-cols-4',

  // === Section 容器 ===
  'mb-8',
  'mt-8',
  'w-full',
  'gap-4',
  'gap-6',
  'gap-8',

  // === 卡片颜色（从 CARD_COLORS） ===
  'bg-bg-card',
  'border-border-soft',

  // === 通用排版 ===
  'tracking-tight',
  'font-bold',
  'font-medium',
  'text-xl',
  'text-2xl',
  'text-3xl',
  'text-4xl',

  // === 卡片形状（来自 shapes.ts） ===
  'rounded-lg',
  'aspect-square',
  'rounded-2xl',

  // === 文档根容器 ===
  'chd-renderer-root',
  'section-container',

  // === 引用卡片 ===
  'pl-14',
  'py-2',
] as const;

/**
 * 在干净的 iframe 上下文中抽取当前主题的完整 CSS
 * 
 * 核心思路：
 *   1. 创建一个隐藏的 iframe
 *   2. 写入一个干净的 HTML 骨架，设置正确的 data-theme 属性
 *   3. 从当前页面复制所有 <style> 标签到 iframe 中
 *   4. 加入采样元素以确保所有 CHD 渲染类都被包含
 *   5. 等待样式加载完毕后从 iframe 抽取 CSS
 *   6. 销毁 iframe 清理资源
 * 
 * @param theme - 要抽取 CSS 的主题 ID
 * @returns 完整的 CSS 文本字符串
 * 
 * @example
 * ```typescript
 * const css = await getCleanCSS('ocean');
 * ```
 */
export async function getCleanCSS(theme: ThemeId = DEFAULT_THEME): Promise<string> {
  // 1. 创建隐藏 iframe
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.title = 'CSS Extraction Context';
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) {
      throw new Error('Failed to access iframe contentDocument');
    }

    // 2. 写入干净的 HTML 骨架
    // 关键点：设置正确的 data-theme 属性，确保 CSS 变量使用正确的主题值
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html data-theme="${escapeAttr(theme)}">
        <head>
          <!-- 从当前页面复制所有 <style> 和 <link rel="stylesheet"> 标签 -->
          ${collectStyles()}
        </head>
        <body>
          <!-- 
            采样元素：确保所有 CHD 渲染用到的 Tailwind 类都被构建工具包含。
            Tailwind 的 JIT 引擎在构建时扫描源文件中的类名来生成 CSS。
            这里列出所有动态生成的类（如 bg-chart-1, col-span-3 等），
            确保即使它们在源文件中是动态拼接的，也能被正确包含在构建产物中。
          -->
          <div class="${REQUIRED_CLASSES.join(' ')}"></div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // 3. 等待样式加载完成
    await waitForStylesLoaded(iframeDoc);

    // 4. 从 iframe 抽取 CSS（干净、无残留）
    const css = extractCSSFromDocument(iframeDoc);

    return css;

  } finally {
    // 5. 清理：销毁 iframe，不留痕迹
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }
  }
}

/**
 * 从当前页面的 <head> 中收集所有 <style> 和 <link> 样式标签的 HTML
 * 
 * @returns 拼接后的样式标签 HTML 字符串
 */
function collectStyles(): string {
  const styleTags = Array.from(document.head.querySelectorAll<HTMLLinkElement | HTMLStyleElement>(
    'style, link[rel="stylesheet"]'
  ));
  
  return styleTags
    .map(el => {
      // 跳过跨域或特定场景的样式表（如 inline critical CSS）
      if (el.tagName === 'LINK' && !(el as HTMLLinkElement).href) return '';
      return el.outerHTML;
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * 等待 iframe 中的样式表加载完成
 * 
 * 通过轮询检查 iframe 中所有 styleSheets 是否可访问来判断加载状态。
 * 超时时间 5 秒，超时后强制返回（降级到部分 CSS）。
 * 
 * @param doc - iframe 的 document 对象
 */
function waitForStylesLoaded(doc: Document, timeout = 5000): Promise<void> {
  return new Promise<void>((resolve) => {
    const startTime = Date.now();

    function check() {
      const sheets = Array.from(doc.styleSheets);

      // 检查是否所有样式表都已加载完成（cssRules 可访问）
      const allLoaded = sheets.every(sheet => {
        try {
          // 访问 cssRules 会触发跨域检查，能访问说明已加载
          return sheet.cssRules !== null && sheet.cssRules.length > 0;
        } catch {
          // 跨域 sheet 会抛出 SecurityError，跳过
          return true;
        }
      });

      if (allLoaded) {
        resolve();
        return;
      }

      // 超时检查
      if (Date.now() - startTime >= timeout) {
        console.warn('[getCleanCSS] Stylesheet loading timeout, proceeding with partially loaded styles');
        resolve();
        return;
      }

      // 继续轮询
      setTimeout(check, 50);
    }

    // 第一次检查等待 100ms 确保 iframe 开始渲染
    setTimeout(check, 100);
  });
}

/**
 * 从 Document 对象中抽取所有样式表规则
 * 
 * @param doc - 要抽取的 Document 对象
 * @returns 拼接后的完整 CSS 文本
 */
function extractCSSFromDocument(doc: Document): string {
  const sheets = Array.from(doc.styleSheets);
  const rules: string[] = [];

  sheets.forEach(sheet => {
    try {
      const cssRules = Array.from(sheet.cssRules || []);
      cssRules.forEach(rule => {
        rules.push(rule.cssText);
      });
    } catch (e) {
      // 跨域样式表抛出 SecurityError，这是预期的
      // 在本地开发模式下，所有样式表都是同域的，不应该出现此问题
      console.warn('[getCleanCSS] Skipping blocked stylesheet (CORS or loading error):', 
        (sheet as any).href || 'inline/style');
    }
  });

  return rules.join('\n');
}

/**
 * HTML 属性值转义
 * 
 * 防止通过主题名称或类名进行属性注入。
 * 只允许安全的字符出现在 HTML 属性值中。
 * 
 * @param value - 要转义的字符串
 * @returns 转义后的安全字符串
 */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;')
    .replace(/</g, '<')
    .replace(/>/g, '>');
}