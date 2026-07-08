# MdToHtml Pro — 系统架构完整索引 (System Index)

> **生成日期**: 2026-07-07
> **用途**: 为 AI 助手（如 sailiNG、Claude、Copilot）提供完整的项目概览，支持语义化导航与上下文理解。
> **系统版本**: v1.0.0 | **技术栈**: Next.js 14 + TypeScript + Tailwind CSS

---

## 一、项目概览 (Overview)

MdToHtml Pro 是一个**离线 Markdown 转 HTML 的渲染引擎与编辑器**，核心能力是将符合 **CHD 协议**（Card-based Hierarchical Document）的 Markdown 文档解析并渲染为卡片式网格布局的静态 HTML 网页。

### 核心流程

```
Markdown 文件 (*.md)
    ↓ [chdParser.ts] 解析 CHD 协议三级结构
    ↓ [CHDRenderer] 核心渲染引擎
    ↓ [Section → Card] 组件层级渲染
    ↓ [HtmlBundler] 导出为独立 HTML 静态页
```

### 架构定位

| 维度 | 现状 | 扩展目标 |
|------|------|----------|
| 输入层 | 手动编写 CHD 格式 Markdown | AI 自动识别任意文本 → CHD Markdown |
| 处理层 | 本地解析 + 渲染 | 本地解析 + 渲染 + AI 辅助 |
| 输出层 | 静态 HTML 导出 | 静态 HTML 导出 + 多格式支持 |

---

## 二、目录结构 (Directory Tree)

```
MdToHmtl/                          # 项目根目录
├── MdToHtml/                      # 主项目（Next.js 应用）
│   ├── src/                       # 源代码
│   │   ├── app/                   # Next.js App Router 页面
│   │   │   ├── page.tsx           # 首页（文档列表）
│   │   │   ├── layout.tsx         # 根布局（ThemeProvider + ToastProvider）
│   │   │   ├── loading.tsx        # 加载状态
│   │   │   ├── globals.css        # 全局样式
│   │   │   ├── api/               # API 路由（18 个端点）
│   │   │   ├── editor/            # 编辑器页面
│   │   │   ├── preview/           # 独立预览页面
│   │   │   ├── tag-showcase/      # 标签风格展示页
│   │   │   └── test/              # 测试页面
│   │   ├── components/            # React 组件
│   │   │   ├── CHD/               # CHD 核心渲染组件（9 个文件）
│   │   │   ├── Editor/            # 编辑器组件（4 个文件）
│   │   │   ├── ui/                # 通用 UI 组件（shadcn 风格）
│   │   │   ├── settings/          # 设置相关组件
│   │   │   └── ...                # 其他业务组件
│   │   ├── hooks/                 # 自定义 Hooks（8 个文件）
│   │   ├── services/              # 服务层（6 个文件）
│   │   │   ├── core/              # 核心服务（ApiClient）
│   │   │   └── ...                # 业务服务
│   │   ├── lib/                   # 工具库（18 个文件）
│   │   │   ├── export/            # 导出模块（HtmlBundler 等）
│   │   │   └── __tests__/         # 工具库测试
│   │   ├── types/                 # TypeScript 类型定义（3 个文件）
│   │   ├── config/                # 配置相关
│   │   ├── constants/             # 常量定义
│   │   └── data/                  # 数据文件
│   ├── public/                    # 静态资源
│   ├── posts/                     # 示例文档（1 篇论文）
│   ├── scripts/                   # 构建/运维脚本（14 个文件）
│   ├── tests/                     # 测试文件
│   │   ├── unit/                  # 单元测试
│   │   └── integration/           # 集成测试
│   ├── electron/                  # Electron 桌面端（4 个文件）
│   ├── portable_ml_package/       # 可移植 ML 包
│   ├── archive/                   # 归档文件
│   ├── recycle/                   # 回收站
│   └── 配置文件 (11 个)
├── docs/                          # 文档
│   ├── 开发记录/                  # 开发日志
│   ├── 计划书/                    # 规划文档
│   ├── 技术规范与前端规范/        # 技术规范
│   ├── 核心规划/                  # 核心规划
│   ├── 错误经验/                  # 错误经验
│   └── 归档/                      # 已归档文档
├── PROJECT_STRUCTURE.md           # 旧版结构索引
├── PROJECT_SYSTEM_INDEX.md        # 本文件（新版系统索引）
├── CHD协议.md                     # CHD 协议规范（427 行）
├── build_static.bat               # 静态构建脚本
├── start.bat                      # 启动脚本
├── splash-animation-demo.html     # 开屏动画演示
└── 提示词记录.txt                 # 开发提示词记录
```

