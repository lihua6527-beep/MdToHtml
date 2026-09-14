# MdToHtml Pro — 本地 Markdown 文档工程系统

> **系统版本**: v1.0.0 | **毕业设计**: 南京理工大学 软件工程  
> **技术栈**: Next.js 14 + TypeScript + Tailwind CSS + CodeMirror 6 + Electron

> ⚠️ **核心定位声明**:
> - **Windows Only**: 仅支持 Windows 10/11 环境，不支持 Linux/macOS。
> - **Local Only**: 所有数据处理在本地完成，无云端依赖，无后端服务。
> - **No Concurrency**: 采用稳定顺序处理，不支持并发转换。

---

## 📖 项目背景与创新点

### 为什么做这个项目？

传统 Markdown 编辑器（Typora、VS Code 插件等）存在四个痛点：
1. **平面化结构** — 所有内容线性排列，缺乏层级视觉区分
2. **导出能力有限** — HTML 导出丢失交互和动态效果
3. **AI 集成空白** — 缺乏与大语言模型深度集成的内容生成能力
4. **离线优化不足** — 多数编辑器本质上是"浏览器套壳"，未做深度本地优化

### 本项目的创新点

| 创新点 | 说明 | 技术实现 |
|--------|------|---------|
| **CHD 协议** | 自研卡片式层级文档标记协议 | DFA 状态机解析器，O(n) 时间复杂度 |
| **AI 原生集成** | 双模板 + 三级 Token 预算控制 | DeepSeek API + 本地代理收口（整包返回，Key 不出前端） |
| **离线优先架构** | 零网络依赖的完整功能 | LRU-500 缓存 + 本地文件系统 + SWR |
| **首屏加速 85%** | 从 1.85s 优化到 280ms | SSR + 惰性编译 + 缓存预热 组合策略 |

---

## ✨ 核心功能

- **CHD 渲染引擎**: 将符合 CHD 协议（Card-based Hierarchical Document）的 Markdown 文档解析并渲染为卡片式网格布局的静态 HTML，支持 `normal`、`highlight`、`quote`、`code` 四种卡片样式。
- **双栏编辑器**: 基于 CodeMirror 6 的 Markdown 源码编辑器 + CHD 实时预览，支持双向同步滚动。
- **AI 辅助生成**: 内置 DeepSeek API 集成，支持将 `.txt` / `.md` / `.docx` 文件智能转换为 CHD 格式 Markdown（双模板：通用/学术）。
- **文档全生命周期管理**: 文件导入/保存/删除/回收站/排序/收藏/置顶。
- **HTML 静态导出**: 通过 HtmlBundler 将编辑结果导出为独立 HTML 静态网页。
- **全文搜索**: 基于 Fuse.js 的模糊搜索，支持标题与内容检索。
- **撤销/重做**: 无限级操作历史管理。
- **缓存加速**: Top 500 缓存策略 + 异步后台扫描，首页 O(1) 加载。
- **主题切换**: 多主题支持（默认/暗黑）。
- **Electron 桌面打包**: 支持打包为 Windows 独立安装程序。

---

## 🚀 性能亮点

```
首屏加载:   1,850ms → 280ms    (↓ 85%)
编辑响应:   10.0ms → 1.8ms     (↓ 82%)
缓存命中:   0% → 100%          (热启动)
解析速度:   7× ~ 7.4×           (DFA + 分片缓存)
安装包:     18MB               (vs Typora 85MB, Obsidian 95MB, VS Code 180MB)
```

详细测试数据见 [性能测试报告](docs/毕业设计/性能测试报告.md)。

---

## 🏗️ 技术架构

### 四层架构

```
┌─────────────────────────────────────────────┐
│  Presentation Layer (Next.js 14 + React 18)  │
│  编辑器面板 · 预览面板 · AI 对话面板         │
├─────────────────────────────────────────────┤
│  Application Layer (Hooks + SWR + Zustand)   │
│  useDocumentState · useFileSystem · ...      │
├─────────────────────────────────────────────┤
│  Service Layer (操作引擎 · 文件系统 · AI)     │
│  OperationEngine · FileIO · AIProxy         │
├─────────────────────────────────────────────┤
│  Core Library Layer (纯函数，无 UI 依赖)     │
│  CHD Parser (DFA) · Cache (LRU-500) · ...  │
└─────────────────────────────────────────────┘
```

### 技术栈详情

