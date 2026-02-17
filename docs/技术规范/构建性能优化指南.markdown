# 构建性能优化与自动修复指南

> **适用场景**: 当遇到构建时间过长、静态导出资源 404 或 `net::ERR_ABORTED` 错误时，AI 应参考本指南进行自主诊断与修复。

## 1. 耗时命令优化经验 (Long-running Command Optimization)

### 问题现象
- `npm run build` 或自定义脚本执行时间超过预期（如 > 30s 对于小型项目）。
- 磁盘 IO 占用极高。

### 核心经验
- **优先移动而非复制**: 
  - **反模式**: 使用 `fs.copySync` 或递归读取+写入来处理构建产物 (`out/` -> `output/`)。
  - **最佳实践**: 使用 `fs.renameSync(src, dest)`。这在同一磁盘分区下是原子操作，瞬间完成。
  - **代码范式**:
    ```javascript
    try {
        fs.renameSync(SOURCE, DEST); // Fast move
    } catch (e) {
        // Fallback for cross-device moves
        fs.cpSync(SOURCE, DEST, { recursive: true });
        fs.rmSync(SOURCE, { recursive: true });
    }
    ```
- **避免不必要的遍历**: 不要为了移动文件而遍历目录树，除非需要特定的过滤逻辑。

## 2. 静态导出资源路径修复 (Static Export 404 Fix)

### 问题现象
- 部署后访问页面，控制台大量 `net::ERR_ABORTED 404`。
- CSS/JS 文件路径指向根目录 `/` (如 `/_next/static/...`)，但在子目录部署或本地文件系统打开时失效。

### 核心经验
- **动态路径补丁 (Dynamic Path Patching)**:
  - **反模式**: 在 `next.config.js` 中硬编码 `assetPrefix`。这会导致多层级路由（如 `/` 和 `/slug/`）无法同时工作。
  - **最佳实践**: 构建后通过脚本批量替换 HTML 中的绝对路径为相对路径。
  - **算法逻辑**:
    1. 遍历所有生成的 `.html` 文件。
    2. 计算当前文件到根目录的相对深度 (e.g., `output/slug/index.html` -> `../..`).
    3. 正则替换 `/(src|href)="\/_next\//g` 为 `relative_path + "/_next/"`。

## 3. AI 自主修复指令 (AI Autonomous Repair Instructions)

当 AI 监测到用户执行构建命令耗时过长或报告资源加载错误时，应自动执行以下检查：

1. **检查脚本逻辑**: 读取 `package.json` 中的构建脚本，分析是否包含低效的文件操作（如 `xcopy`, `cp -r` 或 Node.js 的递归复制）。
2. **优化建议**: 主动提出编写/修改 Node.js 脚本，利用 `fs.renameSync` 优化流程。
3. **路径验证**: 检查 `next.config.js` 是否配置了可能导致冲突的 `assetPrefix`，若有，建议移除并采用“构建后处理”模式。
4. **验证闭环**: 修复后必须再次运行构建命令，对比耗时变化，并尝试打开生成的 HTML 验证资源加载。
