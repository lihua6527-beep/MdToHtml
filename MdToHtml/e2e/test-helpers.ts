import { Page } from '@playwright/test';

/**
 * 在编辑器中输入多行文本，模拟真实用户行为
 */
export async function typeInEditor(page: Page, lines: string[], delay = 10) {
  const editor = page.locator('.cm-content');
  await editor.click();
  await editor.fill('');

  for (const line of lines) {
    await editor.press('Enter');
    await editor.type(line, { delay });
  }

  // 等待防抖和解析更新
  await page.waitForTimeout(500);
}

/**
 * 等待自动保存完成（默认间隔 3s）
 */
export async function waitForAutoSave(page: Page, timeout = 4000) {
  // 等待保存状态提示
  await page.waitForSelector('text=已保存', { timeout });
}

/**
 * 获取编辑器内容（通过 page.evaluate 直接读取 CodeMirror state）
 */
export async function getEditorContent(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const cm = (window as any).__CODE_MIRROR_VIEW;
    return cm?.state?.doc?.toString() || '';
  });
}

/**
 * 检查应用是否处于错误状态
 */
export async function hasAppError(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return !!document.querySelector('.error-boundary-fallback, [data-error-boundary]');
  });
}

// 测试用 CHD 文档
export const SAMPLE_CHD_DOC = [
  '## 第一章：系统概述',
  '',
  '### 卡片 1：核心概念',
  '',
  '这是第一张卡片内容，包含**粗体**和*斜体*。',
  '',
  '### 卡片 2：技术特性',
  '',
  '- 特性一：支持 CHD 协议',
  '- 特性二：卡片式渲染',
  '',
  '> 这是一个引用卡片',
  '',
  '### 卡片 3：代码示例',
  '',
  '```typescript',
  'const app = "MdToHtml";',
  'console.log(app);',
  '```',
];