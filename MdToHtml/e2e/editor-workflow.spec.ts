import { test, expect } from '@playwright/test';
import { SAMPLE_CHD_DOC, typeInEditor, waitForAutoSave, hasAppError } from './test-helpers';

test.describe('核心编辑工作流', () => {
  test('新建文档 → 输入 CHD 内容 → 预览正确渲染', async ({ page }) => {
    // 1. 打开首页
    await page.goto('/');
    await page.waitForSelector('text=新建文档');

    // 2. 新建文档
    await page.click('text=新建文档');
    await page.waitForSelector('.cm-editor');
    await page.waitForTimeout(500);

    // 3. 输入 CHD 文档
    await typeInEditor(page, SAMPLE_CHD_DOC);

    // 4. 验证预览卡片数量（3 张普通卡片）
    const cards = page.locator('[data-card-style="normal"]');
    await expect(cards).toHaveCount(3);

    // 5. 验证引用卡片
    await expect(page.locator('[data-card-style="quote"]')).toBeVisible();

    // 6. 验证代码卡片
    await expect(page.locator('[data-card-style="code"]')).toBeVisible();

    // 7. 验证内容正确渲染
    await expect(page.locator('text=核心概念')).toBeVisible();
    await expect(page.locator('text=技术特性')).toBeVisible();
    await expect(page.locator('text=代码示例')).toBeVisible();
    await expect(page.locator('strong')).toBeVisible();
    await expect(page.locator('em')).toBeVisible();

    // 8. 验证无错误状态
    const hasError = await hasAppError(page);
    expect(hasError).toBe(false);
  });

  test('增量编辑后预览局部更新', async ({ page }) => {
    await page.goto('/');
    await page.click('text=新建文档');
    await page.waitForSelector('.cm-editor');
    await page.waitForTimeout(500);

    // 先输入基础内容
    await typeInEditor(page, ['## 测试章节', '', '### 初始卡片', '', '初始内容']);

    // 记录初始卡片数
    const initialCardCount = await page.locator('[data-card-style="normal"]').count();

    // 新增一个卡片
    const editor = page.locator('.cm-content');
    await editor.press('End');
    await editor.press('Enter');
    await editor.press('Enter');
    await editor.type('### 新增卡片', { delay: 5 });
    await editor.press('Enter');
    await editor.type('这是增量添加的内容。');

    // 等待预览更新
    await page.waitForTimeout(500);

    // 验证卡片数 +1
    await expect(page.locator('[data-card-style="normal"]')).toHaveCount(initialCardCount + 1);
    await expect(page.locator('text=新增卡片')).toBeVisible();
  });
});