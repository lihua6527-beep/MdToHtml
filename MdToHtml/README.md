# MdToHtml (Internal Core)

> **注意**: 这是 `MdToHtml` 的核心工程目录。如果您是最终用户，请参考项目根目录下的 [README.md](../README.md)。

## 🔧 工程说明

此目录包含了基于 Next.js 的渲染引擎源代码。

### 核心命令
*   `npm run dev`: 启动本地开发服务器 (Debug模式)。
*   `npm run build`: 执行静态导出 (生成 `output/`)。
*   `npm run lint`: 代码风格检查。

### 目录指引
*   `src/components/CHD/`: CHD 协议的核心渲染组件。
*   `src/app/editor/`: 本地双栏编辑器实现。
*   `docs/`: 详细的技术文档与架构记录。
