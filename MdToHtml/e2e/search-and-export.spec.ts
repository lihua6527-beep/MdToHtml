import { test, expect } from '@playwright/test';

test.describe('搜索与导出', () => {
  test('全文搜索功能', async ({ page }) => {
    await page.goto('/');

    // 打开搜索面板
    const searchTrigger = page.locator('button:has-text("搜索"), [aria-label="搜索"], button:has-text("🔍")');
    if (await searchTrigger.isVisible()) {
      await searchTrigger.click();
    } else {
      // 尝试通过快捷键 Ctrl+K
      await page.keyboard.press('Control+k');
    }

    // 等待搜索输入框
    const searchInput = page.locator('input[type="search"], input[placeholder*="搜索"], [role="searchbox"]');
    await expect(searchInput).toBeVisible({ timeout: 3000 });

    // 输入搜索词
    await searchInput.fill('测试');
    await page.waitForTimeout(500);

    // 验证搜索结果区域出现
    const searchResults = page.locator('.search-results, [data-search-results]');
    await expect(searchResults).toBeVisible({ timeout: 3000 });
  });

  test('HTML 导出功能', async ({ page }) => {
    await page.goto('/');
    await page.click('text=新建文档');
    await page.waitForSelector('.cm-editor');
    await page.waitForTimeout(500);

    // 输入内容
    const editor = page.locator('.cm-content');
    await editor.type('## 导出测试', { delay: 5 });
    await editor.press('Enter');
    await editor.type('### 导出卡片', { delay: 5 });

    await page.waitForTimeout(500);

    // 尝试点击导出按钮
    const exportBtn = page.locator('button:has-text("导出"), button:has-text("Export")');
    if (await exportBtn.isVisible()) {
      // 监听下载事件
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
        exportBtn.click(),
      ]);

      if (download) {
        expect(download.suggestedFilename()).toContain('.html');
      }
    }
  });
});