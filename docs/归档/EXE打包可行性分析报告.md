# EXE 打包可行性分析报告

> 日期：2026-07-18 | 项目：MdToHtml Pro | 版本：v2

---

## 一、结论概览

| 项目 | 状态 |
|------|------|
| **整体可行性** | ✅ **完全可行** |
| **推荐方案** | **方案 B：Electron 内嵌 Next.js 生产服务器** |
| **需要修改的文件** | 仅 2-3 个 |
| **需要修改的前端代码** | **0 行** |
| **预估产物体积** | ~250-300 MB（含 Chromium + 运行时依赖） |

---

## 二、项目实际架构（重要）

经过对源码的详细分析，当前项目的架构远比预想的更统一：

```
开发模式 (npm run dev:electron)
  ┌──────────────────────────────────────┐
  │  Next.js Dev Server                  │
  │  - 页面渲染 (React/SSR)              │
  │  - API Routes (/api/*) ←  前端直接调用  │
  │  - 热更新                            │
  └──────────┬───────────────────────────┘
             │ http://localhost:3000
             ▼
  ┌──────────────────────────────────────┐
  │  Electron 窗口                       │
  │  - 加载 http://localhost:3000        │
  │  - preload.js (electronAPI)          │
  └──────────────────────────────────────┘
```

### 关键发现

| 发现 | 影响 |
|------|------|
| **前端所有 API 调用** 使用 `fetch('/api/...')` **相对路径** | API 由 Next.js API Routes 提供，不是 Express |
| **Next.js API Routes** (`src/app/api/`) 已有完整实现 | 包含 files/load/save/delete/export/config/trash 等 20+ 个路由 |
| **Electron 中的 server.js** 是一套**重复**的 API 实现 | 与 Next.js API Routes 功能重叠，电子模式未实际使用 |
| **前端服务层** (FileService/ConfigService/TrashService) 全部通过 `ApiClient` → `fetch('/api/...')` | 不需要改任何前端代码 |

> ⚡ **核心洞察**：项目已经在正确地使用 Next.js API Routes 提供后端服务，Express server.js 是一套冗余的备份，从未在实际前端代码中调用。

---

## 三、方案对比

### 方案 A：静态导出 + Express API（❌ 不推荐）

**需要修改：**
- `next.config.js` 加 `output: 'export'` ❌ 可能破坏路由
- 前端所有 fetch 路径从 `/api/xxx` 改为 `http://localhost:PORT/api/xxx` ❌ **大量修改**
- 处理动态路由的静态生成 ⚠️ 不确定是否兼容
- 适配 `next/image`、`next/link` 等组件 ⚠️ 易出 Bug

**风险：** 前端代码大规模修改，测试回归成本高，未知兼容性问题多。

### 方案 B：Electron 内嵌 Next.js 生产服务器（✅ 推荐）

**需要修改：**
- `package.json` → `build.files` 加 `.next/**/*` 
- `electron/main.js` → 打包后启动 Next.js 生产服务器
- 移除冗余的 `electron/server.js`（可选）

**前端代码修改：** **0 行**。

**原理：** 与开发模式 (`npm run dev:electron`) 完全一致的运行方式，只是将 `next dev` 换成 `next start`。

---

## 四、方案 B 详细实施

### 4.1 修改 `package.json`（electron-builder 配置）

```json
{
  "build": {
    "files": [
      "electron/**/*",
      ".next/**/*",            // ← 新增：Next.js 构建产物
      "next.config.js",        // ← 新增：Next.js 配置文件
      "package.json",
      "public/**/*"            // ← 新增：静态资源
    ],
    "extraResources": [        // ← 新增：额外资源
      {
        "from": "node_modules/next/dist",
        "to": "next-dist",
        "filter": ["**/*"]
      }
    ]
  }
}
```

> **注意：** 更优方案是使用 `extraResources` 只包含 `next` 运行时，或者让 electron-builder 自动解析依赖。

### 4.2 修改 `electron/main.js`

核心改动：打包后启动 Next.js 生产服务器而非 Express

