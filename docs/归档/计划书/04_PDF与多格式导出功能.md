# Plan 04: 导出能力增强 — Markdown 导出

> **简要说明**：~~PDF 与多格式导出~~ → **仅保留 Markdown (.md) 导出**。PDF 方案已在实际验证中发现与 CHD 流式编辑不兼容，放弃。HTML 导出保持不变。Markdown 快速导出作为轻量下载入口保留。

---

## ⚠️ 执行验证后的学习总结（重要）

### 已放弃：PDF 导出方案

**经过实际编码和测试，决定放弃 `window.print()` PDF 导出方案。** 原因如下：

| 问题 | 根因 |
|------|------|
| **错位** | CHD 的 `Grid` 布局依赖 CSS 媒体查询和 `flex-wrap`，浏览器打印引擎对这些现代布局的渲染存在偏差 |
| **分页失控** | CHD 是无限流式画布，用户编辑时不考虑"页"的概念。卡片长度、Section 数量完全由内容驱动，`page-break-inside: avoid` 无法解决大卡片跨越问题 |
| **交互性丢失** | 页面上的高亮、折叠、主题切换等交互在打印时全部丢失，输出的 PDF 是"静态快照" |
| **核心矛盾** | CHD 的定位是**网页端结构化阅读**，PDF 的定位是**固定页面交付**——两者在本质上不兼容 |

### 正确方向：PPT 分页

> "后续的 PPT 可能会考虑做好分页，因为那**内容展示的内容量是人为控制的**"

PPT 的每张幻灯片内容是**人为控制**的（一页一页写），天然适合分页。而 CHD 的流式内容是**自然增长的**，强行分页是削足适履。

---

## 1. 现状分析

### 1.1 当前导出能力

```
编辑器 →「导出 HTML」按钮 → HtmlBundler.bundle() → 下载 .html 文件
```

缺少：Markdown 快速导出。编辑器中虽然有"保存到 posts"功能，但没有"下载 .md 副本"的独立入口。

### 1.2 实施内容

在 `ExportButton.tsx` 中将单一 HTML 按钮改为双按钮：

| 按钮 | 功能 | 实现 |
|------|------|------|
| **.md** | 下载当前内容的 Markdown 文件 | `new Blob([content], { type: 'text/markdown' })` → URL.createObjectURL → 下载 |
| **HTML** | 导出 HTML（原有逻辑不变） | `HtmlBundler.bundle()` → 同步输出目录 → 下载 |

---

## 2. 实施内容

### 2.1 代码变更

| 文件 | 变更 |
|------|------|
| `MdToHtml/src/components/ui/ExportButton.tsx` | 新增 `handleExportMarkdown()` 函数；渲染从单按钮改为双按钮组 `.md` + `HTML` |
| `MdToHtml/src/lib/export/template.ts` | ~~移除 `@media print` 样式~~（保留无影响，但已无用） |

### 2.2 技术依赖

零新增。`FileCode` 图标来自已有依赖 `lucide-react`。

---

## 3. 最终验收

- [x] 点击 `.md` → 提示文件名 → 直接下载 Markdown 文件
- [x] 点击 `HTML` → 原有导出逻辑正常（含输出目录同步 + toast 提示）
- [x] 构建通过（`Compiled successfully`，仅 `scripts/batch_eval.ts` 无关错误）