# 删除 `electron/server.js` 和 `electron/path-manager.js` 安全性分析

> 日期：2026-07-18 | 项目：MdToHtml Pro

---

## 一、结论总览

| 项目 | 状态 |
|------|------|
| **删除安全性** | ✅ **可安全删除** |
| **影响范围** | 仅 `electron/main.js` 一处需同步修改 |
| **对前端影响** | **无** |
| **对打包影响** | **需先修改 main.js 再删除，否则打包后无法运行** |

---

## 二、依赖关系图

### 当前依赖链

```
package.json
  └── "main": "electron/main.js"        ← Electron 入口
        ├── require('./server')              ← 引用 server.js
        │     └── require('./path-manager')  ← 引用 path-manager.js
        └── require('./preload')             ← preload.js（独立，不受影响）
```

### 外部引用扫描结果

| 文件 | 被外部引用次数 | 外部引用来源 |
|------|:----------:|-------------|
| `electron/main.js` | 1 | `package.json` → `"main"` 字段 |
| `electron/server.js` | **1** | 仅 `electron/main.js` |
| `electron/path-manager.js` | **1** | 仅 `electron/server.js` |
| `electron/preload.js` | 1 | `electron/main.js` → `webPreferences.preload` |

> **关键发现**：`server.js` 和 `path-manager.js` 仅在 `electron/` 目录内部相互引用，**没有文件从 electron/ 外部引入它们**。

---

## 三、功能重叠分析

### server.js 提供的 API（共 6 个）

| 端点 | 方法 | 功能 | Next.js 端对应 | 状态 |
|------|------|------|---------------|:----:|
| `/api/app-info` | GET | 获取应用信息 | `src/app/api/app/route.ts` | ✅ 已覆盖 |
| `/api/files` | GET | 列出 markdown 文件 | `src/app/api/files/route.ts` | ✅ 已覆盖 |
| `/api/load` | POST | 加载文件内容 | `src/app/api/load/route.ts` | ✅ 已覆盖 |
| `/api/save` | POST | 保存文件 | `src/app/api/save/route.ts` | ✅ 已覆盖 |
| `/api/save-export` | POST | 导出 HTML | `src/app/api/save-export/route.ts` | ✅ 已覆盖 |
| `/api/clear-export` | POST | 清空导出目录 | `src/app/api/clear-export/route.ts` | ✅ 已覆盖 |

### Next.js 端额外拥有的 API（server.js 未提供）

| 端点 | 功能 |
|------|------|
| `/api/ai/config` | AI 配置管理 |
| `/api/ai/config/save` | 保存 AI 配置 |
| `/api/ai/config/test-connection` | 测试 AI 连接 |
| `/api/ai/generate` | AI 生成内容 |
| `/api/app/chd-protocol` | 获取 CHD 协议文档 |
| `/api/config` | 通用配置管理 |
| `/api/config/capacity` | 容量限制配置 |
| `/api/confirm-save` | 保存确认 |
| `/api/dataset` | 数据集管理 |
| `/api/delete` | 删除文件 |
| `/api/export` | 导出功能 |
| `/api/save-session` | 会话保存 |
| `/api/save-temp` | 临时保存 |
| `/api/load-temp` | 加载临时文件 |
| `/api/trash/delete` | 回收站删除 |
| `/api/trash/empty` | 清空回收站 |
| `/api/trash/files` | 回收站文件列表 |
| `/api/trash/restore` | 恢复回收站文件 |
| `/api/trash/stats` | 回收站统计 |
| `/api/upload` | 文件上传 |
| `/api/fs/list` | 文件系统浏览 |

> **结论**：Next.js API Routes 不仅完全覆盖了 server.js 的所有功能，还额外提供了大量 server.js 没有的功能。

---

## 四、path-manager.js 冗余分析

`electron/path-manager.js` 已被 `src/lib/path-manager.ts` 完全替代：

| 方法 | electron/path-manager.js | src/lib/path-manager.ts | 状态 |
|------|------------------------|------------------------|:----:|
| `getInputPath()` | ✅ 有 | ✅ 有 | 一致 |
| `getOutputPath()` | ✅ 有 | ✅ 有 | 一致 |
| `getDataPath()` | ✅ 有 | ✅ 有 | 一致 |
| `getAppRoot()` | ✅ 有 | ✅ 有 | 一致 |
| `getAppConfig()` | ✅ 有 | ✅ 有 | 一致 |
| `getRecyclePath()` | ❌ 无 | ✅ 有 | TS 更强 |
| `getCHDProtocolPath()` | ❌ 无 | ✅ 有 | TS 更强 |

