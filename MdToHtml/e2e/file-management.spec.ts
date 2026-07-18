import { test, expect } from '@playwright/test';

test.describe('文档管理', () => {
  test('新建 → 保存 → 刷新 → 内容持久化', async ({ page }) => {
    await page.goto('/');
    await page.click('text=新建文档');
    await page.waitForSelector('.cm-editor');
    await page.waitForTimeout(500);

    // 输入内容
    const editor = page.locator('.cm-content');
    await editor.type('## 持久化测试', { delay: 5 });
    await editor.press('Enter');
    await editor.type('### 验证卡片', { delay: 5 });

    // 等待自动保存
    await page.waitForTimeout(3500);

    // 记录当前 URL
    const currentUrl = page.url();

    // 刷新页面
    await page.reload();
    await page.waitForSelector('.cm-editor');
    await page.waitForTimeout(1000);

    // 验证内容持久化
    await expect(page.locator('text=持久化测试')).toBeVisible();

    // 验证 URL 一致（同一文档）
    expect(page.url()).toBe(currentUrl);
  });

  test('删除 → 回收站 → 恢复 完整周期', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.document-list-item');

    // 获取第一篇文档标题
    const firstDocTitle = await page.locator('.document-list-item').first().textContent();

    // 右键菜单删除
    await page.locator('.document-list-item').first().click({ button: 'right' });
    await page.waitForTimeout(300);

    // 点击删除（可能通过菜单或按钮）
    const deleteBtn = page.locator('button:has-text("删除"), button:has-text("移至回收站")');
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
    } else {
      // 尝试用键盘快捷键或直接删除
      await page.keyboard.press('Delete');
    }

    // 进入回收站
    await page.click('text=回收站');
    await page.waitForTimeout(500);

    // 确认文档在回收站
    if (firstDocTitle) {
      await expect(page.locator(`text=${firstDocTitle.trim()}`)).toBeVisible();
    }

    // 点击恢复
    const restoreBtn = page.locator('button:has-text("恢复")');
    if (await restoreBtn.isVisible()) {
      await restoreBtn.click();
    }

    // 返回文档列表
    await page.click('text=返回, a:has-text("返回")');
    await page.waitForTimeout(500);

    // 验证文档已恢复
    if (firstDocTitle) {
      await expect(page.locator(`text=${firstDocTitle.trim()}`)).toBeVisible();
    }
  });
});