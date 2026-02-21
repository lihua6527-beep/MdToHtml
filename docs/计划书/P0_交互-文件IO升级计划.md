# P0_交互-文件IO升级计划

## 1. 背景与目标
当前文件路径配置依赖手动修改代码或配置文件，操作繁琐且不直观。为了提升用户体验，需实现基于 GUI 的文件交互。

## 2. 需求详情
### 2.1 输入目录选择 (Input Selection)
- **拖拽支持**: 用户可直接将包含 Markdown 文件的文件夹拖入应用界面。
- **目录选择**: 点击按钮调用系统目录选择对话框 (`showDirectoryPicker`)。
- **回退机制**: 若浏览器不支持 File System Access API，回退到 `<input type="file" webkitdirectory>`。

### 2.2 输出目录选择 (Output Selection)
- **默认行为**: 点击“导出”直接触发浏览器下载 (`Downloads` 文件夹)。
- **高级选项**: 允许用户指定输出目录（需浏览器权限支持）。

## 3. 技术方案
### 3.1 前端实现
- 使用 `react-dropzone` 或原生 Drag & Drop API 处理拖拽。
- 使用 `window.showDirectoryPicker()` 获取目录句柄 (FileSystemDirectoryHandle)。
- 建立 `FileSystemContext` 管理当前读写的目录句柄。

### 3.2 状态管理
- `inputHandle`: 当前读取的输入目录句柄。
- `outputHandle`: 当前写入的输出目录句柄（可选）。
- 持久化：将句柄存储在 IndexedDB (idb-keyval) 中，以便刷新后保持访问权限（需用户重新激活）。

## 4. 实施步骤
1.  **原型验证**: 创建 `DirectoryPicker` 组件，测试 `showDirectoryPicker` API。
2.  **上下文集成**: 在 `EditorContext` 中集成文件系统句柄。
3.  **UI 对接**: 在侧边栏或顶部工具栏添加“打开文件夹”和“导出设置”入口。
4.  **兼容性处理**: 处理 Firefox 等不支持 FSA API 的浏览器回退逻辑。
