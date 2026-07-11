# MdToHtml Pro — 系统架构完整索引 (System Index)

> **生成日期**: 2026-07-11（完成 CHD 解析器 DFA 状态机重构三阶段）
> **用途**: 为 AI 助手提供完整的项目概览，支持语义化导航与上下文理解。
> **系统版本**: v1.0.0 | **技术栈**: Next.js 14 + TypeScript + Tailwind CSS + CodeMirror 6

---

## 一、项目概览 (Overview)

MdToHtml Pro 是一个 **Windows 本地离线** 的 Markdown 文档工程系统，核心能力是将符合 **CHD 协议**（Card-based Hierarchical Document）的 Markdown 文档解析、编辑、渲染为卡片式网格布局。系统具备完整的文档生命周期管理、本地文件操作、AI 辅助生成能力。

### 核心流程

```
Markdown 文件 (*.md)
    ↓ [chdParser.ts] 解析 CHD 协议三级结构
    ↓ [CHDRenderer] 核心渲染引擎
    ↓ [Section → Card] 组件层级渲染
    ↓ [HtmlBundler] 导出为独立 HTML 静态页
```

### 架构定位

| 维度 | 现状 | 扩展方向 |
|------|------|----------|
| 输入层 | ✅ 手动编写 + 拖拽导入 + 文件选择 | Docx/MD/TXT 文件智能导入 |
| 处理层 | ✅ 本地解析 + 渲染引擎 + AI 生成 | 编辑器内 AI 辅助编辑、实时建议 |
| 输出层 | ✅ HTML + Markdown 双格式导出 | 网页端结构化阅读（❌ PP/PDF 已验证不兼容） |

---

## 二、目录结构 (Directory Tree)

```
MdToHmtl/                          # 项目根目录
├── MdToHtml/                      # 主项目（Next.js 应用）
│   ├── src/                       # 源代码
│   │   ├── app/                   # Next.js App Router 页面
│   │   │   ├── page.tsx           # 首页（SSR→CSR，文档列表 + AI 功能）
│   │   │   ├── layout.tsx         # 根布局（ThemeProvider）
│   │   │   ├── loading.tsx        # 加载状态（旋转动画+步骤提示）
│   │   │   ├── globals.css        # 全局样式
│   │   │   ├── api/               # API 路由（24 个端点）
│   │   │   ├── editor/            # 编辑器页面（CodeMirror + CHD 实时预览）
│   │   │   ├── preview/           # 独立预览页面
│   │   │   ├── tag-showcase/      # 标签风格展示页
│   │   │   └── test/              # 测试验证仪表盘
│   │   ├── components/            # React 组件
│   │   │   ├── AI/                # AI 工作流组件（3 个文件）
│   │   │   ├── CHD/               # CHD 核心渲染引擎（6 个文件）
│   │   │   ├── Editor/            # 编辑器组件
│   │   │   ├── SearchPanel.tsx     # 🔍 搜索面板（Fuse.js 全文搜索弹窗）
│   │   │   ├── ui/                # 通用 UI 组件（shadcn 风格）
│   │   │   ├── settings/          # 设置面板相关
│   │   │   └── ...                # 业务组件（12 个）
│   │   ├── hooks/                 # 自定义 Hooks（12 个文件）
│   │   │   └── editor/            # 编辑器专用 Hooks（3 个）
│   │   ├── services/              # 服务层（6 个文件）
│   │   │   ├── ai/                # AI 服务（AIService, PromptEngine, TempFileManager）
│   │   │   ├── core/              # 核心服务（ApiClient, TransactionManager 等）
│   │   │   └── ...                # 业务服务（ConfigService, FileService, TrashService）
│   │   ├── lib/                   # 工具库（16 个文件 + 子模块）
│   │   │   ├── export/            # 导出模块（HtmlBundler, CssExtractor, template）
│   │   │   ├── chdParser.ts       # CHD 协议解析器（DFA 状态机 + 错误恢复 + 缓存）
│   │   │   └── __tests__/         # 工具库测试（14 个测试用例）
│   │   ├── types/                 # TypeScript 类型定义（3 个文件）
│   │   ├── config/                # 配置
│   │   ├── constants/             # 常量定义
│   │   └── data/                  # 数据文件
│   ├── public/                    # 静态资源
│   ├── posts/                     # 文档存储目录
│   ├── scripts/                   # 构建/运维脚本（11 个文件）
│   ├── tests/                     # 测试文件（Python 集成/单元测试）
│   │   ├── unit/                  # 单元测试
│   │   └── integration/           # 集成测试
│   ├── electron/                  # Electron 桌面端（4 个文件）
│   ├── portable_ml_package/       # 可移植 ML 包
│   ├── archive/                   # 归档文件
│   ├── recycle/                   # 回收站
│   └── 配置文件 (11 个)
├── docs/                          # 文档目录
│   ├── 开发记录/                  # 每日开发日志（30+ 条历史记录）
│   │   └── 历史记录/              # 完整历史记录存档
│   ├── 核心规划/                  # 核心规划（6 个文件）
│   │   ├── 1~5_编号文件            # 项目演化、方向、愿景、阶段、CHD 协议
│   │   └── 技术栈与算法详情.markdown # 技术栈/算法/设计令牌/主题配色
│   ├── 错误经验/                  # 错误经验总结
│   └── 归档/                      # 已归档文档（旧计划书/旧规范/历史分析）
├── plans/                         # 当前/计划中的开发任务（取代旧计划书目录）
├── PROJECT_SYSTEM_INDEX.md        # 本文件（系统索引）
├── README.md                      # 项目说明
├── API接口手册.md                 # API 接口文档
├── 进程通信与状态流转分析.md       # 进程/状态流转文档
├── CHD协议.md                     # CHD 协议规范
└── start.bat                      # 启动脚本
```