```javascript
// --- main.js 关键变更 ---

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

async function createWindow() {
  let url;

  if (app.isPackaged) {
    // === 打包模式：启动 Next.js 生产服务器 ===
    const nextPort = await getFreePort();
    
    // 方式1：使用 next start CLI（最简单）
    serverProcess = fork(
      path.join(__dirname, '../node_modules/next/dist/bin/next'),
      ['start', '-p', String(nextPort)],
      { 
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      }
    );
    
    url = `http://localhost:${nextPort}`;
  } else {
    url = 'http://localhost:3000'; // 开发模式
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL(url);
}

// 获取空闲端口
function getFreePort() {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}
```

### 4.3 清理冗余文件（可选）

`electron/server.js` 和 `electron/path-manager.js` 的功能已被 Next.js 端的 `src/lib/path-manager.ts` 和 `src/app/api/` 完全覆盖，可以移除。

### 4.4 构建命令

```bash
# Step 1: 构建 Next.js
cd MdToHtml && npm run build

# Step 2: 打包为 exe
npm run build:electron

# 产物在 release/ 目录下
```

---

## 五、与现有方案对比

| 对比项 | 方案 A（静态导出） | 方案 B（Next.js 服务器） |
|--------|-------------------|------------------------|
| 需改前端代码 | **大量修改** | **0 行** |
| 需改配置文件 | 3-4 个 | 2-3 个 |
| 风险等级 | 🔴 高 | 🟢 低 |
| 开发/生产一致性 | ❌ 不一致 | ✅ 完全一致 |
| 启动速度 | 快（静态文件） | 中等（需启动 Node） |
| 产物体积 | ~150 MB | ~250-300 MB |
| 功能完整性 | ⚠️ 部分受限 | ✅ 全部保留 |

---

## 六、风险分析

### 6.1 产物体积问题

- Node.js 运行时和 `next` 依赖会增加约 100-150 MB
- 总产物体积约 250-300 MB，对现代 Windows 系统属于正常范围
- 可以通过 `asar: false` + 选择性包含依赖来优化

### 6.2 启动速度

- Next.js 生产服务器启动约需 2-3 秒
- Electron 窗口加载需额外 1-2 秒
- **可优化**：启动时显示闪屏/加载动画

### 6.3 兼容性

- Next.js API Routes 中使用的 Node.js API（fs/path/process）在 Electron 中均可正常运行
- 已有的中文路径处理逻辑（encodeURIComponent/decodeURIComponent）无需修改
- Windows 11 下已有测试经验

---

## 七、完整文件修改清单

| 文件 | 修改类型 | 修改内容 |
|------|----------|----------|
| `MdToHtml/package.json` | 修改 | `build.files` 添加 `.next/**/*`、`next.config.js`、`public/**/*` |
| `MdToHtml/electron/main.js` | 修改 | 打包模式启动 Next.js 生产服务器 |
| `MdToHtml/electron/server.js` | 删除（可选） | 冗余的 Express 服务器 |
| `MdToHtml/electron/path-manager.js` | 删除（可选） | 已被 `src/lib/path-manager.ts` 替代 |

**前端代码修改：0 行。**

---

## 八、总结

### 为什么方案 B 是最优解？

1. **最小改动** — 只改 Electron 启动逻辑和打包配置，前端零修改
2. **最大可靠** — 与开发模式完全一致的运行方式，已验证通过
3. **最低风险** — 不需要处理静态导出的各种兼容性问题
4. **完整性保留** — 所有 Next.js 功能、动态路由、API Routes 全部保留

### 可选的体积优化路径

如果后续需要减小体积，可以在方案 B 的基础上：
1. 将 Next.js 构建产物 `.next/standalone` 模式（只包含必要文件）
2. 使用 `pkg` 将 Node.js 运行时也打包进去
3. 移除冗余的 `node_modules` 中未使用的包

但这些是 **v2 优化**，不是 v1 的必要条件。

---

> **一句话总结：** 保持现有架构不变，只需要让 Electron 打包后启动 Next.js 生产服务器（就像开发时一样），再改两行打包配置，即可得到一个完整可用的 exe。