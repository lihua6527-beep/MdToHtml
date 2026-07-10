# Windows 终端乱码与路径问题

## 日期
2026-07-07

## 问题现象
在 CMD 终端执行命令时，错误信息显示为乱码：
```
ϵͳҲָ·
```
实际含义是：**"系统找不到指定的路径。"**

## 根本原因

### 1. 编码不匹配
Windows 中文版 CMD 默认使用 **GBK (代码页 936)**，而 VS Code 终端或其他现代工具使用 **UTF-8**。当 GBK 编码的中文错误信息在 UTF-8 终端中显示时，就会出现乱码。

| 环境 | 默认编码 |
|------|---------|
| Windows 中文版 CMD | GBK (代码页 936) |
| VS Code 终端 | UTF-8 |
| PowerShell (新版) | UTF-8 |

### 2. 路径分隔符问题
Windows CMD 中 `node_modules\.bin\tsc` 需要正确定位到 `node_modules/.bin/` 目录。

## 解决方案

### 方案 1：使用 npx（推荐）
```bash
# npx 自动查找 node_modules/.bin/ 中的可执行文件，无需手动构造路径
cd MdToHtml && npx tsc --noEmit 2>&1
```
**注意**：需要确保 `typescript` 已在 `devDependencies` 中安装，否则 `npx tsc` 会错误地安装 `tsc`（非 TypeScript 的另一个 npm 包）。

### 方案 2：直接在 VS Code 终端运行（推荐）
VS Code 内置终端（`Ctrl + `` `）默认使用 UTF-8 编码，不会出现乱码问题。

### 方案 3：切换代码页
```bash
chcp 65001  # 切换到 UTF-8 代码页
cd MdToHtml && node_modules/.bin/tsc --noEmit 2>&1
```

### 方案 4：跨平台命令
```bash
# npm prefix 方式，从项目根目录执行，不依赖当前工作目录
npm --prefix MdToHtml run build
```

## 本项目最佳实践

1. **所有 CLI 命令优先使用 `npm --prefix` 方式**，避免 `cd` 切换目录的兼容问题
2. **使用 VS Code 终端** 而非系统 CMD 执行命令
3. **TypeScript 类型检查** 作为 `next build` 的一部分自动执行，无需单独运行 `tsc --noEmit`
4. **构建命令** 执行 `npm --prefix MdToHtml run build` 时，确保终端编码正确（VS Code 终端无此问题）；或直接使用 `start.bat`（已包含 `chcp 65001 >nul`）

## 相关文件
- `start.bat` - 开发服务器启动脚本（已包含 `chcp 65001 >nul`）
- `MdToHtml/package.json` - 项目构建命令定义
