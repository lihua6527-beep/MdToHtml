# 系统配置与路径管理方案 (System Configuration & Path Management Plan)

> **目标**: 解除硬编码路径限制，提供标准化的输入输出路径选择与管理功能。
> **状态**: 规划中 (Planning)
> **优先级**: 中 (Medium)

## 1. 需求分析
- **痛点**: 当前 `inputDir` (输入) 和 `outputDir` (输出) 路径硬编码在代码或环境变量中，用户无法在运行时动态切换。
- **需求**:
  1.  **配置文件**: 引入 `config.json` 存储系统级配置。
  2.  **路径选择交互**: 提供类似“文件资源管理器”的界面，允许用户浏览并选择计算机上的任意文件夹作为输入/输出源。
  3.  **持久化**: 选择的路径需保存至配置文件，下次启动自动加载。

## 2. 技术方案

### 2.1 配置文件设计 (`config.json`)
在项目根目录下维护 `config.json`：
```json
{
  "system": {
    "inputDir": "C:\\Users\\User\\Documents\\Markdown",
    "outputDir": "C:\\Users\\User\\Documents\\Output",
    "theme": "light",
    "language": "zh-CN"
  },
  "editor": {
    "fontSize": 14,
    "fontFamily": "Inter, sans-serif"
  }
}
```

### 2.2 后端 API 扩展
- **`GET /api/config`**: 读取当前配置。
- **`POST /api/config`**: 更新配置并写入磁盘。
- **`GET /api/fs/list?path=...`**: **(核心)** 提供文件系统遍历能力。
  - 接收绝对路径参数。
  - 返回该路径下的文件夹列表 (Folders Only) 和父级路径，用于前端构建文件选择器。

### 2.3 前端交互设计 (Path Selector UI)
- **组件**: `PathSelectorDialog`
- **入口**: 左上角 (或设置面板) 的文件夹图标。
- **交互流程**:
  1.  点击“更改路径”按钮。
  2.  弹出模态框 (Modal)，显示当前服务器端目录结构。
  3.  用户点击文件夹进入下一级，点击“返回上一级”回退。
  4.  点击“选择当前文件夹”确认。
  5.  前端将新路径发送至 `/api/config` 保存。
  6.  系统自动刷新文档列表。

## 3. 实施步骤
1.  **后端基础**: 创建 `lib/config-manager.ts` 和 `/api/config` 路由。
2.  **文件浏览 API**: 实现 `/api/fs/list`，需注意权限控制（仅限本地运行环境）。
3.  **前端组件**: 开发 `FileExplorer` 组件，模拟系统文件选择对话框样式。
4.  **集成**: 将路径选择器集成到 `PathSettingsPanel` 及主页左上角。

## 4. 安全与风险
- **路径遍历风险**: 需限制 API 仅在本地环境 (`localhost`) 生效，防止暴露服务器敏感文件。
- **权限问题**: Node.js 进程需有访问目标文件夹的权限。
