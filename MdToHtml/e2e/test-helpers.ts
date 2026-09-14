import { Page, Locator, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * E2E 隔离数据目录
 *
 * 由 playwright.config.ts 的 webServer.env.MDTOHTML_CONFIG=config.e2e.json 指定，
 * 应用会把 input / output / data / trash 全部指向 .e2e-tmp/，
 * 因此 E2E 永远不会触碰真实文档目录（见 plans/测试工程/00_CI全绿计划书_2026-09-14.md §7.2）。
 */
export const E2E_ROOT = path.join(__dirname, '..', '.e2e-tmp');
export const E2E_INPUT_DIR = path.join(E2E_ROOT, 'input');
export const E2E_TRASH_DIR = path.join(E2E_ROOT, 'trash');
/** 待导入文件存放处（放在 input 之外，避免被当成已有文档） */
export const E2E_UPLOAD_DIR = path.join(E2E_ROOT, 'upload');

/** 测试用 CHD 文档：1 个 section + 3 张卡片 + 引用与代码块 */
export const SAMPLE_CHD_DOC = `## 第一章 系统概述

### 卡片一 核心概念

这是第一张卡片，包含**粗体**与*斜体*文本。

### 卡片二 技术特性

- 特性一：支持 CHD 协议
- 特性二：卡片式渲染

### 卡片三 引用与代码

> 这是一段引用内容

\`\`\`typescript
const app = 'MdToHtml';
\`\`\`
`;

/** 写入一个文档到隔离输入目录，返回其 slug */
export function seedDoc(slug: string, content: string = SAMPLE_CHD_DOC): string {
  fs.mkdirSync(E2E_INPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(E2E_INPUT_DIR, `${slug}.md`), content, 'utf-8');
  return slug;
}

/** 读取隔离输入目录中的文档内容 */
export function readDoc(slug: string): string {
  return fs.readFileSync(path.join(E2E_INPUT_DIR, `${slug}.md`), 'utf-8');
}

/** 清理某个用例自己写的文档 */
export function removeDoc(slug: string): void {
  fs.rmSync(path.join(E2E_INPUT_DIR, `${slug}.md`), { force: true });
}

/**
 * 清空隔离回收站。
 *
 * 回收站文件名带时间戳（<slug>_<ts>.md），若上一轮用例失败未回滚，
 * 残留文件会让同名匹配命中多个元素。用例开始前调用以保证可重复执行。
 */
export function resetTrash(): void {
  fs.rmSync(E2E_TRASH_DIR, { recursive: true, force: true });
  fs.mkdirSync(E2E_TRASH_DIR, { recursive: true });
}

/** 生成一个待导入的 .md 文件，返回其绝对路径 */
export function makeImportFixture(fileName: string, content: string = SAMPLE_CHD_DOC): string {
  fs.mkdirSync(E2E_UPLOAD_DIR, { recursive: true });
  const fixturePath = path.join(E2E_UPLOAD_DIR, fileName);
  fs.writeFileSync(fixturePath, content, 'utf-8');
  return fixturePath;
}

/** 定位左侧文档列表中的某个文档条目（data-testid 由 DocumentItem 提供） */
export function docItem(page: Page, slug: string): Locator {
  return page.locator(`[data-testid="doc-item"][data-slug="${slug}"]`);
}

/**
 * 等待某个文档出现在左侧列表中。
 *
 * 注意：/api/files 经由 CacheManager 提供（先返回旧列表、后台异步重扫），
 * 因此刚导入或刚落盘的文件不一定立刻出现在列表里。
 * 这里用「刷新 + 重试」等待最终一致 —— 这是当前实现的真实行为，不是测试取巧。
 */
export async function ensureDocListed(page: Page, slug: string, timeout = 30000): Promise<void> {
  await expect(async () => {
    await page.reload();
    await expect(docItem(page, slug)).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout, intervals: [500, 1000, 2000] });
}

/** 打开某个文档（进入 /editor/<slug>，等待卡片预览渲染完成） */
export async function openDoc(page: Page, slug: string): Promise<void> {
  await page.goto('/');
  await ensureDocListed(page, slug);
  await docItem(page, slug).locator('a').click();
  await page.waitForURL((url) => url.pathname.includes('/editor/'), { timeout: 20000 });
  await expect(page.locator('[data-card-style]').first()).toBeVisible({ timeout: 20000 });
}

/**
 * 进入编辑模式（点击顶部栏「编辑页面」）。
 *
 * 注意：当前版本的编辑器是卡片式可视化编辑（CHDRenderer + BottomToolbar），
 * 仓库中的 CodeMirror/MarkdownEditor 组件已不被任何页面渲染。
 */
export async function enterEditMode(page: Page): Promise<void> {
  await page.getByRole('button', { name: '编辑页面' }).click();
  await expect(page.getByRole('button', { name: '保存修改' })).toBeVisible({ timeout: 10000 });
}
