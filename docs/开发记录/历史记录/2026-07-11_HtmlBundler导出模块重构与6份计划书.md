# 2026-07-11 开发记录：HtmlBundler 导出模块重构 + PDF 多格式导出

> **日期**: 2026-07-11
> **工作内容**: 上午 — 系统核心代码深度分析与 6 份计划书制定；下午 — HtmlBundler 导出模块重构（方案一执行）+ PDF 与多格式导出（方案四执行）

---

## 一、系统核心代码深度分析

对 32+ 个核心源文件进行了完整代码级阅读与分析，形成分析报告并输出 6 份计划书。

### 分析覆盖的文件范围

| 模块 | 文件数 | 覆盖内容 |
|------|--------|---------|
| CHD 渲染引擎 | 6 | CHDRenderer, Section, Card, chdParser, attributeParser, shapes |
| 导出模块 | 3 | HtmlBundler, CssExtractor, template |
| AI 服务层 | 3 | AIService, PromptEngine, TempFileManager |
| 编辑器 | 5 | editor/page, useHistory, useMarkdownInteraction, useCHDSelection, CodeMirrorEditor |
| 首页组件 | 5 | HomeClient, DocumentList, SettingsPanel, AIArea, AIInputPanel |
| 服务层 | 6 | ApiClient, TransactionManager, FileService, TrashService, ConfigService, CacheManager |
| 类型定义 | 3 | chd.ts, file-system.ts, model-interface.ts |
| 其他 | ~5 | posts.ts, trash-manager.ts 等 |

### 识别的三大核心问题

1. **HtmlBundler CSS 抽取依赖浏览器运行时** — 预构建样式包方案有根本性错误
2. **CHD 解析器脆弱** — 布尔值状态机无错误恢复
3. **useHistory 无持久化** — 刷新后撤销历史丢失

### 制定的 6 份计划书

| 编号 | 计划 | 类型 | 估时 | 状态 |
|------|------|------|------|------|
| 01 | HtmlBundler 导出模块修复与 CSS 抽取重构 | 修复 | ~5.5h | ✅ **已执行** |
| 02 | CHD 解析器健壮性重构与状态机优化 | 修复 | ~7.5h | 📋 待执行 |
| 03 | useHistory 撤销系统持久化与防抖优化 | 修复 | ~6h | 📋 待执行 |
| 04 | PDF 与多格式导出功能 | 新功能 | ~5.5h | ✅ **已执行** |
| 05 | 文档全文搜索功能 | 新功能 | ~4.5h | 📋 待执行 |
| 06 | 编辑器内 AI 内联辅助编辑 | 新功能 | ~7h | 📋 待执行 |

---

## 二、上午：HtmlBundler 导出模块重构（方案一执行）

### 关键认知纠正

在规划方案一时，最初提出了"预构建样式包"方案，意图消除浏览器依赖。但经过与用户的深入讨论，认识到这是一个错误方向：

- **浏览器是项目的运行时环境**，不是临时宿主 —— 类比 Word 依赖 Windows、VS Code 依赖 Electron
- **CHD 的动态结构**意味着预构建 CSS 无法覆盖所有 Tailwind 类组合
- **正确的目标**是在浏览器中可靠工作，而非逃避浏览器

### 执行内容

#### 2.1 新建 `src/lib/export/getCleanCSS.ts`

核心模块，通过隐藏 iframe 创建干净页面上下文来抽取 CSS：

- **隔离主题残留**：iframe 设置独立的 `data-theme` 属性，CSS 变量使用目标主题，不受当前页面切换影响
- **采样元素**：在 iframe 中插入声明了所有 CHD 渲染类的采样元素，确保 Tailwind JIT 引擎生成完整 CSS
- **超时保护**：最多等 5 秒，超时后强制返回（降级到 `CssExtractor`）
- **`REQUIRED_CLASSES` 清单**：集中维护所有动态 Tailwind 类，供后续新增样式时同步

#### 2.2 重构 `src/lib/export/HtmlBundler.tsx`

| 变更 | 说明 |
|------|------|
| 导入 `getCleanCSS` | 主路径使用干净上下文 CSS 抽取 |
| 降级保留 `CssExtractor` | 仅在 `getCleanCSS` 失败时回退 |
| 新增 `escapeTemplate()` | 安全转义 `& < > " ' $ \` 等特殊字符 |
| 清理过时注释 | 删除第 46-52 行未落实的设计讨论注释 |

---

## 三、下午：PDF 与多格式导出功能（方案四执行）

于下午确认方案四的性价比最高后执行，在现有 HTML 导出基础上，增加了 PDF 和 Markdown 两种导出格式。

### 3.1 新增 `@media print` CSS 规则（`globals.css`）

在全局样式文件末尾新增完整的打印样式规则：

| 规则 | 说明 |
|------|------|
| `@page { margin: 2cm; size: A4; }` | A4 纸张，2cm 边距 |
| `body { font-size: 12pt; background: #fff; }` | 统一打印样式，强制白色背景 |
| `nav, button, .toolbar, iframe, [class*="fixed"]` | 隐藏所有 UI 控件 |
| `.chd-card { break-inside: avoid; }` | 卡片内容不跨页断裂 |
| `a[href^="http"]:after { content: " (" attr(href) ")"; }` | 链接显示完整 URL |
| `pre, code { background: #f5f5f5; border: 1px solid #ddd; }` | 代码块打印样式 |
| `table { border-collapse: collapse; }` | 表格打印样式 |
| `.katex { font-size: 11pt; }` | 数学公式打印适配 |

### 3.2 编辑器工具栏改造（`editor/page.tsx`）

新增两个导出按钮，与原有"导出 HTML"集中排列：

| 按钮 | 图标 | 功能 | 技术方案 |
|------|------|------|---------|
| **PDF** | `FileText` | 导出为 PDF | 复用 HtmlBundler → 隐藏 iframe → `window.print()` |
| **.md** | `FileCode` | 导出为 Markdown | `Blob` 直接下载 |
| **HTML** | `Download` | 导出为 HTML（原有） | HtmlBundler 不变 |

工具栏布局调整后：

```
[...] | 主题切换 | ─── | 导出 [PDF] [.md] [HTML] | ─── | 新窗口预览 | 保存
```

核心实现：
- `handleExportPDF`：`HtmlBundler.bundle()` → 隐藏 iframe → 500ms 后 `iframe.contentWindow?.print()`
- `handleExportMarkdown`：`new Blob([content])` → URL.createObjectURL → 下载
- 零新增依赖，`window.print()` 是浏览器内置 API

### 3.3 构建验证

`npm run build` → **"Compiled successfully"**，TypeScript 编译阶段通过。

---

## 四、文档更新

| 文档 | 更新内容 |
|------|---------|
| `PROJECT_SYSTEM_INDEX.md` | 导出模块文件数 4→5，新增 `getCleanCSS.ts` 条目 |
| `API接口手册.md` | 新增"导出模块说明"章节，含文件清单、调用流程、安全性说明 |
| `docs/归档/计划书/` | 方案一和方案四计划书从 `plans/` 移入归档 |

---

## 五、遗留事项

1. **`scripts/batch_eval.ts`** — 引用不存在的 `lib/scorer` 模块导致构建报错。预先存在的问题，与本次改动无关
2. 其余计划书仍在 `plans/` 目录，待用户确认后依次执行：
   - 02_CHD解析器健壮性重构与状态机优化.md（~7.5h）
   - 03_useHistory撤销重做系统持久化与防抖优化.md（~6h）
   - 05_文档全文搜索功能.md（~4.5h）
   - 06_编辑器内AI内联辅助编辑.md（~7h）