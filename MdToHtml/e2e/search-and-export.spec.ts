import { test, expect } from '@playwright/test';
import fs from 'fs';
import { seedDoc, removeDoc, ensureDocListed, openDoc, docItem } from './test-helpers';

const SEARCH_SLUG = 'e2e-search-marker';
const EXPORT_SLUG = 'e2e-export-doc';

test.describe('搜索与导出', () => {
  test.beforeAll(() => {
    seedDoc(SEARCH_SLUG);
    seedDoc(EXPORT_SLUG);
  });

  test.afterAll(() => {
    removeDoc(SEARCH_SLUG);
    removeDoc(EXPORT_SLUG);
  });

  test('全文搜索：输入关键词 → 命中结果', async ({ page }) => {
    await page.goto('/');
    // 搜索面板基于服务端传入的 initialPosts 建索引，先确保列表已包含该文档
    await ensureDocListed(page, SEARCH_SLUG);
    await expect(docItem(page, SEARCH_SLUG)).toBeVisible();

    // 左侧列表头部工具栏的搜索入口
    await page.locator('button[title="搜索文档"]').click();

    const input = page.locator('input[placeholder*="搜索文档"]');
    await expect(input).toBeVisible();
    await expect(page.getByText('输入关键词搜索文档')).toBeVisible();

    await input.fill(SEARCH_SLUG);

    // 结果统计行只有在有关键词时才渲染
    const stats = page.locator('text=/找到\\s*\\d+\\s*个结果/');
    await expect(stats).toBeVisible({ timeout: 10000 });

    const text = (await stats.textContent()) || '';
    const hitCount = parseInt(text.match(/(\d+)/)![1], 10);
    expect(hitCount).toBeGreaterThan(0);
  });

  test('导出 HTML：文件名正确且为自包含单文件', async ({ page }) => {
    await openDoc(page, EXPORT_SLUG);

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.locator('button[title="导出为静态网页 (HTML)"]').click(),
    ]);

    expect(download.suggestedFilename()).toBe(`${EXPORT_SLUG}.html`);

    // 校验真实产物：模板结构 + 卡片标记 + CSS 已内联（getCleanCSS 在真实浏览器中抽取）
    const html = fs.readFileSync((await download.path())!, 'utf-8');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain(`<title>${EXPORT_SLUG}</title>`);
    expect(html).toContain('data-card-style="normal"');
    expect(html.length).toBeGreaterThan(5000);
  });
});