---

## 三、页面路由 (Pages)

| 路由 | 文件 | 类型 | 功能描述 |
|------|------|------|----------|
| `/` | `src/app/page.tsx` | SSR→CSR | 首页，展示文档列表（从 `posts/` 读取） |
| `/editor` | `src/app/editor/page.tsx` | `'use client'` | **核心编辑器**：左右分栏（左侧 CodeMirror + 右侧 CHD 实时预览） |
| `/preview` | `src/app/preview/page.tsx` | `'use client'` | 独立预览页（从 localStorage 读取 `chd_md_content`） |
| `/tag-showcase` | `src/app/tag-showcase/page.tsx` | `'use client'` | 标签风格展示页（5 种风格：Glassmorphism/Tech/Gradient/Outline/3D Pop） |
| `/test` | `src/app/test/page.tsx` | `'use client'` | 系统验证仪表盘（5 个单元测试 + 500 项压力测试） |

---

## 四、API 路由 (API Routes)

> 所有 API 基于 Next.js Route Handlers，部署于 `src/app/api/`。

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/files` | GET | 获取文件列表 |
| `/api/save` | POST | 保存文档 |
| `/api/load` | GET | 加载文档内容 |
| `/api/export` | POST | 导出 HTML 静态页 |
| `/api/upload` | POST | 上传文件 |
| `/api/config` | GET/POST | 读取/更新配置 |
| `/api/config/capacity` | GET/POST | 容量配置管理 |
| `/api/dataset` | GET/POST | 训练数据集操作 |
| `/api/delete` | POST | 删除文件（移入回收站） |
| `/api/trash/files` | GET | 获取回收站文件列表 |
| `/api/trash/restore` | POST | 从回收站恢复文件 |
| `/api/trash/delete` | POST | 永久删除回收站文件 |
| `/api/trash/empty` | POST | 清空回收站 |
| `/api/trash/stats` | GET | 回收站统计信息 |
| `/api/save-export` | POST | 保存导出记录 |
| `/api/save-session` | POST | 保存会话状态 |
| `/api/app-info` | GET | 应用信息 |
| `/api/app-info/chd-protocol` | GET | CHD 协议信息 |
| `/api/clear-export` | POST | 清除导出记录 |
| `/api/fs/list` | GET | 文件系统列表 |

---

## 五、核心组件架构 (Component Architecture)

### 5.1 CHD 渲染体系 (9 个文件)

```
CHDRenderer.tsx (主渲染引擎)
├── 职责: 解析 Markdown → 提取 Frontmatter → 切分 Sections → 分配 Cards
├── 关键函数: parseAttributes(), parseCHDBlocks(), useMemo 解析管线
├── 输入: markdown: string
├── 输出: Sections[] → 传递给 Section 组件
└── 依赖: gray-matter, chdParser, attributeParser, Section, TagRenderer

Section.tsx (章节容器)
├── 职责: 渲染一个章节（Grid 网格布局），管理卡片排列
├── 关键特性: 智能列数（Smart Columns：1-4=N列，5+=3列）
├── 输入: title, layoutProps, cards[]
└── 输出: Card 组件网格

Card.tsx (卡片单元)
├── 职责: 渲染单张卡片（4 种样式 + 6 种配色 + 5 种形态）
├── 样式: normal | highlight | quote | code
├── 配色: default | chart-1~5
├── 形态: rectangle | cut-corner | arrow | floating | rounded
├── 内容渲染: react-markdown + rehype-katex + remark-gfm + remark-math
└── 交互: 选中、编辑、拖拽、删除

