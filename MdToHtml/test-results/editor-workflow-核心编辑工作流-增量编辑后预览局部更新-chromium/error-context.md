# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: editor-workflow.spec.ts >> 核心编辑工作流 >> 增量编辑后预览局部更新
- Location: e2e\editor-workflow.spec.ts:40:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=新建文档')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - img [ref=e6]
          - generic [ref=e8]: 文档列表
        - generic [ref=e9]:
          - button "存储容量管理" [ref=e10] [cursor=pointer]:
            - img [ref=e11]
          - button "搜索文档" [ref=e15] [cursor=pointer]:
            - img [ref=e16]
          - button "收起列表" [ref=e19] [cursor=pointer]:
            - img [ref=e20]
          - button "回收站 (拖拽文档至此删除)" [ref=e25] [cursor=pointer]:
            - img [ref=e26]
          - button "批量管理" [ref=e29] [cursor=pointer]:
            - img [ref=e30]
      - generic [ref=e33]:
        - link "论文阅读报告BERT Pre-training of Dee 7/9/2026" [ref=e35] [cursor=pointer]:
          - /url: /editor/ 论文阅读报告BERT Pre-training of Dee
          - generic [ref=e36]:
            - generic [ref=e38]: 论文阅读报告BERT Pre-training of Dee
            - generic [ref=e39]: 7/9/2026
        - link "论文阅读报告Direct Preference Optimi 7/9/2026" [ref=e41] [cursor=pointer]:
          - /url: /editor/ 论文阅读报告Direct Preference Optimi
          - generic [ref=e42]:
            - generic [ref=e44]: 论文阅读报告Direct Preference Optimi
            - generic [ref=e45]: 7/9/2026
        - link "论文阅读报告Direct Preference Optimi_标准化 7/9/2026" [ref=e47] [cursor=pointer]:
          - /url: /editor/ 论文阅读报告Direct Preference Optimi_标准化
          - generic [ref=e48]:
            - generic [ref=e50]: 论文阅读报告Direct Preference Optimi_标准化
            - generic [ref=e51]: 7/9/2026
        - link "论文阅读报告RoFormer Enhanced Transf 7/9/2026" [ref=e53] [cursor=pointer]:
          - /url: /editor/ 论文阅读报告RoFormer Enhanced Transf
          - generic [ref=e54]:
            - generic [ref=e56]: 论文阅读报告RoFormer Enhanced Transf
            - generic [ref=e57]: 7/9/2026
        - link "论文阅读报告 7/9/2026" [ref=e59] [cursor=pointer]:
          - /url: /editor/ 论文阅读报告
          - generic [ref=e60]:
            - generic [ref=e62]: 论文阅读报告
            - generic [ref=e63]: 7/9/2026
        - link "纠正参数迷信重塑算力模型与数据的黄金三角 3/23/2026" [ref=e65] [cursor=pointer]:
          - /url: /editor/纠正参数迷信重塑算力模型与数据的黄金三角
          - generic [ref=e66]:
            - generic [ref=e68]: 纠正参数迷信重塑算力模型与数据的黄金三角
            - generic [ref=e69]: 3/23/2026
        - link "性能优化意识知识分享 3/22/2026" [ref=e71] [cursor=pointer]:
          - /url: /editor/性能优化意识知识分享
          - generic [ref=e72]:
            - generic [ref=e74]: 性能优化意识知识分享
            - generic [ref=e75]: 3/22/2026
        - link "工程创新优势说明 3/22/2026" [ref=e77] [cursor=pointer]:
          - /url: /editor/工程创新优势说明
          - generic [ref=e78]:
            - generic [ref=e80]: 工程创新优势说明
            - generic [ref=e81]: 3/22/2026
        - link "优秀编程风格实践知识分享 3/22/2026" [ref=e83] [cursor=pointer]:
          - /url: /editor/优秀编程风格实践知识分享
          - generic [ref=e84]:
            - generic [ref=e86]: 优秀编程风格实践知识分享
            - generic [ref=e87]: 3/22/2026
        - link "架构能力知识分享 3/21/2026" [ref=e89] [cursor=pointer]:
          - /url: /editor/架构能力知识分享
          - generic [ref=e90]:
            - generic [ref=e92]: 架构能力知识分享
            - generic [ref=e93]: 3/21/2026
        - link "健壮的网络连接设计技术知识分享 3/21/2026" [ref=e95] [cursor=pointer]:
          - /url: /editor/健壮的网络连接设计技术知识分享
          - generic [ref=e96]:
            - generic [ref=e98]: 健壮的网络连接设计技术知识分享
            - generic [ref=e99]: 3/21/2026
        - link "进程通信与状态流转分析 3/20/2026" [ref=e101] [cursor=pointer]:
          - /url: /editor/进程通信与状态流转分析
          - generic [ref=e102]:
            - generic [ref=e104]: 进程通信与状态流转分析
            - generic [ref=e105]: 3/20/2026
        - link "缓存系统分析与优化报告 3/20/2026" [ref=e107] [cursor=pointer]:
          - /url: /editor/缓存系统分析与优化报告
          - generic [ref=e108]:
            - generic [ref=e110]: 缓存系统分析与优化报告
            - generic [ref=e111]: 3/20/2026
        - link "微信小程序可视化应用 3/8/2026" [ref=e113] [cursor=pointer]:
          - /url: /editor/微信小程序可视化应用
          - generic [ref=e114]:
            - generic [ref=e116]: 微信小程序可视化应用
            - generic [ref=e117]: 3/8/2026
        - link "IoT 数据可视化监控平台 3/6/2026" [ref=e119] [cursor=pointer]:
          - /url: /editor/IoT 数据可视化监控平台
          - generic [ref=e120]:
            - generic [ref=e122]: IoT 数据可视化监控平台
            - generic [ref=e123]: 3/6/2026
        - link "鲁棒的双教师自监督蒸馏哈希学习 2/28/2026" [ref=e125] [cursor=pointer]:
          - /url: /editor/鲁棒的双教师自监督蒸馏哈希学习
          - generic [ref=e126]:
            - generic [ref=e128]: 鲁棒的双教师自监督蒸馏哈希学习
            - generic [ref=e129]: 2/28/2026
        - link "适用于区块链的分布式密码技术综述 2/28/2026" [ref=e131] [cursor=pointer]:
          - /url: /editor/适用于区块链的分布式密码技术综述
          - generic [ref=e132]:
            - generic [ref=e134]: 适用于区块链的分布式密码技术综述
            - generic [ref=e135]: 2/28/2026
        - link "数据可视化监控平台核心优势 2/28/2026" [ref=e137] [cursor=pointer]:
          - /url: /editor/数据可视化监控平台核心优势
          - generic [ref=e138]:
            - generic [ref=e140]: 数据可视化监控平台核心优势
            - generic [ref=e141]: 2/28/2026
        - link "抗密钥暴露的变色龙哈希函数构造方案 2/28/2026" [ref=e143] [cursor=pointer]:
          - /url: /editor/抗密钥暴露的变色龙哈希函数构造方案
          - generic [ref=e144]:
            - generic [ref=e146]: 抗密钥暴露的变色龙哈希函数构造方案
            - generic [ref=e147]: 2/28/2026
        - link "基于深度学习的推荐系统研究综述 2/28/2026" [ref=e149] [cursor=pointer]:
          - /url: /editor/基于深度学习的推荐系统研究综述
          - generic [ref=e150]:
            - generic [ref=e152]: 基于深度学习的推荐系统研究综述
            - generic [ref=e153]: 2/28/2026
        - link "卷积神经网络研究综述 2/28/2026" [ref=e155] [cursor=pointer]:
          - /url: /editor/卷积神经网络研究综述
          - generic [ref=e156]:
            - generic [ref=e158]: 卷积神经网络研究综述
            - generic [ref=e159]: 2/28/2026
        - link "区块链技术架构及进展 2/28/2026" [ref=e161] [cursor=pointer]:
          - /url: /editor/区块链技术架构及进展
          - generic [ref=e162]:
            - generic [ref=e164]: 区块链技术架构及进展
            - generic [ref=e165]: 2/28/2026
        - link "共振攻击：揭示跨模态模型CLIP的脆弱性 2/28/2026" [ref=e167] [cursor=pointer]:
          - /url: /editor/共振攻击：揭示跨模态模型CLIP的脆弱性
          - generic [ref=e168]:
            - generic [ref=e170]: 共振攻击：揭示跨模态模型CLIP的脆弱性
            - generic [ref=e171]: 2/28/2026
        - link "信息抽取研究综述 2/28/2026" [ref=e173] [cursor=pointer]:
          - /url: /editor/信息抽取研究综述
          - generic [ref=e174]:
            - generic [ref=e176]: 信息抽取研究综述
            - generic [ref=e177]: 2/28/2026
        - link "AutoUnit 基于主动学习的预测引导自动化测试 2/28/2026" [ref=e179] [cursor=pointer]:
          - /url: /editor/AutoUnit 基于主动学习的预测引导自动化测试
          - generic [ref=e180]:
            - generic [ref=e182]: AutoUnit 基于主动学习的预测引导自动化测试
            - generic [ref=e183]: 2/28/2026
        - link "注意力机制综述 2/28/2026" [ref=e185] [cursor=pointer]:
          - /url: /editor/注意力机制综述
          - generic [ref=e186]:
            - generic [ref=e188]: 注意力机制综述
            - generic [ref=e189]: 2/28/2026
      - button "设置" [ref=e191] [cursor=pointer]:
        - img [ref=e192]
        - text: 设置
    - generic [ref=e197]:
      - generic [ref=e200]: CHD
      - heading "CHD Document Renderer" [level=1] [ref=e201]
      - paragraph [ref=e202]: 在左侧文档列表选择已有文档，或通过下方方式开始工作
      - button "使用 AI 编辑器 智能转换与文档编辑" [ref=e203] [cursor=pointer]:
        - generic [ref=e204]:
          - img [ref=e206]
          - generic [ref=e208]:
            - paragraph [ref=e209]: 使用 AI 编辑器
            - paragraph [ref=e210]: 智能转换与文档编辑
      - generic [ref=e213] [cursor=pointer]:
        - img [ref=e215]
        - generic [ref=e218]:
          - paragraph [ref=e219]: 导入本地文件
          - paragraph [ref=e220]: 支持拖拽或点击选择文件
      - paragraph [ref=e221]: 当前文档数：26 篇
  - alert [ref=e222]
  - generic [ref=e225] [cursor=pointer]:
    - img [ref=e226]
    - generic [ref=e228]: 2 errors
    - button "Hide Errors" [ref=e229]:
      - img [ref=e230]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { SAMPLE_CHD_DOC, typeInEditor, waitForAutoSave, hasAppError } from './test-helpers';
  3  | 
  4  | test.describe('核心编辑工作流', () => {
  5  |   test('新建文档 → 输入 CHD 内容 → 预览正确渲染', async ({ page }) => {
  6  |     // 1. 打开首页
  7  |     await page.goto('/');
  8  |     await page.waitForSelector('text=新建文档');
  9  | 
  10 |     // 2. 新建文档
  11 |     await page.click('text=新建文档');
  12 |     await page.waitForSelector('.cm-editor');
  13 |     await page.waitForTimeout(500);
  14 | 
  15 |     // 3. 输入 CHD 文档
  16 |     await typeInEditor(page, SAMPLE_CHD_DOC);
  17 | 
  18 |     // 4. 验证预览卡片数量（3 张普通卡片）
  19 |     const cards = page.locator('.chd-card-normal');
  20 |     await expect(cards).toHaveCount(3);
  21 | 
  22 |     // 5. 验证引用卡片
  23 |     await expect(page.locator('.chd-card-quote')).toBeVisible();
  24 | 
  25 |     // 6. 验证代码卡片
  26 |     await expect(page.locator('.chd-card-code')).toBeVisible();
  27 | 
  28 |     // 7. 验证内容正确渲染
  29 |     await expect(page.locator('text=核心概念')).toBeVisible();
  30 |     await expect(page.locator('text=技术特性')).toBeVisible();
  31 |     await expect(page.locator('text=代码示例')).toBeVisible();
  32 |     await expect(page.locator('strong')).toBeVisible();
  33 |     await expect(page.locator('em')).toBeVisible();
  34 | 
  35 |     // 8. 验证无错误状态
  36 |     const hasError = await hasAppError(page);
  37 |     expect(hasError).toBe(false);
  38 |   });
  39 | 
  40 |   test('增量编辑后预览局部更新', async ({ page }) => {
  41 |     await page.goto('/');
> 42 |     await page.click('text=新建文档');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  43 |     await page.waitForSelector('.cm-editor');
  44 |     await page.waitForTimeout(500);
  45 | 
  46 |     // 先输入基础内容
  47 |     await typeInEditor(page, ['## 测试章节', '', '### 初始卡片', '', '初始内容']);
  48 | 
  49 |     // 记录初始卡片数
  50 |     const initialCardCount = await page.locator('.chd-card-normal').count();
  51 | 
  52 |     // 新增一个卡片
  53 |     const editor = page.locator('.cm-content');
  54 |     await editor.press('End');
  55 |     await editor.press('Enter');
  56 |     await editor.press('Enter');
  57 |     await editor.type('### 新增卡片', { delay: 5 });
  58 |     await editor.press('Enter');
  59 |     await editor.type('这是增量添加的内容。');
  60 | 
  61 |     // 等待预览更新
  62 |     await page.waitForTimeout(500);
  63 | 
  64 |     // 验证卡片数 +1
  65 |     await expect(page.locator('.chd-card-normal')).toHaveCount(initialCardCount + 1);
  66 |     await expect(page.locator('text=新增卡片')).toBeVisible();
  67 |   });
  68 | });
```