# 路径配置与自定义指南

## 概述
为了提升用户体验，本项目已采用根目录直观的输入/输出结构：
- **输入目录**: `./input` (存放 Markdown 源文件)
- **输出目录**: `./output` (存放生成的静态 HTML 网站)

## 目录结构
```text
MdToHmtl/
├── input/          <-- 将您的 Markdown 文件放在这里
├── output/         <-- 生成的网站会出现在这里
├── MdToHtml/       <-- 项目核心代码 (无需修改)
├── start.bat       <-- 一键启动脚本
└── ...
```

## 自定义路径
如果您需要修改默认的输入/输出路径，请按照以下步骤操作：

### 1. 修改后端路径配置
编辑文件: `MdToHtml/src/lib/posts.ts`
```typescript
// 修改 input 路径 (支持相对路径或绝对路径)
const postsDirectory = path.join(process.cwd(), '../input'); 
```

编辑文件: `MdToHtml/src/app/api/save/route.ts`
```typescript
// 修改 input 路径以支持在线编辑保存
const dataDir = path.join(process.cwd(), '../input');
```

### 2. 修改构建脚本
编辑文件: `MdToHtml/package.json`
```json
"scripts": {
  "build": "next build && xcopy /s /y /i out ..\\output" 
}
```
将 `..\\output` 修改为您期望的输出目录。

## 注意事项
- 修改路径后，建议重新运行 `start.bat` 以确保改动生效。
- 确保新配置的目录具有读写权限。
- 根目录下的 `validate_root.ps1` 脚本可能会对非标准目录结构发出警告，这是正常现象，您可以根据需要更新校验脚本。
