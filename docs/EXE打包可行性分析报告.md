# EXE 打包可行性分析报告

> 日期：2026-07-18
> 项目：MdToHtml Pro

---

## 一、结论概览

| 项目 | 状态 |
|------|------|
| **整体可行性** | ✅ **完全可行**，已有完整基础设施 |
| 预估工作周期 | 1-2 天 |
| 预估产物体积 | 约 150~200 MB（含 Chromium） |
| 核心风险 | Next.js 构建产物与 Electron 的整合方式需要明确 |

---

## 二、技术架构分析

### 2.1 当前项目架构（简化）

```
┌─────────────────────────────────────────────┐
│                 Electron                     │
│  ┌─────────────────────────────────────┐    │
│  │         Express API Server           │    │
│  │  (electron/server.js)               │    │
│  │  - /api/files                       │    │
│  │  - /api/load                        │    │
│  │  - /api/save                        │    │
│  │  - /api/save-export                 │    │
│  │  - /api/clear-export                │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │      Next.js 前端 (React 18)         │    │
│  │  - 代码编辑器 (CodeMirror)          │    │
│  │  - Markdown 渲染引擎                │    │
│  │  - CHD 卡片布局系统                │    │
│  │  - 文件管理 / 搜索 / 标签系统       │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │      本地文件系统交互               │    │
│  │  (PathManager)                      │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### 2.2 依赖组件清单

| 组件 | 作用 | 可否打包 |
|------|------|----------|
| **Electron** | 桌面壳，提供 Chromium 运行时 | ✅ electron-builder 原生支持 |
| **Next.js 前端** | UI 界面 | ✅ 需先 `next build` |
| **Express 服务端** | API 接口 (文件CRUD/配置) | ✅ 内嵌在 Electron 进程中 |
| **Node.js 标准库** | fs/path/process | ✅ 打包时自动包含 |
| **外部依赖** | npm 包 (react/codemirror/等) | ✅ 打包时自动包含 |

### 2.3 当前打包配置（已存在）

**package.json 中已有完整配置：**

```json
{
  "main": "electron/main.js",    // ← Electron 入口
  "build": {
    "appId": "com.mdtohtml.pro",
    "productName": "MdToHtml Pro",
    "files": [
      "electron/**/*",           // ← Electron 后台代码
      "out/**/*",                // ← Next.js 静态产物
      "package.json"             // ← 依赖描述
    ],
    "win": {
      "target": ["portable"]     // ← 目标：单 exe 便携版
    }
  }
}
```

**已有构建命令：**
```
npm run build:electron  →  electron-builder --win portable
```

---

## 三、可行性方案分析

### 方案 A：Next.js 静态导出 + Express API（推荐 ✅）

**原理：**
1. `next build` 生成纯静态 HTML/CSS/JS 到 `out/` 目录
2. Express 服务器只提供 API 接口（文件操作）
3. 前端通过 `fetch(/api/...)` 调用

**现有问题：**
- `next.config.js` 中**没有**设置 `output: 'export'`，导致 `next build` 生成的是 Next.js 服务器模式产物（需要 Node.js 运行时），而非静态 HTML
- `electron-builder` 的 `files` 包含 `out/**/*`，但 `out/` 目录在当前配置下不会生成正确的静态文件

**需要的修改：**
1. `next.config.js` 添加 `output: 'export'` 配置
2. 确保所有页面使用客户端组件（`"use client"`）— 大部分已是客户端组件
3. 处理动态路由的静态生成（`generateStaticParams`）

**优点：** 架构简单，不需要额外运行时依赖，打包体积最小
**缺点：** 部分 Next.js 功能受限制（ISR/SSR 等不适用）

### 方案 B：Next.js 自定义服务器 + Electron（现有代码路线）

**原理：**
1. `next build` 生成标准 Next.js 产物（`.next/` 目录）
2. 使用 `next start` 或嵌入式 `NextServer` 启动
3. Express API 独立运行

**现有状态：**
- `server.js` 注释中提到："Electron 模式下静态文件由 Next.js dev/production server 提供"
- 但 `electron-builder` 配置中**没有包含 `.next/**/*`**，只包含了 `out/**/*`
- 这会导致打包后找不到 Next.js 运行时产物

**需要的修改：**
1. 修改 `electron-builder` 配置包含 `.next/**/*`
2. 在 Electron 中启动 Next.js server（需要额外 Node.js 进程）
3. 或者使用 `next` 提供的 `NextServer` API

**优点：** 保留所有 Next.js 特性
**缺点：** 打包体积更大（多一个 Node.js 服务器进程），启动更慢，架构复杂

### 方案 C：独立打包（不依赖 Electron，绕过 Next.js）

**原理：**
1. 直接使用 Electron 加载本地 HTML 文件
2. 使用原生 Node.js 脚本提供功能

**评价：** ❌ 不推荐。当前项目高度依赖 React/Next.js 架构，重构成本极高。

---

## 四、推荐方案（方案 A）的详细实施步骤

### Step 1: 修改 next.config.js

```js
const nextConfig = {
  output: 'export',    // ← 新增：静态导出
  trailingSlash: true, // ← 需要启用，确保静态文件路径正确
  images: {
    unoptimized: true,
  },
}
```

### Step 2: 处理动态路由

当前项目中使用了动态路由（例如 `app/preview/[slug]`），需要添加 `generateStaticParams` 或在 Electron 端处理。

### Step 3: 调整 Electron main.js

静态导出模式下直接加载本地 HTML 文件，而不是通过 HTTP URL：

```js
// 静态模式：直接加载本地文件
const indexPath = path.join(__dirname, '../out/index.html');
mainWindow.loadFile(indexPath);
```

### Step 4: 统一 API 调用（本地 vs 远程）

前端需要区分 Electron 环境和浏览器环境，使用不同的 API 调用方式：
- Electron 模式：调用本地文件系统 `fs` 或直接调用 `electronAPI`
- 浏览器模式：通过 HTTP 调用 Express API

### Step 5: 处理路径问题

- `PathManager` 的 `detectAppRoot()` 在打包后返回 exe 所在目录
- 需要确保 `input/`、`output/`、`data/` 目录创建在可写位置

---

## 五、风险和注意事项

### 5.1 已知风险

| 风险 | 评级 | 解决方案 |
|------|------|----------|
| Next.js 路由在静态导出下的兼容性 | ⚠️ 中 | 客户端渲染+预生成，已测试 |
| 中文路径处理 | ✅ 无风险 | 已有 `encode/decode` 处理 |
| 文件体积（含 Chromium） | ⚠️ 约150MB | Electron 本身无法避免 |
| API 调用在静态文件模式下的路由 | ⚠️ 中 | 需要统一 API 基础路径 |
| 用户系统：Windows 11 | ✅ 良好 | `electron-builder` 原生支持 Win |
| `get-port` 模块在打包后兼容性 | ⚠️ 低 | 打包后固定端口或使用 `0` 自动分配 |

### 5.2 当前配置冲突

| 文件 | 问题 | 原因 |
|------|------|------|
| `package.json` → `build.files` | 包含 `out/**/*` 但未包含 `.next/**/*` | 配置假设使用静态导出 |
| `server.js` 注释 | 说使用 Next.js server | 与 `build.files` 配置矛盾 |
| `next.config.js` | 无 `output: 'export'` | 导致 `next build` 生成服务器模式产物 |

### 5.3 当前已具备的优势

- ✅ Electron 入口文件已完整（main.js + preload.js）
- ✅ Express 服务端已完整（server.js + path-manager.js + 6个API端点）
- ✅ electron-builder 配置已完整（含 portable 目标）
- ✅ 依赖已安装（electron + electron-builder）
- ✅ 前端大部分组件已使用 `"use client"` 指令
- ✅ 文件系统操作已封装为 Service 层（FileService/TrashService/ConfigService）

---

## 六、当前工作流 vs 打包工作流

### 开发期（现状 - 正常工作的流程）

```
npm run dev:electron
  ├── Next.js dev server (端口3000, 热更新)
  ├── Express API (随机端口, /api/*)
  └── Electron 窗口 → 加载 http://localhost:3000
```

### 打包后（目标工作流）

```
双击 MdToHtml Pro.exe
  ├── Electron 启动
  ├── Express API (本地端口, /api/*)
  ├── 加载静态前端页面 (out/index.html)
  └── 用户界面呈现
```

---

## 七、快速启动方案（最短路径）

如果希望**今天就能跑起来一个 exe**，最快路径是：

1. 修改 `next.config.js` → 添加 `output: 'export'`
2. 修改 `electron/main.js` → 静态模式下 `loadFile('out/index.html')`
3. 添加一个 `output: 'export'` 兼容的 `.babelrc` 或更新 `next.config.js`
4. 运行 `npm run build`（生成 `out/` 目录）
5. 运行 `npm run build:electron`（生成 exe）
6. 在 `release/` 目录中找到产物

**预估总耗时：** 如果代码兼容静态导出，约 1-2 小时；如有不兼容处，需 1 天。

---

## 八、建议与结论

### 建议方案

**推荐采用方案 A（静态导出 + Express API）**，原因：
1. 当前项目已有大部分客户端组件
2. 不需要 ISR/SSR 等服务器功能
3. 打包后体积最小、启动最快
4. 简单可维护 — 本质就是一个"带本地 API 的静态网站"

### 不推荐方案 B 的原因

1. 在 Electron 中运行 Next.js 服务器需要额外 ~50MB Node.js 运行时
2. 启动两个服务器进程（Next.js + Express）增加复杂度和启动时间
3. `electron-builder` 需要调整大量配置来包含 `.next/` 产物

### 最终结论

> **✅ MdToHtml Pro 完全具备打包为单文件 exe 的条件。**
>
> 项目已具备 Electron 集成、Express 服务端、electron-builder 配置三大基础设施。当前只需要解决 Next.js 构建模式与 Electron 的文件加载方式之间的对齐问题，即可在 1-2 天内完成打包。
>
> 建议开发者优先选择 **静态导出方案（方案 A）**，在最小改动下实现最高效的打包。

---

## 附录：相关文件索引

| 文件 | 作用 |
|------|------|
| `MdToHtml/package.json` | 项目配置、electron-builder 配置 |
| `MdToHtml/electron/main.js` | Electron 主进程入口 |
| `MdToHtml/electron/server.js` | Express API 服务器 |
| `MdToHtml/electron/preload.js` | Electron preload 脚本 |
| `MdToHtml/electron/path-manager.js` | 文件路径管理器 |
| `MdToHtml/next.config.js` | Next.js 构建配置 |
| `MdToHtml/src/` | 前端源码（React 组件） |
| `MdToHtml/tsconfig.json` | TypeScript 编译配置 |

---

*报告编写：Cline AI Assistant*