---

## 三、页面路由 (Pages)

| 路由 | 文件 | 类型 | 功能描述 |
|------|------|------|----------|
| `/` | `src/app/page.tsx` | SSR→CSR | **首页**：左侧文档列表 + 右侧 AI 功能区（默认），支持拖拽上传、设置面板 |
| `/editor` | `src/app/editor/page.tsx` | `'use client'` | **核心编辑器**：左右分栏（左侧 CodeMirror 6 + 右侧 CHD 实时预览 + 底部工具栏） |
| `/preview` | `src/app/preview/page.tsx` | `'use client'` | 独立预览页（从 localStorage / API 加载内容），导航栏含 Eye 图标 |
| `/tag-showcase` | `src/app/tag-showcase/page.tsx` | `'use client'` | 标签风格展示页（5 种风格：Glassmorphism/Tech/Gradient/Outline/3D Pop） |
| `/test` | `src/app/test/page.tsx` | `'use client'` | 系统验证仪表盘（单元测试 + 压力测试） |

---

## 四、API 路由 (API Routes)

> 所有 API 基于 Next.js Route Handlers，部署于 `src/app/api/`。共 **24 个端点**。

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
| `/api/app` | GET | 应用信息 |
| `/api/app/chd-protocol` | GET | CHD 协议信息 |
| `/api/clear-export` | POST | 清除导出记录 |
| `/api/temp-files` | GET/POST | 临时文件管理 |
| `/api/temp-files/[name]` | DELETE | 删除指定临时文件 |
| `/api/export/config` | GET/POST | 导出配置管理 |
| `/api/ai/config` | GET | AI 配置信息 |
| `/api/ai/generate` | POST | AI 生成（DeepSeek API 代理） |

---

## 五、核心组件架构 (Component Architecture)

### 5.1 首页组件体系

```
HomeClient.tsx（客户端布局编排器）
├── 职责：管理拖放上传、设置面板开关、活动模式切换（welcome/ai）
├── 默认模式：ai（首页打开直接显示 AI 功能区）
├── 布局：左侧 DocumentList 边栏 + 主区域（AIArea / 欢迎页） + 右侧 SettingsPanel 抽屉
└── 状态：activeMode, panelOpen, settingsType

DocumentList.tsx（文档浏览侧边栏）
├── 职责：文件列表展示、排序/收藏/置顶/删除、回收站管理
├── 排序：导入时间 / 修改时间 / 访问时间
├── 置顶/收藏：localStorage 持久化
├── 右键菜单：【收藏】【置顶】【删除】三项
└── 辅助：容量进度条、批量选择模式、回收站视图切换
```

### 5.2 CHD 渲染体系（6 个文件）

