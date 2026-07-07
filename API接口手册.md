# MdToHtml Pro API 接口手册

> 自动生成于 2026-07-07 | 基于 `MdToHtml/src/app/api` 目录分析

---

## 接口总览

| # | 路径 | 方法 | 类型 | 静态导出兼容 |
|---|------|------|------|-------------|
| 1 | `/api/app` | GET | 静态 | ✅ |
| 2 | `/api/app/chd-protocol` | GET | 静态 | ✅ |
| 3 | `/api/app/chd-protocol/icons` | GET | 静态 | ✅ |
| 4 | `/api/clear-export` | POST | 动态 | ❌ (Node.js fs) |
| 5 | `/api/config` | GET/POST | 动态 | ❌ (文件读写) |
| 6 | `/api/config/capacity` | GET/POST | 动态 | ❌ (文件读写) |
| 7 | `/api/dataset` | POST | 动态 | ❌ (文件读写) |
| 8 | `/api/delete` | POST | 动态 | ❌ (文件删除) |
| 9 | `/api/export` | POST | 动态 | ❌ (HTML 导出) |
| 10 | `/api/files` | GET | 静态 | ✅ |
| 11 | `/api/fs/list` | GET | 动态 | ❌ (fs + request.url) |
| 12 | `/api/load` | POST | 动态 | ❌ (文件读取) |
| 13 | `/api/save` | POST | 动态 | ❌ (文件写入) |
| 14 | `/api/save-export` | POST | 动态 | ❌ (文件写入) |
| 15 | `/api/save-session` | POST | 动态 | ❌ (文件写入) |
| 16 | `/api/trash/delete` | POST | 动态 | ❌ (文件删除) |
| 17 | `/api/trash/empty` | POST | 动态 | ❌ (文件操作) |
| 18 | `/api/trash/files` | GET | 静态 | ✅ |
| 19 | `/api/trash/restore` | POST | 动态 | ❌ (文件操作) |
| 20 | `/api/trash/stats` | GET | 静态 | ✅ |
| 21 | `/api/upload` | POST | 动态 | ❌ (文件上传) |

> **注意**：标记为"动态"的接口在纯静态导出模式下不可用，需在 Next.js 服务端环境下运行。

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

## 3. GET /api/app/chd-protocol/icons

获取所有可用图标的列表。

- **方法**: GET
- **请求参数**: 无（客户端自行过滤分类）
- **响应格式**:
```json
{
  "total": 135,
  "categories": ["基础", "文件", "开发", "..."],
  "icons": [
    {
      "name": "zap",
      "label": "闪电",
      "category": "基础",
      "component": "Zap"
    }
  ]
}
```

---

## 4. POST /api/clear-export

清空导出目录（删除生成的 .html 和 .json 文件）。

- **方法**: POST
- **请求参数**: 无
- **响应格式**:
```json
{ "count": 42 }
```
- **错误响应**: `{ "error": "Failed to clear export files" }` (500)

---

## 5. GET /api/config — 获取配置<br/>POST /api/config — 更新配置

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

## 6. GET /api/config/capacity — 获取容量限制<br/>POST /api/config/capacity — 更新容量限制

- **GET 方法**: 无参数
- **POST 方法**: Body `{ "limit": 104857600 }` (字节)
- **响应格式**:
```json
{ "success": true, "data": { "limit": 104857600 } }
```

---

## 7. POST /api/dataset

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

## 8. POST /api/delete

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

## 9. POST /api/export

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

## 10. GET /api/files

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

## 11. GET /api/fs/list

获取文件系统目录列表（Electron 端使用）。

- **方法**: GET
- **Query**: `?path=C:/Users/despe/Documents`
- **响应格式**: `{ "files": [...], "directories": [...] }`
- **⚠️ 注意**: 使用 `request.url`，静态导出模式下不可用

---

## 12. POST /api/load

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

## 13. POST /api/save

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

## 14. POST /api/save-export

保存导出文件到输出目录。

- **方法**: POST
- **Body**: `{ "slug": "...", "html": "<!DOCTYPE html>..." }`
- **响应格式**: `{ "success": true, "path": "/path/to/file.html" }`

---

## 15. POST /api/save-session

保存编辑会话（自动保存/草稿恢复）。

- **方法**: POST
- **Body**: `{ "slug": "...", "content": "...", "timestamp": "..." }`
- **响应格式**: `{ "success": true }`

---

## 16. POST /api/trash/delete

从回收站永久删除文件。

- **方法**: POST
- **Body**: `{ "files": ["file1.md", "file2.md"] }` 或 `{ "emptyAll": true }`
- **响应格式**: `{ "success": 3, "failed": 0, "errors": [] }`
- **⚠️ 注意**: `success` 是数字（成功数量），不是布尔值

---

## 17. POST /api/trash/empty

一键清空回收站。

- **方法**: POST
- **响应格式**: `{ "success": true, "count": 5 }`

---

## 18. GET /api/trash/files

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

## 19. POST /api/trash/restore

从回收站恢复文件。

- **方法**: POST
- **Body**: `{ "files": ["file1.md"] }`
- **响应格式**: `{ "success": true, "data": { "restored": 1 } }`

---

## 20. GET /api/trash/stats

获取回收站统计信息。

- **方法**: GET
- **响应格式**: `{ "count": 5, "totalSize": 102400 }`

---

## 21. POST /api/upload

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

## 前端服务调用对照

| 服务 | 调用的 API |
|------|-----------|
| `ConfigService` | `/api/config`, `/api/config/capacity`, `/api/app` |
| `FileService` | `/api/files`, `/api/delete`, `/api/save`, `/api/dataset`, `/api/save-export`, `/api/load`, `/api/trash/delete`, `/api/trash/files`, `/api/trash/stats` |
| `TrashService` | `/api/trash/delete`, `/api/trash/empty`, `/api/trash/files`, `/api/trash/restore`, `/api/trash/stats` |
| `ApiClient` | 通用 HTTP 客户端，支持 GET/POST/DELETE，自动解包 `{ success, data }` |