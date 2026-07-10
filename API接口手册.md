# MdToHtml Pro API 接口手册

> 最后更新于 2026-07-09 | 基于 `MdToHtml/src/app/api` 目录分析

---

## 接口总览

| # | 路径 | 方法 | 说明 |
|---|------|------|------|
| 1 | `/api/app` | GET | 获取应用配置和路径信息 |
| 2 | `/api/app/chd-protocol` | GET | 获取 CHD 协议文档 |
| 3 | `/api/clear-export` | POST | 清空导出目录 |
| 4 | `/api/config` | GET/POST | 读写全局配置 |
| 5 | `/api/config/capacity` | GET/POST | 容量限制管理 |
| 6 | `/api/dataset` | POST | 批量数据集操作 |
| 7 | `/api/delete` | POST | 删除文件 |
| 8 | `/api/export` | POST | Markdown → HTML 导出 |
| 9 | `/api/files` | GET | 获取文件列表 |
| 10 | `/api/fs/list` | GET | 文件系统目录列表 |
| 11 | `/api/load` | POST | 加载文件内容 |
| 12 | `/api/save` | POST | 保存文件 |
| 13 | `/api/save-export` | POST | 保存导出文件 |
| 14 | `/api/save-session` | POST | 保存编辑会话 |
| 15 | `/api/trash/delete` | POST | 回收站永久删除 |
| 16 | `/api/trash/empty` | POST | 清空回收站 |
| 17 | `/api/trash/files` | GET | 回收站文件列表 |
| 18 | `/api/trash/restore` | POST | 从回收站恢复 |
| 19 | `/api/trash/stats` | GET | 回收站统计信息 |
| 20 | `/api/upload` | POST | 上传文件 |
| 21 | `/api/save-temp` | POST | 保存临时文件 |
| 22 | `/api/load-temp` | POST | 加载临时文件 |
| 23 | `/api/confirm-save` | POST | 临时文件转正 |

> 所有 API 均基于 Next.js Route Handlers，需要 Node.js 服务端环境运行。

---

## 1. GET /api/app

获取应用全局配置和路径信息。

- **方法**: GET
- **请求参数**: 无
- **响应格式**:
```json
{
  "inputPath": "string - Markdown 输入目录",
  "outputPath": "string - HTML 输出目录",
  "dataPath": "string - 数据存储目录",
  "recyclePath": "string - 回收站路径",
  "chdProtocolPath": "string - CHD 协议文件路径",
  "appRoot": "string - 应用根目录",
  "config": { "... 全局配置对象 ..." }
}
```
- **错误响应**: `{ "error": "Failed to get app info" }` (500)

---

## 2. GET /api/app/chd-protocol

获取 CHD 协议 Markdown 文档内容。

- **方法**: GET
- **请求参数**: 无
- **响应格式**: `Content-Type: text/markdown` — 原始 Markdown 文本
- **错误响应**: `# CHD协议读取错误\n...` (文本)
- **内部逻辑**: 按优先级从 3 个可能位置查找文件：
  1. `config.json` 中配置的 `chdProtocolPath`
  2. `docs/核心规划/5_CHD协议与AI生成指南.md`
  3. `portable_ml_package/resources/CHD_protocol.md`

---

## 3. POST /api/clear-export

清空导出目录（删除生成的 .html 和 .json 文件）。

- **方法**: POST
- **请求参数**: 无
- **响应格式**:
```json
{ "count": 42 }
```
- **错误响应**: `{ "error": "Failed to clear export files" }` (500)

---

## 4. GET /api/config — 获取配置<br/>POST /api/config — 更新配置

读写全局配置文件。

- **GET 方法**: 无参数
- **POST 方法**:
  - Body: 完整或部分配置对象
  ```json
  {
    "themes": { ... },
    "renderOptions": { ... }
  }
  ```
- **响应格式**:
```json
{ "success": true, "data": { ... 完整配置 ... } }
```
- **错误响应**: `{ "success": false, "error": "..." }` (400/500)

---

