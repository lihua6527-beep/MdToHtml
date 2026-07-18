# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search-and-export.spec.ts >> 搜索与导出 >> 全文搜索功能
- Location: e2e\search-and-export.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[type="search"], input[placeholder*="搜索"], [role="searchbox"]')
Expected: visible
Timeout: 3000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 3000ms
  - waiting for locator('input[type="search"], input[placeholder*="搜索"], [role="searchbox"]')

```

```yaml
- img
- text: 文档列表
- button "存储容量管理":
  - img
- button "搜索文档":
  - img
- button "收起列表":
  - img
- button "回收站 (拖拽文档至此删除)":
  - img
- button "批量管理":
  - img
- link "论文阅读报告BERT Pre-training of Dee 7/9/2026":
  - /url: /editor/ 论文阅读报告BERT Pre-training of Dee
- link "论文阅读报告Direct Preference Optimi 7/9/2026":
  - /url: /editor/ 论文阅读报告Direct Preference Optimi
- link "论文阅读报告Direct Preference Optimi_标准化 7/9/2026":
  - /url: /editor/ 论文阅读报告Direct Preference Optimi_标准化
- link "论文阅读报告RoFormer Enhanced Transf 7/9/2026":
  - /url: /editor/ 论文阅读报告RoFormer Enhanced Transf
- link "论文阅读报告 7/9/2026":
  - /url: /editor/ 论文阅读报告
- link "纠正参数迷信重塑算力模型与数据的黄金三角 3/23/2026":
  - /url: /editor/纠正参数迷信重塑算力模型与数据的黄金三角
- link "性能优化意识知识分享 3/22/2026":
  - /url: /editor/性能优化意识知识分享
- link "工程创新优势说明 3/22/2026":
  - /url: /editor/工程创新优势说明
- link "优秀编程风格实践知识分享 3/22/2026":
  - /url: /editor/优秀编程风格实践知识分享
- link "架构能力知识分享 3/21/2026":
  - /url: /editor/架构能力知识分享
- link "健壮的网络连接设计技术知识分享 3/21/2026":
  - /url: /editor/健壮的网络连接设计技术知识分享
- link "进程通信与状态流转分析 3/20/2026":
  - /url: /editor/进程通信与状态流转分析
- link "缓存系统分析与优化报告 3/20/2026":
  - /url: /editor/缓存系统分析与优化报告
- link "微信小程序可视化应用 3/8/2026":
  - /url: /editor/微信小程序可视化应用
- link "IoT 数据可视化监控平台 3/6/2026":
  - /url: /editor/IoT 数据可视化监控平台
- link "鲁棒的双教师自监督蒸馏哈希学习 2/28/2026":
  - /url: /editor/鲁棒的双教师自监督蒸馏哈希学习
- link "适用于区块链的分布式密码技术综述 2/28/2026":
  - /url: /editor/适用于区块链的分布式密码技术综述
- link "数据可视化监控平台核心优势 2/28/2026":
  - /url: /editor/数据可视化监控平台核心优势
- link "抗密钥暴露的变色龙哈希函数构造方案 2/28/2026":
  - /url: /editor/抗密钥暴露的变色龙哈希函数构造方案
- link "基于深度学习的推荐系统研究综述 2/28/2026":
  - /url: /editor/基于深度学习的推荐系统研究综述
- link "卷积神经网络研究综述 2/28/2026":
  - /url: /editor/卷积神经网络研究综述
- link "区块链技术架构及进展 2/28/2026":
  - /url: /editor/区块链技术架构及进展
- link "共振攻击：揭示跨模态模型CLIP的脆弱性 2/28/2026":
  - /url: /editor/共振攻击：揭示跨模态模型CLIP的脆弱性
- link "信息抽取研究综述 2/28/2026":
  - /url: /editor/信息抽取研究综述
- link "AutoUnit 基于主动学习的预测引导自动化测试 2/28/2026":
  - /url: /editor/AutoUnit 基于主动学习的预测引导自动化测试
- link "注意力机制综述 2/28/2026":
  - /url: /editor/注意力机制综述
- button "设置":
  - img
  - text: 设置
- text: CHD
- heading "CHD Document Renderer" [level=1]
- paragraph: 在左侧文档列表选择已有文档，或通过下方方式开始工作
- button "使用 AI 编辑器 智能转换与文档编辑":
  - img
  - paragraph: 使用 AI 编辑器
  - paragraph: 智能转换与文档编辑
- img
- paragraph: 导入本地文件
- paragraph: 支持拖拽或点击选择文件
- paragraph: 当前文档数：26 篇
- alert
- img
- text: 2 errors
- button "Hide Errors":
  - img
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('搜索与导出', () => {
  4  |   test('全文搜索功能', async ({ page }) => {
  5  |     await page.goto('/');
  6  | 
  7  |     // 打开搜索面板
  8  |     const searchTrigger = page.locator('button:has-text("搜索"), [aria-label="搜索"], button:has-text("🔍")');
  9  |     if (await searchTrigger.isVisible()) {
  10 |       await searchTrigger.click();
  11 |     } else {
  12 |       // 尝试通过快捷键 Ctrl+K
  13 |       await page.keyboard.press('Control+k');
  14 |     }
  15 | 
  16 |     // 等待搜索输入框
  17 |     const searchInput = page.locator('input[type="search"], input[placeholder*="搜索"], [role="searchbox"]');
> 18 |     await expect(searchInput).toBeVisible({ timeout: 3000 });
     |                               ^ Error: expect(locator).toBeVisible() failed
  19 | 
  20 |     // 输入搜索词
  21 |     await searchInput.fill('测试');
  22 |     await page.waitForTimeout(500);
  23 | 
  24 |     // 验证搜索结果区域出现
  25 |     const searchResults = page.locator('.search-results, [data-search-results]');
  26 |     await expect(searchResults).toBeVisible({ timeout: 3000 });
  27 |   });
  28 | 
  29 |   test('HTML 导出功能', async ({ page }) => {
  30 |     await page.goto('/');
  31 |     await page.click('text=新建文档');
  32 |     await page.waitForSelector('.cm-editor');
  33 |     await page.waitForTimeout(500);
  34 | 
  35 |     // 输入内容
  36 |     const editor = page.locator('.cm-content');
  37 |     await editor.type('## 导出测试', { delay: 5 });
  38 |     await editor.press('Enter');
  39 |     await editor.type('### 导出卡片', { delay: 5 });
  40 | 
  41 |     await page.waitForTimeout(500);
  42 | 
  43 |     // 尝试点击导出按钮
  44 |     const exportBtn = page.locator('button:has-text("导出"), button:has-text("Export")');
  45 |     if (await exportBtn.isVisible()) {
  46 |       // 监听下载事件
  47 |       const [download] = await Promise.all([
  48 |         page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
  49 |         exportBtn.click(),
  50 |       ]);
  51 | 
  52 |       if (download) {
  53 |         expect(download.suggestedFilename()).toContain('.html');
  54 |       }
  55 |     }
  56 |   });
  57 | });
```