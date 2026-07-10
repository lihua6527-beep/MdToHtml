# MdToHtml Pro — 本地 Markdown 文档工程系统

> **系统版本**: v1.0.0 | **技术栈**: Next.js 14 + TypeScript + Tailwind CSS + CodeMirror 6

> ⚠️ **核心定位声明**:
> - **Windows Only**: 仅支持 Windows 10/11 环境，不支持 Linux/macOS。
> - **Local Only**: 所有数据处理在本地完成，无云端依赖，无后端服务。
> - **No Concurrency**: 采用稳定顺序处理，不支持并发转换。

---

## 核心功能 (Features)

- **CHD 渲染引擎**: 将符合 CHD 协议（Card-based Hierarchical Document）的 Markdown 文档解析并渲染为卡片式网格布局的静态 HTML，支持 `normal`、`highlight`、`quote`、`code` 四种卡片样式。
- **双栏编辑器**: 基于 CodeMirror 6 的 Markdown 源码编辑器 + CHD 实时预览，支持双向同步滚动。
- **AI 辅助生成**: 内置 DeepSeek API 集成，支持将 `.txt` / `.md` / `.docx` 文件智能转换为 CHD 格式 Markdown。
- **文档全生命周期管理**: 文件导入/保存/删除/回收站/排序/收藏/置顶。
- **HTML 静态导出**: 通过 HtmlBundler 将编辑结果导出为独立 HTML 静态网页。
- **缓存加速**: Top 500 缓存策略 + 异步后台扫描，首页 O(1) 加载。

---

## 快速开始 (Quick Start)

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

## 目录结构

```
MdToHmtl/                          # 项目根目录
├── MdToHtml/                      # 核心程序（Next.js 应用）
│   ├── src/                       # 源码
│   │   ├── app/                   # 页面 + API 路由
│   │   ├── components/            # React 组件（CHD/AI/Editor/UI）
│   │   ├── hooks/                 # 自定义 Hooks（12 个）
│   │   ├── services/              # 服务层（AI/Core/业务）
│   │   ├── lib/                   # 工具库（导出/缓存/解析/校验）
│   │   └── types/                 # 类型定义
│   ├── posts/                     # 文档存储
│   ├── electron/                  # Electron 桌面端支持
│   ├── scripts/                   # 构建/运维脚本
│   └── tests/                     # 测试
├── docs/                          # 项目文档
│   ├── 开发记录/                  # 每日开发日志
│   ├── 核心规划/                  # 核心规划文档
│   ├── 技术规范与前端规范/        # 技术规范
│   ├── 错误经验/                  # 错误总结
│   └── 归档/                      # 已归档的旧文档
├── plans/                         # 当前开发计划
├── PROJECT_SYSTEM_INDEX.md        # 系统架构索引（AI 助手用）
├── API接口手册.md                 # API 接口文档
├── CHD协议.md                     # CHD 协议规范
└── start.bat                      # 一键启动
```

---

## 技术架构

| 层 | 技术 |
|:---|:-----|
| 框架 | Next.js 14 (App Router) |
| UI | React 18 + TypeScript + Tailwind CSS |
| 编辑器 | CodeMirror 6（@uiw/react-codemirror） |
| Markdown 渲染 | react-markdown + remark-gfm + remark-math + rehype-katex |
| 状态管理 | React Hooks + SWR |
| AI 集成 | DeepSeek API（services/ai/AIService.ts） |
| 图表 | lucide-react |
| 桌面 | Electron（electron/） |
| 数据流 | 本地文件系统 → AST 解析 → React 渲染 → 静态 HTML 导出 |

---

## CHD 协议 (Card-based Hierarchical Document)

CHD 是三层刚性结构的 Markdown 扩展协议：

```
L0: YAML Frontmatter（文档元信息）
L1: ## Section {layout="grid"}（章节容器，自动智能列数）
L2: ### Card {card-style="normal|highlight|quote|code"}（卡片单元，4 种样式）
```

支持的富文本：LaTeX 数学公式、GFM 表格、代码块。

详细规范见 `CHD协议.md`。

---

## AI 功能

- 支持格式：`.txt` / `.md` / `.docx`
- 双 Prompt 模板：默认版（通用） / 学术版（论文导向）
- Flash / Pro 双模型选择
- 生成结果支持预览/下载/保存/对比

---

## 许可

MIT License