## 5. GET /api/config/capacity — 获取容量限制<br/>POST /api/config/capacity — 更新容量限制

- **GET 方法**: 无参数
- **POST 方法**: Body `{ "limit": 104857600 }` (字节)
- **响应格式**:
```json
{ "success": true, "data": { "limit": 104857600 } }
```

---

## 6. POST /api/dataset

批量数据集操作（备份/恢复/迁移）。

- **方法**: POST
- **请求参数**: Body
```json
{
  "action": "backup | restore | migrate",
  "data": { ... }
}
```
- **响应格式**: `{ "success": true, "data": { ... } }`

---

## 7. POST /api/delete

删除文件（及关联的输出文件）。

- **方法**: POST
- **请求参数**: Body
```json
{
  "slug": "单个文件 slug（与 slugs 二选一）",
  "slugs": ["批量删除列表（与 slug 二选一）"],
  "deleteOutput": true
}
```
- **响应格式**:
```json
// 单个删除
{ "success": true, "message": "File deleted successfully" }

// 批量删除
{ "success": true, "deleted": 3, "errors": [] }
```

---

## 8. POST /api/export

将 Markdown 文件导出为单个 HTML 页面。

- **方法**: POST
- **Body**:
```json
{
  "slug": "文件标识",
  "content": "Markdown 内容",
  "title": "页面标题"
}
```
- **响应格式**: `Content-Type: text/html` — 完整的 HTML 文档

---

## 9. GET /api/files

获取所有 Markdown 文件列表。

- **方法**: GET
- **响应格式**:
```json
[
  {
    "slug": "file-identifier",
    "title": "文件标题",
    "status": "published",
    "updatedAt": "ISO 日期",
    "size": 12345
  }
]
```

---

## 10. GET /api/fs/list

获取文件系统目录列表（Electron 端使用）。

- **方法**: GET
- **Query**: `?path=C:/Users/despe/Documents`
- **响应格式**: `{ "files": [...], "directories": [...] }`
- **⚠️ 注意**: 使用 `request.url`，仅在 Next.js 服务端环境下可用

---

## 11. POST /api/load

加载单个 Markdown 文件内容。

- **方法**: POST
- **Body**: `{ "slug": "file-identifier" }`
- **响应格式**:
```json
{
  "success": true,
  "data": {
    "slug": "file-identifier",
    "content": "Markdown 原文",
    "frontmatter": { ... },
    "status": "published",
    "historyCount": 5
  }
}
```

---

## 12. POST /api/save

保存 Markdown 文件。

- **方法**: POST
- **Body**:
```json
{
  "slug": "file-identifier",
  "content": "Markdown 内容",
  "operations": ["可选的操作列表"]
}
```
- **响应格式**: `{ "success": true, "message": "File saved successfully" }`

---

## 13. POST /api/save-export

保存导出文件到输出目录。

- **方法**: POST
- **Body**: `{ "slug": "...", "html": "<!DOCTYPE html>..." }`
- **响应格式**: `{ "success": true, "path": "/path/to/file.html" }`

---

## 14. POST /api/save-session

保存编辑会话（自动保存/草稿恢复）。

- **方法**: POST
- **Body**: `{ "slug": "...", "content": "...", "timestamp": "..." }`
- **响应格式**: `{ "success": true }`

---

## 15. POST /api/trash/delete

从回收站永久删除文件。

- **方法**: POST
- **Body**: `{ "files": ["file1.md", "file2.md"] }` 或 `{ "emptyAll": true }`
- **响应格式**: `{ "success": 3, "failed": 0, "errors": [] }`
- **⚠️ 注意**: `success` 是数字（成功数量），不是布尔值

---

## 16. POST /api/trash/empty

一键清空回收站。

- **方法**: POST
- **响应格式**: `{ "success": true, "count": 5 }`

---

## 17. GET /api/trash/files

获取回收站文件列表。

- **方法**: GET
- **响应格式**:
```json
[
  {
    "slug": "deleted-file",
    "title": "原标题",
    "deletedAt": "ISO 日期",
    "originalPath": "/path/to/original"
  }
]
```