```
CHDRenderer.tsx（主渲染引擎）
├── 职责：解析 Markdown → 提取 Frontmatter → 切分 Sections → 分配 Cards
├── 关键函数：parseAttributes(), parseCHDBlocksWithCache(), useMemo 解析管线
├── 诊断输出：解析耗时、错误数、截断标记 → console.warn
├── 输入：markdown: string
├── 输出：Sections[] → 传递给 Section 组件
└── 依赖：gray-matter, chdParser, attributeParser, Section, TagRenderer

Section.tsx（章节容器）
├── 职责：渲染一个章节（Grid 网格布局），管理卡片排列
├── 关键特性：智能列数（1-4=N列，5+=3列）
├── 输入：title, layoutProps, cards[]
└── 输出：Card 组件网格

Card.tsx（卡片单元）
├── 职责：渲染单张卡片（4 种样式 + 6 种配色）
├── 样式：normal | highlight | quote | code
├── 配色：default | chart-1~5
├── 内容渲染：react-markdown + rehype-katex + remark-gfm + remark-math
├── 形状支持：rect / circle / rounded / floating / arrow（由 shapes.ts 定义）
└── 交互：编辑模式（标题/内容内联编辑、属性调整、右键删除）

其他：SectionRenderer.tsx、SimpleRenderer.tsx、CardIconTest.tsx
```

> **说明**：卡片图标系统（`attributes.icon` 用于 `pl-14` padding 布局）已移除渲染层，仅保留布局残影。预览页面的 `Eye` 图标（导航栏标题旁）保留不变。

### 5.3 AI 工作流组件（3 个文件）

| 组件 | 文件 | 功能 |
|------|------|------|
| AIArea.tsx | `components/AI/AIArea.tsx` | AI 转换工作流编排器：管理临时文件列表、选中状态、模型切换、提示模板切换、生成/预览/下载/保存、退出确认 |
| AIInputPanel.tsx | `components/AI/AIInputPanel.tsx` | 文件输入与提交 UI：拖放/点击选择文件（.txt/.md/.docx），生成/切换风格/清除按钮 |
| AITempFileList.tsx | `components/AI/AITempFileList.tsx` | 生成结果列表：多版本并列 + 预览/下载/保存/删除操作 |

### 5.4 通用业务组件

```
HomeClient.tsx           # 首页客户端逻辑
DocumentList.tsx         # 文档列表（含收藏/置顶/回收站）
AIArea.tsx               # AI 功能主区域
SettingsPanel.tsx        # 设置面板（file/render/protocol/ai）
PathSettingsPanel.tsx    # 路径设置
GlobalErrorBoundary.tsx  # 全局错误边界
ThemeProvider.tsx        # 主题上下文提供
ThemeSwitcher.tsx        # 主题切换器
ThemeScope.tsx           # 主题作用域
FloatingUndoRedo.tsx     # 浮动撤销/重做按钮
CapacityProgressBar.tsx  # 容量进度条
CapacityWarningDialog.tsx# 容量警告弹窗
RecycleBin.tsx           # 回收站面板
InteractivePost.tsx      # 交互式文章组件
InitialLoader.tsx        # 客户端初始加载动画
```

---

## 六、服务层 (Services)

### 6.1 AI 服务层（3 个文件）

```
services/ai/
├── AIService.ts         # AI 服务核心：调用 DeepSeek API、退避重试、错误处理
├── PromptEngine.ts      # Prompt 模板引擎（默认/学术双模板）
└── TempFileManager.ts   # 临时文件管理器（sessionStorage、自动命名）
```

> **注意**：`IconAutoFixService.ts` 已随卡片图标系统移除。

### 6.2 核心服务（4 个文件）

```
services/core/
├── ApiClient.ts          # 通用 HTTP 客户端（封装 fetch，含错误处理）
├── ErrorHandler.ts       # 统一错误处理
├── PermissionManager.ts  # 权限管理
└── TransactionManager.ts # 事务管理
```

### 6.3 业务服务（3 个文件）

```
services/
├── ConfigService.ts      # 配置管理（容量、应用信息、配置更新）
├── FileService.ts        # 文件操作（保存、加载、导出、训练数据记录）
└── TrashService.ts       # 回收站管理（列表、恢复、永久删除、统计）

# 依赖关系
ApiClient ← ConfigService
ApiClient ← FileService
ApiClient ← TrashService
```

---

## 七、自定义 Hooks（12 个文件）