BottomToolbar.tsx (底部工具栏)
├── 职责: 240px 固定底部栏，3 个标签页控制主题/布局/卡片属性
├── 标签页: 主题(ThemeSwitcher+TagStyle) | 布局(SectionProps) | 卡片(CardProps)
└── 触发: 通过回调直接修改 Markdown 文本属性

TagRenderer.tsx (标签渲染器)
├── 职责: 渲染 Frontmatter 中的 tags 数组
└── 风格: glass(默认) | tech | gradient | outline | 3d

其他: ├── SectionRenderer.tsx
      ├── SimpleRenderer.tsx
      ├── EditorRenderer.tsx
      └── CardAttributeEditor.tsx
```

### 5.2 编辑器体系 (4 个文件)

```
CodeMirrorEditor.tsx
├── 职责: 基于 @uiw/react-codemirror 的 Markdown 源码编辑器
├── 特性: 实时高亮、光标位置追踪、选区管理
└── API: insertText(), scrollToLine(), getCursor()

MarkdownEditor.tsx       # 简化版 Markdown 编辑器
MarkdownEditorSimple.tsx # 极简版编辑器
```

### 5.3 通用组件

```
HomeClient.tsx           # 首页客户端逻辑
DocumentList.tsx         # 文档列表展示
SettingsPanel.tsx        # 设置面板
PathSettingsPanel.tsx    # 路径设置
GlobalErrorBoundary.tsx  # 全局错误边界
ThemeProvider.tsx        # 主题上下文提供
ThemeScope.tsx           # 主题作用域
ThemeSwitcher.tsx        # 主题切换器
FloatingUndoRedo.tsx     # 浮动撤销/重做按钮
CapacityProgressBar.tsx  # 容量进度条
CapacityWarningDialog.tsx# 容量警告弹窗
RecycleBin.tsx           # 回收站面板
InteractivePost.tsx      # 交互式文章组件
```

---

## 六、服务层 (Services)

```
services/
├── core/
│   └── ApiClient.ts          # 通用 HTTP 客户端（封装 fetch，含错误处理）
├── ConfigService.ts          # 配置管理（容量、应用信息、配置更新）
├── FileService.ts            # 文件操作（保存、加载、导出、训练数据记录）
└── TrashService.ts           # 回收站管理（列表、恢复、永久删除、统计）

