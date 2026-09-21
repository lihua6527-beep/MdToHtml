import { test, expect } from '@playwright/test';
import {
  seedDoc,
  removeDoc,
  docItem,
  makeImportFixture,
  ensureDocListed,
  resetTrash,
} from './test-helpers';

const IMPORT_SLUG = 'e2e-imported-doc';
const TRASH_SLUG = 'e2e-trash-cycle';

test.describe('文档管理', () => {
  test.afterAll(() => {
    removeDoc(IMPORT_SLUG);
    removeDoc(TRASH_SLUG);
  });

  test('导入本地文件 → 出现在文档列表', async ({ page }) => {
    const fixturePath = makeImportFixture(`${IMPORT_SLUG}.md`);

    await page.goto('/');
    // 等待首页渲染出隐藏的 file input
    await expect(page.locator('input[type="file"]')).toBeAttached();

    // 首页隐藏的 file input（accept=".md,.markdown"）
    await page.locator('input[type="file"]').setInputFiles(fixturePath);

    // 上传完成后列表异步刷新（CacheManager 后台重扫），等待最终一致
    await ensureDocListed(page, IMPORT_SLUG);
  });

  test('右键删除 → 进入回收站 → 恢复回列表（完整周期）', async ({ page }) => {
    // 保证可重复执行：清掉上一轮可能残留的回收站文件
    resetTrash();
    seedDoc(TRASH_SLUG);
    await page.goto('/');
    await ensureDocListed(page, TRASH_SLUG);

    const item = docItem(page, TRASH_SLUG);
    await item.click({ button: 'right' });

    // 右键菜单中的删除按钮（text-red-600），应用会弹出原生 confirm，
    // 必须先注册 dialog 处理并接受，否则 confirm() 返回 false 会取消删除
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('button.text-red-600', { hasText: '删除' }).click();

    await expect(item).toHaveCount(0, { timeout: 15000 });

    // 打开回收站，确认文件已进入
    await page.locator('button[title^="回收站"]').click();
    const trashItem = page.locator(
      `[data-testid="trash-item"][data-file-name*="${TRASH_SLUG}"]`
    );
    await expect(trashItem).toBeVisible({ timeout: 15000 });

    // 选中 → 恢复（用 testid 精确定位工具栏上的恢复按钮：
    // 页面中还有右键菜单的「恢复」入口，按名称匹配会产生歧义）
    await trashItem.click();
    await page.getByTestId('trash-restore').click();

    // 返回文档列表，确认已恢复
    await page.locator('button[title^="返回文档列表"]').click();
    await expect(docItem(page, TRASH_SLUG)).toBeVisible({ timeout: 15000 });
  });
});