| Hook | 文件 | 功能 |
|------|------|------|
| `useAutoSave` | `hooks/useAutoSave.ts` | 自动保存（500ms 防抖到 localStorage） |
| `useCHDSelection` | `hooks/useCHDSelection.ts` | 根据光标位置确定当前选中的 Section/Card |
| `useDebounce` | `hooks/useDebounce.ts` | 通用防抖 Hook |
| `useDocumentState` | `hooks/useDocumentState.ts` | 文档状态管理 |
| `useErrorHandler` | `hooks/useErrorHandler.ts` | 统一错误处理 |
| `useFileManager` | `hooks/useFileManager.ts` | 文件管理逻辑（SWR 数据获取 + CRUD） |
| `useFileSystem` | `hooks/useFileSystem.ts` | 文件系统接口 |
| `useHistory` | `hooks/useHistory.ts` | 操作历史（撤销/重做） |
| `useLocalStorage` | `hooks/useLocalStorage.ts` | localStorage 封装 |
| `useMarkdownInteraction` | `hooks/useMarkdownInteraction.ts` | Markdown 文本直接操作（属性/内容/标题/卡片移动） |
| `useVisitHistory` | `hooks/useVisitHistory.ts` | 访问历史 |
| `hooks/editor/`（3 个） | `useEditorDragDrop` / `useEditorIO` / `useEditorScroll` | 编辑器专用 Hooks |

---

## 八、工具库 (Lib)

### 核心工具（16 个文件）

| 文件 | 功能 |
|------|------|
| `lib/chdParser.ts` | CHD 文档结构解析器（L0 Frontmatter / L1 Section / L2 Card） |
| `lib/attributeParser.ts` | 属性解析器 `{key="val"}` → `{cleanText, props}` |
| `lib/posts.ts` | 文档读取工具（读取 `posts/` 目录，MetadataCacheManager） |
| `lib/utils.ts` | 通用工具函数（cn() 合并类名等） |
| `lib/themes.ts` | 主题定义（5 种配色方案） |
| `lib/constants.ts` | 全局常量（文件类型、缓存参数、分页设置） |
| `lib/logger.ts` | 日志工具 |
| `lib/health-check.ts` | 健康检查 |
| `lib/cache-manager.ts` | 缓存管理器（Top 500 策略 + 异步扫描） |
| `lib/config-manager.ts` | 配置管理器（`config.json` 读写） |
| `lib/path-manager.ts` | 路径管理器（`path.config.json`） |
| `lib/shapes.ts` | 卡片形状定义（rect / circle / rounded / floating / arrow） |
| `lib/trash-manager.ts` | 回收站管理器（`.trash` 目录操作） |
| `lib/validator.ts` | 校验器（文件类型/CHD 结构验证） |
| `lib/data-collector.ts` | 数据采集器 |
| `lib/temp-file-manager.ts` | 临时文件管理器 |
| `lib/env-hot-loader.ts` | 环境变量热加载（零 I/O 读取 API Key） |

### 子模块

```
lib/export/               # 导出模块（5 个文件）
├── HtmlBundler.tsx        # HTML 打包器（将 CHD 渲染结果导出为独立 HTML 文件）
├── CssExtractor.ts        # CSS 提取器（降级保留，供 HtmlBundler 回退使用）
├── getCleanCSS.ts         # 干净上下文 CSS 抽取器（隐藏 iframe 隔离主题残留，主路径）
├── template.ts            # HTML 模板
└── HtmlBundler.test.tsx   # 打包器测试

lib/simple-frontmatter.ts  # 简化版 Frontmatter 解析

lib/__tests__/             # 工具库测试（4 个文件）
├── chdParser.test.ts
├── posts.test.ts
├── data-collector.test.ts
└── env-hot-loader.test.ts
```

> **说明**：此前引用的 `lib/icon-system/` 目录（含 icon-config.ts / icon-manager.ts / icon-renderer.ts）及 `lib/icon-manager.ts`、`lib/document-icon-mapping.ts`、`lib/icon-components.ts`、`lib/icon-map.ts`、`lib/cache-manager-optimized.ts` 等文件已在重构中移除，相关图标测试文件亦已同步删除。

---

## 九、核心类型定义 (Types)

### `types/chd.ts` — CHD 协议类型

```typescript
type CardStyle = 'normal' | 'highlight' | 'quote' | 'code'

interface CHDSectionProps {
  layout?: string;
  color?: string;
  columns?: number;
  titleSpacing?: number;
  showDivider?: boolean;
  blockIndex?: number;
  titleAlign?: string;
}

interface CHDCardProps {
  shape?: string;
  style?: CardStyle;
  badge?: string;
  blockIndex?: number;
}

interface CHDSelectionState {
  activeSectionProps: CHDSectionProps | null;
  activeCardProps: CHDCardProps | null;
  selectedSectionTitle: string;
  parentSectionIndex: number | null;
  selectedBlockIndex: number | null;
}
```