# 依赖关系
ApiClient ← ConfigService
ApiClient ← FileService
ApiClient ← TrashService
```

---

## 七、自定义 Hooks (8 个文件)

| Hook | 文件 | 功能 |
|------|------|------|
| `useAutoSave` | `hooks/useAutoSave.ts` | 自动保存到 localStorage |
| `useCHDSelection` | `hooks/useCHDSelection.ts` | 根据光标位置确定当前选中的 Section/Card |
| `useDebounce` | `hooks/useDebounce.ts` | 防抖 Hook |
| `useDocumentState` | `hooks/useDocumentState.ts` | 文档状态管理 |
| `useErrorHandler` | `hooks/useErrorHandler.ts` | 统一错误处理 |
| `useFileManager` | `hooks/useFileManager.ts` | 文件管理逻辑 |
| `useFileSystem` | `hooks/useFileSystem.ts` | 文件系统接口 |
| `useHistory` | `hooks/useHistory.ts` | 操作历史（撤销/重做） |
| `useLocalStorage` | `hooks/useLocalStorage.ts` | localStorage 封装 |
| `useMarkdownInteraction` | `hooks/useMarkdownInteraction.ts` | Markdown 文本直接操作（属性/内容/标题/卡片移动） |
| `useScoring` | `hooks/useScoring.ts` | 评分系统 |
| `useVisitHistory` | `hooks/useVisitHistory.ts` | 访问历史 |
| 子目录 `hooks/editor/` | — | 编辑器专用 Hooks |

---

## 八、工具库 (Lib)

| 文件 | 功能 |
|------|------|
| `lib/chdParser.ts` | CHD 文档结构解析器（L0 Frontmatter / L1 Section / L2 Card） |
| `lib/attributeParser.ts` | 属性解析器 `{key="val"}` → `{cleanText, props}` |
| `lib/posts.ts` | 文档读取工具（读取 `posts/` 目录） |
| `lib/utils.ts` | 通用工具函数（cn() 等） |
| `lib/themes.ts` | 主题定义（5 种配色方案） |
| `lib/constants.ts` | 全局常量 |
| `lib/logger.ts` | 日志工具 |
| `lib/health-check.ts` | 健康检查服务 |
| `lib/cache-manager.ts` | 缓存管理器 |
| `lib/cache-manager-optimized.ts` | 优化版缓存管理器 |
| `lib/icon-manager.ts` | 图标管理器 |
| `lib/document-icon-mapping.ts` | 文档-图标映射 |
| `lib/config-manager.ts` | 配置管理器 |
| `lib/path-manager.ts` | 路径管理器 |
| `lib/scorer.ts` | 评分器 |
| `lib/shapes.ts` | 卡片形状定义 |
| `lib/trash-manager.ts` | 回收站管理器 |
| `lib/validator.ts` | 校验器 |
| `lib/simple-frontmatter.ts` | 简化版 Frontmatter 解析 |
| `lib/data-collector.ts` | 数据采集器 |
| `lib/export/` | 导出模块 |
| `lib/export/HtmlBundler.ts` | HTML 打包器（将 CHD 渲染结果导出为独立 HTML 文件） |
| `lib/__tests__/` | 工具库测试 |

---

## 九、核心类型定义 (Types)

### `types/chd.ts` — CHD 协议类型
```typescript
type CardStyle = 'normal' | 'highlight' | 'quote' | 'warning' | 'stat' | 'summary' | 'code'

interface CHDSectionProps {
  layout: string;
  columns: number;
  sectionColor: string;
  titleSpacing: number;
  showDivider: boolean;
}

interface CHDCardProps {
  cardStyle: CardStyle;
  cardColor: string;
  icon: string;
  badge: string;
  shape: CardShape;
  colSpan: number;
  rowSpan: number;
}

interface CHDSelectionState {
  sectionBlockIndex: number;
  cardBlockIndex: number | null;
  currentSectionTitle: string;
  layout: string;
  color: string;
  columns: string;
  titleSpacing: string;
  showDivider: string;
}
```

### `types/file-system.ts` — 文件系统类型
```typescript
// 包含: ErrorType 枚举, AppError, FileSystemEntry, FileItem,
// CacheEntry, MetadataCache, TrashItem, TrashStats,
// CapacityStats, FileOperationResult, FileSaveResponse,
// 以及各种请求/响应接口
```

### `types/model-interface.ts` — 模型接口
```typescript
// 包含: ScoreDimensions, Issue, ChangeOp,
// InferenceRequest, ScoreResponse, OptimizeResponse,
// SuggestResponse, RawPairSubmission
```

---

## 十、关键数据流 (Data Flow)

### 10.1 编辑-预览流

```
用户输入 Markdown
    ↓ onChange
CodeMirrorEditor (左侧)
    ↓ setContent(content)
EditorPage 状态管理
    ↓ content prop
CHDRenderer (右侧实时预览)
    ├── gray-matter 解析 Frontmatter
    ├── parseCHDBlocks() 解析结构
    ├── parseAttributes() 提取属性
    ├── 自动计算 Smart Columns
    └── Section → Card 层级渲染
    ↓ HtmlBundler.bundle()
独立 HTML 文件导出
```

### 10.2 保存流

```
EditorPage
    ↓ handleSaveToWorkspace()
FileService.saveFile(slug, content)
    ├── 写入 posts/{slug}.md
    ├── 记录训练数据 (API: /api/dataset)
    └── 更新 lastSavedContent
