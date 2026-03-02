# P2_工程-桌面端打包与部署计划 (Status: Completed/Archived)

> **Status**: **Completed** (Release v2 Released)
> **Date**: 2026-02-23
> **Outcome**: Successfully packaged Windows EXE with path selection and desktop export capabilities.

## 1. 目标与定位 (Goal & Positioning)
本计划旨在将 MdToHtml Pro 项目打包为可分发的 Windows 桌面应用程序。
定位：**离线优先、文件驱动、无缝集成** 的 Markdown 转 HTML 渲染器。
当前阶段：**Phase 1 - 技术验证与 MVP 打包** (探索版)。

## 2. 核心架构 (Core Architecture)
采用 **Hybrid Electron Architecture** (混合架构)：
- **渲染层 (Renderer)**: Next.js (Static Export) - 提供现代化 UI 与交互。
- **主进程 (Main)**: Electron - 负责窗口管理、生命周期。
- **服务层 (Server)**: Express (运行于主进程) - 替代 Next.js API Routes，提供文件 I/O 与业务逻辑。

### 架构图
```mermaid
graph TD
    A[Electron Main Process] --> B[Express Server (Port: Random)]
    A --> C[BrowserWindow]
    C -->|HTTP Request| B
    B -->|File System| D[Local Disk (Input/Output/Data)]
    C -->|Load URL| B
```

## 3. 关键技术方案 (Technical Solutions)

### 3.1 路径管理 (Path Management)
- **策略**: 统一使用 `src/lib/path-manager.ts` (前端适配) 与 `electron/path-manager.js` (后端适配)。
- **优先级**: 
  1. `config.json` (用户自定义)
  2. `App Root/input` (便携模式)
  3. `Documents/MdToHtml/input` (安装模式/只读回退)

### 3.2 API 迁移 (API Migration)
由于 `next export` 不支持 API Routes，所有 `/src/app/api` 逻辑已迁移至 `electron/server.js`：
- `GET /api/files`: 扫描文件列表
- `POST /api/load`: 读取文件内容
- `POST /api/save`: 保存文件修改
- `POST /api/save-session`: 保存会话与历史
- `POST /api/dataset`: 记录训练数据
- `POST /api/upload`: 处理文件上传

### 3.3 构建流水线 (Build Pipeline)
1. **Clean**: 清理旧构建产物。
2. **Next Build**: `cross-env NEXT_EXPORT=true next build` -> 生成 `out/` 静态文件。
3. **Electron Build**: `electron-builder` 打包 `electron/` + `out/` + `config.json`。
4. **Output**: 生成 `dist/MdToHtml Pro Setup X.X.X.exe` 或解压版。

## 4. 实施步骤 (Implementation Steps)

### Phase 1: 基础环境与服务 (已完成)
- [x] 安装 Electron, electron-builder, express 等依赖。
- [x] 创建 `electron/` 目录结构 (main, preload, server, path-manager)。
- [x] 迁移核心 API 逻辑至 Express。
- [x] 配置 `package.json` 构建脚本与 `next.config.js` 导出规则。

### Phase 2: 打包验证 (已完成)
- [x] 执行 `npm run build:electron` 进行首次打包。
- [x] 验证打包后的程序：
    - [x] 启动是否正常 (无白屏)。
    - [x] 路径是否正确 (读取 `config.json`)。
    - [x] API 是否通畅 (加载/保存/上传)。
    - [x] 静态资源 (图片/样式) 是否加载。

### Phase 3: 优化与发布 (待办)
- [ ] 图标与元数据配置。
- [ ] 开启 ASAR 压缩 (当前为 debug 模式)。
- [ ] 自动更新机制 (可选)。
- [ ] 签名与分发 (可选)。

## 5. 风险与对策 (Risks & Mitigation)
1. **静态资源路径**: `next export` 后路径可能不匹配 -> 使用 `trailingSlash: false` 与 `unoptimized: true`。
2. **端口冲突**: Express 启动端口被占用 -> 使用 `get-port` (动态导入) 获取随机可用端口。
3. **文件权限**: 安装在 `Program Files` 无写权限 -> `PathManager` 自动回退至 `Documents`。
4. **原生模块**: `node-gyp` 编译失败 -> 尽量使用纯 JS 库，或配置 `.npmrc` 镜像。
5. **构建锁定**: `electron-builder` 在 Windows 下可能因杀毒软件或资源管理器锁定文件导致构建失败 -> 建议构建前关闭相关进程，或使用临时输出目录。

## 6. 结论 (Conclusion)
当前的打包计划书清晰可行，Phase 1 和 Phase 2 已基本完成。项目已成功生成探索版 Windows 可执行文件，验证了混合架构的可行性。后续将重点关注安装包体积优化与自动化分发流程。