> **结论**：`src/lib/path-manager.ts` 功能更完善，已经包含了 `electron/path-manager.js` 的全部方法并额外增加了回收站和 CHD 协议路径管理。

---

## 五、删除方案与操作顺序

### 5.1 安全删除的前提条件

必须先修改 `electron/main.js`，然后才能安全删除 `server.js` 和 `path-manager.js`。

### 5.2 main.js 需要修改的内容

目前 main.js 中与 server.js 相关的代码（约第 15-42 行）：

```javascript
// 需删除/重写：启动 Next.js 生产服务器替代 Express
if (shouldLoadLocalServer) {
    serverPromise = (async () => {
      const { startServer } = require('./server');  // ← 依赖 server.js
      const { port, server } = await startServer();
      url = `http://localhost:${port}`;
    })();
}
```

修改为：

```javascript
if (app.isPackaged) {
  // 启动 Next.js 生产服务器
  const nextPort = await getFreePort();
  const { fork } = require('child_process');
  const nextPath = path.join(__dirname, '../node_modules/next/dist/bin/next');
  serverProcess = fork(nextPath, ['start', '-p', String(nextPort)], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe'
  });
  url = `http://localhost:${nextPort}`;
} else {
  url = 'http://localhost:3000'; // 开发模式
}
```

### 5.3 推荐操作顺序

| 步骤 | 操作 | 风险 |
|:----:|------|:----:|
| 1 | 先修改 `electron/main.js` | 低 |
| 2 | 测试 `npm run dev:electron` 确保开发模式正常 | 中 |
| 3 | 删除 `electron/server.js` | 无（已无引用） |
| 4 | 删除 `electron/path-manager.js` | 无（已无引用） |
| 5 | 重新测试 `npm run dev:electron` | 低 |
| 6 | 提交变更 | - |

---

## 六、风险场景分析

### 场景 1：先删除文件，后改 main.js ❌

| 后果 | 严重程度 |
|------|:--------:|
| `electron/main.js` 在 `require('./server')` 处报错 | 🔴 致命 |
| Electron 启动崩溃，无法加载窗口 | 🔴 致命 |
| **开发模式也受影响**（因为有 `forceServe` 路径） | 🔴 致命 |

### 场景 2：先修改 main.js，后删除 ✅

| 后果 | 严重程度 |
|------|:--------:|
| 开发模式不受影响（不走 server.js） | 🟢 无 |
| 删除后无残留引用 | 🟢 无 |
| 打包后可正常运行 | 🟢 无 |

### 场景 3：不改 main.js，不删除，直接打包 ❌

| 后果 | 严重程度 |
|------|:--------:|
| 现有打包配置 `build.files` 不含 `.next/**/*` | 🔴 致命 |
| 打包后 server.js 启动成功但无法提供前端页面 | 🔴 致命 |
| 窗口空白无内容 | 🔴 致命 |

---

## 七、总结

### 安全性结论：✅ 可安全删除

### 冗余判断标准

| 判据 | server.js | path-manager.js |
|:----:|:---------:|:---------------:|
| 被外部引用 | 0 处 | 0 处 |
| 功能被替代 | ✅ Next.js API Routes 完全覆盖 | ✅ `src/lib/path-manager.ts` 完全覆盖 |
| 功能更强替代 | ✅ Next.js 端有 20+ 路由 | ✅ TS 版有额外 2 个方法 |
| 删除前提 | 先改 main.js | 删除 server.js 后自动解除 |

### 推荐操作

```
1. 修改 electron/main.js → 打包后启动 Next.js 生产服务器
2. 验证通过 → 删除 electron/server.js
3. 自动解除引用 → 删除 electron/path-manager.js
4. 运行 git rm 提交删除
```

### 一句话总结

> **`electron/server.js` 和 `electron/path-manager.js` 是早期架构的遗留代码，其功能已被 `src/app/api/` 和 `src/lib/path-manager.ts` 全面替代。在修改 `main.js` 后，可以安全删除这 2 个文件，不影响项目任何功能。**