| 层 | 技术 | 选型理由 |
|:---|:-----|:---------|
| 框架 | Next.js 14 (App Router) | SSR 加速首屏 + API Routes 轻量后端 |
| 编辑器 | CodeMirror 6 | 模块化架构，包体积小 (~200KB)，离线性能优 |
| 样式 | TailwindCSS | PurgeCSS 按需打包，首屏体积小 |
| 状态管理 | React Hooks + Zustand + SWR | 轻量、零样板代码、TypeScript 友好 |
| Markdown | react-markdown + remark-gfm + KaTeX | 原生 GFM 支持 + 数学公式 |
| 搜索 | Fuse.js | 模糊搜索质量最佳，包体积 ~8KB |
| 桌面 | Electron 28 | 原生桌面体验 + Windows 打包 |
| AI | DeepSeek API + 本地 API Route 代理 | 整包返回 + 重试机制 + Token 预算控制 |

### 架构设计原则

1. **分层隔离** — Core Library 层为纯函数库，不依赖 React 或浏览器 API
2. **单向数据流** — Core → Service → Application → Presentation
3. **接口抽象** — 文件系统通过 `IFileSystem` 接口抽象，支持多种实现
4. **错误边界** — GlobalErrorBoundary 确保单模块崩溃不影响全局

详细设计见 [系统设计说明书](docs/毕业设计/系统设计说明书.md)。

---

## 🧪 测试覆盖

自动化测试分三层执行，CI 由类型检查 + 代码规范 + 单元测试 + E2E 共同构成门禁。

| 测试层 | 工具 | 当前规模（2026-09-14 实测） | 门禁要求 |
|--------|------|-----------------------------|----------|
| 单元 / 组件测试 | Jest 30 + React Testing Library | **25 个套件 / 213 个用例** | 必须全通过 |
| 端到端测试 | Playwright 1.61（Chromium） | **3 个 spec / 7 个用例** | 必须全通过 |
| 类型检查 | `tsc --noEmit` | 0 错误 | 必须通过 |
| 代码规范 | ESLint（`next lint`） | 0 warning | `--max-warnings 0` 零容忍 |
| 覆盖率 | `jest --coverage`（全量 `src` 口径） | Stmts 20.5% / Branch 15.82% / Funcs 14.03% / Lines 21.25% | 阈值 19 / 14 / 13 / 20（防回退） |

覆盖重点：CHD 解析器（DFA 状态机边界，行覆盖 100%）、属性解析、操作引擎（13 种操作与逆操作）、HTML 导出（主路径 / 降级 / 转义）、AI 代理（API Key 不出前端）、文件与回收站服务、全文搜索。

```bash
cd MdToHtml
npm run verify        # ★ 一条命令跑完 CI 全部门禁（typecheck + lint + test:ci）
npm run test:e2e      # 端到端测试（自动拉起隔离数据目录 .e2e-tmp/）
```

> 详见 [测试体系说明](MdToHtml/tests/README.md)、[测试与 CI 门禁规范](docs/开发工作流/SOP_测试与CI门禁规范.md)
> 与 [自动化测试与 CI 流水线完成度分析报告](docs/自动化测试与CI流水线_完成度分析报告_2026-09-14.md)。

---

## 📊 与同类软件对比

| 维度 | MdToHtml Pro | Typora | VS Code + 插件 | Obsidian |
|------|-------------|--------|---------------|---------|
| 卡片式层级渲染 | ✅ 原生支持 | ❌ 线性渲染 | ❌ 需插件 | ❌ 需插件 |
| AI 集成 | ✅ 内置 DeepSeek | ❌ 无 | ❌ 需插件 | ⚠️ 社区插件 |
| 首屏加载 (本地) | **280ms** | 320ms | 1,800ms | 650ms |
| HTML 导出速度 | **92ms** (中型) | 230ms | 180ms | 150ms |
| 离线可用性 | ✅ 完全离线 | ✅ 完全离线 | ⚠️ 部分需网络 | ✅ 完全离线 |
| 安装包体积 | **18MB** | 85MB | 180MB | 95MB |
| 自定义协议 | ✅ CHD 协议 | ❌ 标准 Markdown | ❌ 标准 Markdown | ⚠️ 需插件 |

---

## 📦 快速开始

### 环境要求

- **操作系统**: Windows 10 或 Windows 11
- **运行时**: Node.js (v18.17.0+ LTS)

