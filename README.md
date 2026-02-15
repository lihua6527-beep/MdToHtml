# MdToHtml (Windows Local Edition)

**MdToHtml** 是一个 **Windows 本地专属** 的 Markdown 转静态 HTML 工具。

> ⚠️ **核心定位声明**:
> *   **Windows Only**: 仅支持 Windows 10/11 环境，不支持 Linux/macOS。
> *   **Local Only**: 所有数据处理在本地完成，无云端依赖，无后端服务。
> *   **No Concurrency**: 采用稳定顺序处理，不支持并发转换。

---

## 🚀 核心功能 (Features)

*   **本地转换**: 一键将 `input/` 目录下的 `.md` 文件转换为 `output/` 中的静态 HTML 网页。
*   **CHD 范式**: 内置 CHD (Canonical HTML Deck) 渲染引擎，自动将 Markdown 转换为智能网格布局。
*   **所见即所得**: 提供本地双栏编辑器 (Editor)，支持双向同步滚动与实时预览。
*   **云端部署就绪**: 虽然转换在本地进行，但生成的 `output/` 产物是标准的静态网页，可直接部署至 GitHub Pages 或 Vercel。

## 🛠️ 快速开始 (Quick Start)

### 1. 环境要求
*   **操作系统**: Windows 10 或 Windows 11
*   **运行时**: Node.js (v18.17.0+ LTS)

### 2. 安装与启动
只需点击根目录下的启动脚本：

```bash
# 1. 首次使用安装依赖
npm install

# 2. 启动本地编辑器 (自动打开浏览器)
start.bat
```

### 3. 生成网页
当您完成文档编辑后，运行构建命令生成最终 HTML：

```bash
npm run build
```

生成结果将位于根目录的 `output/` 文件夹中。

## 📂 目录结构

```text
MdToHtml/
├── input/          # [用户] 放置 Markdown 源文件
├── output/         # [用户] 生成的 HTML 结果 (请勿手动修改)
├── MdToHtml/       # [系统] 核心程序代码
├── README.md       # [文档] 项目说明
├── start.bat       # [脚本] 一键启动
└── .cursorrules    # [配置] AI 助手规则
```

## 📖 技术架构

本项目基于 **Next.js 14 (SSG)** 构建，裁剪了所有服务端动态特性，仅保留静态生成能力。

*   **前端**: React 18 + Tailwind CSS + Shadcn UI
*   **编辑器**: CodeMirror 6
*   **构建工具**: Windows Batch + PowerShell
*   **数据流**: File System (Input) -> AST Parsing -> React Rendering -> Static HTML (Output)

---
*严谨构建，极致本地体验。*