```

### 10.3 配置流

```
SettingsPanel / PathSettingsPanel
    ↓ 用户操作
ConfigService.updateConfig()
    ↓ POST /api/config
    ↓ 更新 config.json
    ↓ 触发 UI 重渲染
```

---

## 十一、脚本清单 (Scripts)

| 脚本 | 类型 | 功能 |
|------|------|------|
| `post-build.js` | Node.js | 构建后处理（静态导出优化） |
| `verify-static-build.js` | Node.js | 验证静态构建结果 |
| `setup-port.js` | Node.js | 端口检测与设置 |
| `batch_eval.ts` | TypeScript | 批量评估脚本 |
| `classifyDocuments.js` | Node.js | 文档分类器 |
| `generate_portable_output.js` | Node.js | 生成可移植输出 |
| `migrate_data_v2.js` | Node.js | v2 数据迁移 |
| `process_single_file.js` | Node.js | 单文件处理 |
| `validate_root.ps1` | PowerShell | 根目录验证 |
| `verify_data_loop.js` | Node.js | 数据循环校验 |
| `archive_project.py` | Python | 项目归档 |

---

## 十二、Electron 桌面端 (4 个文件)

| 文件 | 功能 |
|------|------|
| `electron/main.js` | 主进程：窗口创建、IPC 通信 |
| `electron/preload.js` | 预加载脚本：暴露安全 API |
| `electron/server.js` | 内嵌 HTTP 服务器（打包模式） |
| `electron/path-manager.js` | 路径管理器 |

---

## 十三、CHD 协议规范速查 (CHD Protocol v2.1)

### 三级刚性结构

```
L0: YAML Frontmatter (title, subtitle, tags, category, ...)
L1: ## Section {layout="grid" columns=N section-color="chart-N"}
L2: ### Card {card-style="normal|highlight|quote" icon="icon-name"}
```

### 卡片样式
- `normal` — 标准卡片（默认）
- `highlight` — 高亮卡片（核心观点）
- `quote` — 引用卡片（名言/评价）

### 智能列数规则
- 1-4 张卡片 → 列数 = 卡片数量
- 5+ 张卡片 → 强制 3 列

### 富文本支持
- 数学公式: `$ LaTeX $` / `$$ LaTeX $$`
- 表格: GFM Markdown 表格语法
- 代码块: Markdown 标准 ``` 语法

---

## 十四、依赖清单 (Dependencies)

### 生产依赖 (20+)
```
next@14.1.0, react@18, react-dom@18
@uiw/react-codemirror, @codemirror/lang-markdown
react-markdown, remark-gfm, remark-math, rehype-katex
gray-matter, katex, lucide-react
@radix-ui/react-dialog, @radix-ui/react-label, @radix-ui/react-select, @radix-ui/react-slot
class-variance-authority, clsx, tailwind-merge, tailwindcss-animate
express, fs-extra, get-port, multer, swr
```

### 开发依赖 (15+)
```
typescript, @types/node, @types/react, @types/react-dom
jest, ts-jest, @testing-library/react, @testing-library/jest-dom
electron, electron-builder, concurrently, wait-on
eslint, eslint-config-next, postcss, autoprefixer, tailwindcss
cheerio, jsdom, cross-env, ts-node
```

---

## 十五、扩展点 (Extension Points)

该架构预留了以下扩展接入点：

| 扩展点 | 位置 | 说明 |
|--------|------|------|
| AI 输入页面 | — | 需新建路由 `/ai-input` |
| AI 服务层 | `services/` | 需新建 `services/ai/` 子目录 |
| CHDRenderer | 已有 Props 扩展 | `markdown` prop 可接受 AI 生成内容 |
| HtmlBundler | `lib/export/` | 已有完整 HTML 导出能力 |
| 类型系统 | `types/` | 可扩展 AI 相关类型 |

---

> **维护说明**: 当项目结构发生变动（新增/移除文件、目录、API、组件），请同步更新本文件。建议在每次提交前使用 `docs/scripts/validate_root.ps1` 或类似工具校验索引准确性。