### `types/file-system.ts` — 文件系统类型

```typescript
// 包含: ErrorType 枚举, AppError, FileSystemEntry, FileItem（含 isPinned/isFavorited/pinOrder）,
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

### 10.1 首页加载流

```
浏览器请求 /
    ↓ page.tsx (SSR)
Suspense 边界 (loading.tsx 旋转动画)
    ↓ (服务端) getAllPosts() → cache-manager.getAll()
    ↓ 如果缓存为空，异步 scanAndSync() 扫描 posts/ 目录
    ↓ 返回 initialPosts
    ↓
HomeClient (CSR)
    ├── DocumentList 边栏（SWR 自动轮询更新）
    ├── AIArea 主区域
    └── SettingsPanel 抽屉
```

### 10.2 AI 生成流

```
用户选择/拖拽文件到 AIInputPanel
    ↓ file.text() / mammoth.extractRawText({buffer})
AIArea 展示文件内容预览（前 500 字符）
    ↓ 点击「开始生成」
PromptEngine 组装 Prompt（默认/学术模板）
    ↓ AIService.generate() → POST /api/ai/generate
    ↓ DeepSeek API 调用（退避重试机制）
    ↓ 返回 CHD Markdown 文本
AITempFileList 展示结果
    ├── 预览 → 新标签页打开 HtmlBundler.bundle(content)
    ├── 下载 → HtmlBundler 生成 + FileService 保存 + 浏览器下载
    └── 保存 → FileService.saveFile() → 写入 posts/
```

### 10.3 缓存策略流

```
启动时
    ↓ cache-manager
MetadataCache.loadCache() → 读取 .metadata_cache.json
    ↓
getAll() O(1) 直接返回内存缓存
    ↓ (后台异步)
scanAndSync() → 遍历 posts/ 目录 → 更新缓存
    ↓
定期自动保存到 .metadata_cache.json
```

---

## 十一、脚本清单 (Scripts)

| 脚本 | 类型 | 功能 |
|------|------|------|
| `setup-port.js` | Node.js | 端口检测与设置 |
| `batch_eval.ts` | TypeScript | 批量评估脚本 |
| `classifyDocuments.js` | Node.js | 文档分类器 |
| `generate_portable_output.js` | Node.js | 生成可移植输出 |
| `migrate_data_v2.js` | Node.js | v2 数据迁移 |
| `process_single_file.js` | Node.js | 单文件处理 |
| `validate_root.ps1` | PowerShell | 根目录验证 |
| `verify_data_loop.js` | Node.js | 数据循环校验 |
| `archive_project.py` | Python | 项目归档 |
| `archive_and_record.bat` | Batch | 归档/收尾/记录 自动化入口（调用 archive_and_record.py） |

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
L0: YAML Frontmatter (title, subtitle, tags, version, status, ...)
L1: ## Section {layout="grid" columns=N section-color="chart-N"}
L2: ### Card {card-style="normal|highlight|quote|code"}
```

> **注意**：`icon` 属性已从 CHD 协议 v2.1 卡片层级中移除。卡片不再渲染图标，仅保留 `attributes.icon` 的 `pl-14` 左侧 padding 布局残影以兼容旧文档。

### 卡片样式
- `normal` — 标准卡片（默认，无特殊背景）
- `highlight` — 高亮卡片（强调色背景，用于核心观点）
- `quote` — 引用卡片（斜体+分隔线+淡背景，用于名言/评价）
- `code` — 代码卡片（深色背景 + 等宽字体，用于代码块/配置）

### 智能列数规则
- 1-4 张卡片 → 列数 = 卡片数量
- 5+ 张卡片 → 强制 3 列（自动换行）