---

## 18. POST /api/trash/restore

从回收站恢复文件。

- **方法**: POST
- **Body**: `{ "files": ["file1.md"] }`
- **响应格式**: `{ "success": true, "data": { "restored": 1 } }`

---

## 19. GET /api/trash/stats

获取回收站统计信息。

- **方法**: GET
- **响应格式**: `{ "count": 5, "totalSize": 102400 }`

---

## 20. POST /api/upload

上传 Markdown 文件。

- **方法**: POST
- **Content-Type**: `multipart/form-data`
- **字段**: `file` — 文件数据
- **响应格式**: `{ "success": true, "data": { "slug": "...", "filename": "..." } }`

---

## 响应格式约定

### 成功响应（大部分接口）
```json
{
  "success": true,
  "data": { ... }
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误描述"
}
```
HTTP 状态码通常为 400（参数错误）或 500（服务器错误）。

### 特殊格式
- `/api/app/chd-protocol`: 返回 `text/markdown`（非 JSON）
- `/api/export`: 返回 `text/html`（非 JSON）
- `/api/trash/delete`: `success` 是数字（非布尔值）

---

---

## 21. POST /api/save-temp

保存内容到临时目录（用于预览）。

- **方法**: POST
- **Body**:
```json
{
  "slug": "文件标识（不含后缀）",
  "content": "Markdown 内容"
}
```
- **响应格式**:
```json
{
  "success": true,
  "data": {
    "id": "temp-1234567890",
    "fileName": "my-doc_temp_1234567890.md",
    "slug": "my-doc",
    "createdAt": 1234567890
  }
}
```
- **错误响应**: `{ "success": false, "error": "Slug 和 content 是必填项" }` (400)
- **用途**: 前端在打开预览页前，将内容保存到服务端 `temp/` 目录，返回 `fileName` 用于构造预览 URL `/preview/__temp__{fileName}`

---

## 22. POST /api/load-temp

根据 fileName 加载临时文件内容。

- **方法**: POST
- **Body**: `{ "fileName": "my-doc_temp_1234567890.md" }`
- **响应格式**:
```json
{
  "success": true,
  "data": {
    "id": "temp-1234567890",
    "slug": "my-doc",
    "fileName": "my-doc_temp_1234567890.md",
    "content": "... Markdown 内容 ...",
    "createdAt": 1234567890
  }
}
```
- **错误响应**: `{ "success": false, "error": "临时文件不存在" }` (404)
- **用途**: 预览页加载时调用，获取临时文件内容进行渲染

---

## 23. POST /api/confirm-save

将临时文件"转正"为正式文件（写入 input/ 目录），支持重命名。

- **方法**: POST
- **Body**:
```json
{
  "id": "temp-1234567890",
  "slug": "custom-filename（可选，不传则使用原始 slug）"
}
```
- **响应格式**:
```json
{
  "success": true,
  "data": { "slug": "custom-filename" }
}
```
- **错误响应**: `{ "success": false, "error": "临时文件不存在" }` (400)
- **用途**: 预览页中点击"保存为正式文档"后调用。将 `temp/` 目录下的临时文件内容写入 `input/` 目录，并删除临时文件。
- **内部逻辑**: 使用 `MetadataCacheManager.update()` 写入，自动更新缓存和文件列表

---

## 前端服务调用对照

| 服务 | 调用的 API |
|------|-----------|
| `ConfigService` | `/api/config`, `/api/config/capacity`, `/api/app` |
| `FileService` | `/api/files`, `/api/delete`, `/api/save`, `/api/dataset`, `/api/save-export`, `/api/load`, `/api/trash/delete`, `/api/trash/files`, `/api/trash/stats` |
| `TrashService` | `/api/trash/delete`, `/api/trash/empty`, `/api/trash/files`, `/api/trash/restore`, `/api/trash/stats` |
| `ApiClient` | 通用 HTTP 客户端，支持 GET/POST/DELETE，自动解包 `{ success, data }` |