### 安装与启动

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（自动打开浏览器）
start.bat
```

### 生产构建

```bash
npm run build
npm start
```

构建产物位于 `MdToHtml/.next/` 目录，运行时需要 Node.js 环境。

---

## 📁 目录结构

```
MdToHmtl/                          # 项目根目录
├── MdToHtml/                      # 核心程序（Next.js 应用）
│   ├── src/                       # 源码
│   │   ├── app/                   # 页面 + API 路由
│   │   ├── components/            # React 组件
│   │   ├── hooks/                 # 自定义 Hooks（12 个）
│   │   ├── lib/                   # 核心库：解析/缓存/导出/校验
│   │   │   ├── chdParser.ts       # CHD 解析器（DFA 状态机）
│   │   │   ├── cache-manager.ts   # LRU-500 缓存管理器
│   │   │   └── export/            # HTML 导出引擎
│   │   └── services/              # AI/文件系统 服务层
│   ├── posts/                     # 文档存储目录
│   ├── electron/                  # Electron 桌面端
│   └── tests/                     # 测试文件
├── docs/                          # 项目文档
│   ├── 毕业设计/                   # 🔥 毕业设计文档（新增）
│   │   ├── 系统设计说明书.md       # 系统架构与模块设计
│   │   ├── 性能测试报告.md         # 性能数据与对比分析
│   │   └── 用户操作手册.md         # 用户指南
│   ├── 开发记录/                   # 每日开发日志
│   └── 核心规划/                   # 核心规划文档
├── plans/                         # 开发计划
├── PROJECT_SYSTEM_INDEX.md        # 系统架构索引
├── API接口手册.md                  # API 接口文档
├── CHD协议.md                      # CHD 协议规范
└── start.bat                      # 一键启动脚本
```

---

## 🔍 CHD 协议 (Card-based Hierarchical Document)

CHD 是本系统自研的三层刚性结构 Markdown 扩展协议：

```
L0: YAML Frontmatter（文档元信息）
L1: ## Section {layout="grid"}（章节容器，自动智能列数）
L2: ### Card {card-style="normal|highlight|quote|code"}（卡片单元，4 种样式）
```

支持的富文本：LaTeX 数学公式（KaTeX）、GFM 表格、代码块高亮。

详细规范见 [CHD协议.md](CHD协议.md)。

---

## 🤖 AI 功能

- **支持格式**: `.txt` / `.md` / `.docx`
- **双 Prompt 模板**: 默认版（通用文档）/ 学术版（论文导向）
- **双模型选择**: Flash（快速） / Pro（深度）
- **三级 Token 预算**: Minimal (200-400) / Medium (800-1500) / Full (2000-5000)
- **错误重试**: 网络错误重试 3 次，间隔递增
- **生成结果**: 支持预览/下载/保存/对比

---

## 📚 毕业设计文档

| 文档 | 内容 | 用途 |
|------|------|------|
| [系统设计说明书](docs/毕业设计/系统设计说明书.md) | 架构设计、模块详细设计、技术选型对比、接口设计 | 毕设答辩核心文档 |
| [性能测试报告](docs/毕业设计/性能测试报告.md) | 首屏/解析/编辑/缓存/导出/AI 全面性能数据 | 证明技术落地效果 |
| [用户操作手册](docs/毕业设计/用户操作手册.md) | 用户指南与操作说明 | 毕设交付物 |

---

## 📋 开发计划 (操作引擎)

当前正在实现 **Operation Engine（操作引擎）**，一个统一的命令总线式操作管理模块：

- [x] Operation 类型系统（枚举 + 接口 + invert 模式）
- [x] 撤销引擎重构（从 string[] 快照 → Operation[] 栈）
- [ ] 持久化 + 防抖（localStorage 持久化，300ms 合并）
- [ ] AI 上下文控制（三级 Token 预算）
- [ ] AI 内联编辑 UI（浮动工具栏 + 指令输入框）

---

## 📜 版本历史

| 版本 | 日期 | 主要变更 |
|------|------|---------|
| v1.0.0 | 2026-07-12 | 首版发布：CHD 渲染、AI 集成、离线缓存、Electron 打包 |
| v0.9.0 | 2026-07-09 | 首屏白屏优化 (↓86%)、图标系统重构 |
| v0.8.0 | 2026-07-08 | AI 服务层扩展、智能转换层集成 |
| v0.7.0 | 2026-02-27 | 系统里程碑：从工具蜕变为应用软件 |
| v0.1.0 | 2026-02-04 | 项目初始化、需求分析、原型设计 |

---

## 📄 许可

MIT License — 详见 [LICENSE](LICENSE)