### 富文本支持
- 数学公式: `$ LaTeX $` / `$$ LaTeX $$`
- 表格: GFM Markdown 表格语法
- 代码块: Markdown 标准 ``` 语法

### 卡片形状（由 `shapes.ts` 定义）
- `rect` — 矩形（默认，支持图标 padding 残影）
- `circle` — 圆形（自适应 aspect-square）
- `rounded` — 大圆角矩形
- `floating` — 浮动效果（带 badge 徽章）
- `arrow` — 箭头形状（左侧箭头）

---

## 十四、依赖清单 (Dependencies)

### 生产依赖 (28 个)

| 分类 | 包名 |
|------|------|
| 框架 | `next@14.1.0`, `react@18`, `react-dom@18` |
| 编辑器 | `@uiw/react-codemirror`, `@codemirror/lang-markdown`, `@codemirror/language-data` |
| Markdown | `react-markdown`, `remark-gfm`, `remark-math`, `remark-breaks`, `rehype-katex` |
| 解析 | `gray-matter`, `katex` |
| 图标 | `lucide-react`（仅用于 UI 控件图标，非卡片图标） |
| UI 组件 | `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-select`, `@radix-ui/react-slot` |
| 样式 | `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate` |
| 服务端 | `express`, `fs-extra`, `get-port`, `multer`, `swr` |
| 文件 | `mammoth`（.docx 解析） |

### 开发依赖 (15+)

| 分类 | 包名 |
|------|------|
| 语言 | `typescript`, `@types/node`, `@types/react`, `@types/react-dom` |
| 测试 | `jest`, `ts-jest`, `@testing-library/react`, `@testing-library/jest-dom` |
| 桌面 | `electron`, `electron-builder`, `concurrently`, `wait-on` |
| 工具 | `eslint`, `eslint-config-next`, `postcss`, `autoprefixer`, `tailwindcss` |
| 辅助 | `cheerio`, `jsdom`, `cross-env`, `ts-node` |

---

## 十五、AI 服务层

### AI 组件（3 个）

```
src/components/AI/
├── AIArea.tsx           # AI 转换工作流编排器：模型/模板切换、生成/预览/下载/保存、退出确认
├── AIInputPanel.tsx     # 输入面板：文件拖拽/上传（.txt/.md/.docx），生成/清除按钮
└── AITempFileList.tsx   # 生成结果列表：多版本并列 + 预览/下载/保存/删除操作
```

### AI 服务层（3 个）

```
src/services/ai/
├── PromptEngine.ts      # Prompt 模板引擎（默认 Prompt A + 学术 Prompt B）
├── AIService.ts         # AI 服务核心（DeepSeek API 调用、退避重试、错误处理）
└── TempFileManager.ts   # 临时文件管理器（sessionStorage、自动命名）
```

### AI 配置

集成在 `SettingsPanel.tsx` 中作为 `settingsType='ai'` 面板：
- DEEPSEEK_API_KEY 状态显示
- Flash / Pro 模型选择
- 连接测试按钮

### 支持的文件格式

| 格式 | 解析方式 | 依赖 |
|------|----------|------|
| `.txt` / `.md` | 原生 `file.text()` | 无 |
| `.docx` | `mammoth.extractRawText()` 提取纯文本 | `mammoth` |

---

## 十六、扩展点 (Extension Points)

| 功能 | 状态 | 位置 |
|------|------|------|
| AI 页面集成 | ✅ 已集成到首页右侧（默认打开） | `HomeClient.tsx` + `AIArea.tsx` |
| AI 服务层 | ✅ 已实现（DeepSeek API） | `services/ai/` + `/api/ai/generate` |
| AI 配置面板 | ✅ 已集成到设置 | `SettingsPanel.tsx` |
| CHD 渲染引擎 | ✅ v2.1 协议已稳定 | `components/CHD/` + `lib/chdParser.ts` |
| HtmlBundler 导出 | ✅ 完整 HTML 导出能力 | `lib/export/` |
| 缓存系统 | ✅ Top 500 策略 + 异步扫描 | `lib/cache-manager.ts` |
| 临时文件管理 | ✅ 已实现 | `lib/temp-file-manager.ts` |
| 图标系统 | ❌ **已移除** | 卡片图标渲染层已删除，仅保留布局残影；预览页导航栏 Eye 图标保留 |
| 首屏启动优化 | ✅ SSR + loading.tsx 动画 + 路由预热 | `app/` + `scripts/setup-port.js` |
| 文件收藏/置顶 | ✅ 已实现 | `DocumentList.tsx` + `types/file-system.ts` |
| 回收站管理 | ✅ 完整生命周期 | `lib/trash-manager.ts` + API |
| 多格式导出 | ❌ **已放弃** | PDF/PPT 已验证与 CHD 流式编辑不兼容（2026-07-11 最终决策） |
| AI 实时建议 | 🔜 未来 | 编辑器内 AI 辅助 |

---

> **维护说明**: 当项目结构发生变动（新增/移除文件、目录、API、组件），请同步更新本文件。