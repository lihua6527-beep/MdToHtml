import { test, expect } from '@playwright/test';
import { seedDoc, removeDoc, readDoc, openDoc, enterEditMode, SAMPLE_CHD_DOC } from './test-helpers';

const SLUG = 'e2e-editor-basic';

test.describe('核心编辑工作流', () => {
  test.beforeAll(() => {
    seedDoc(SLUG);
  });

  test.afterAll(() => {
    removeDoc(SLUG);
  });

  test('文档列表 → 打开文档 → CHD 卡片按样式渲染', async ({ page }) => {
    await openDoc(page, SLUG);

    // 卡片渲染：data-card-style 由 Card.tsx 输出
    await expect(page.locator('[data-card-style="normal"]').first()).toBeVisible();
    expect(await page.locator('[data-card-style="normal"]').count()).toBeGreaterThanOrEqual(3);

    // 卡片标题与行内 Markdown 均已渲染
    await expect(page.getByText('卡片一 核心概念')).toBeVisible();
    await expect(page.locator('strong').first()).toBeVisible();
    await expect(page.locator('blockquote').first()).toBeVisible();

    // 顶部栏展示当前文档名
    await expect(page.getByText(SLUG)).toBeVisible();
  });

  test('进入编辑模式 → 出现保存入口；退出后回到预览', async ({ page }) => {
    await openDoc(page, SLUG);

    await enterEditMode(page);
    // 编辑态：顶部栏出现「取消/预览」
    await expect(page.getByRole('button', { name: '取消/预览' })).toBeVisible();

    // 退出编辑态
    await page.getByRole('button', { name: '取消/预览' }).click();
    await expect(page.getByRole('button', { name: '编辑页面' })).toBeVisible();
  });

  test('保存修改 → 保存链路走通并退出编辑态（文件不被破坏）', async ({ page }) => {
    await openDoc(page, SLUG);
    await enterEditMode(page);

    await page.getByRole('button', { name: '保存修改' }).click();

    // handleSave 成功后会自动退出编辑态（见 useDocumentState.handleSave：
    // await saveFile(...) → setIsEditing(false)），因此这里以「回到预览态」作为保存成功的判据，
    // 而不是断言「已保存」按钮——它的生命周期与退出编辑态重叠，不可靠。
    await expect(page.getByRole('button', { name: '编辑页面' })).toBeVisible({ timeout: 15000 });

    // 磁盘上的文件仍是合法 CHD 内容（保存链路未损坏数据）
    const saved = readDoc(SLUG);
    expect(saved).toContain('## 第一章 系统概述');
    expect(saved).toContain('卡片一 核心概念');
    expect(saved).toContain('```typescript');
    expect(saved.trim().length).toBeGreaterThan(SAMPLE_CHD_DOC.trim().length * 0.5);
  });
});
