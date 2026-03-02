# P3_功能-撤回重做机制设计 (Undo/Redo Mechanism)

> **版本**: v1.0
> **状态**: Draft
> **优先级**: P0 (最高)

## 1. 需求分析 (Requirements)

用户需要一个可靠的撤回/重做功能，以防止编辑过程中的误操作。核心要求如下：
1.  **粒度**: 基于 **卡片变化 (Card Change)** 或 **内容变化**，而非简单的字符级输入。
2.  **持久化**: 操作历史需存储在 **临时 JSON 文件** 中，而非仅存在于内存。
3.  **交互**: 支持标准快捷键 (Ctrl+Z / Ctrl+Y) 及界面按钮。

## 2. 技术方案 (Technical Architecture)

采用 **备忘录模式 (Memento Pattern)** 结合 **文件持久化**。

### 2.1 数据结构 (Data Structure)

在前端维护一个历史状态对象 `HistoryState`：

```typescript
interface HistoryState {
  past: string[];    // 过去的状态栈 (Markdown Snapshots)
  present: string;   // 当前状态 (Current Markdown)
  future: string[];  // 未来的状态栈 (用于 Redo)
}
```

*注：虽然用户提到“卡片粒度”，但在基于 Markdown 的编辑器中，存储完整的 Markdown 字符串快照是最健壮且易于实现的方案。我们会通过**防抖 (Debounce)** 和 **Diff 检测** 来确保只有实质性的变化才会被推入栈中，从而模拟“操作级”的粒度。*

### 2.2 持久化机制 (Persistence Strategy)

利用 Electron 的文件能力或后端 API，将历史栈同步到临时目录。

1.  **存储位置**: `os.tmpdir() / MdToHtml / history / {sessionId}.json`
2.  **触发时机**: 
    - 当 `present` 状态发生变化，且经过防抖时间（如 500ms）后。
    - 用户手动保存时。
3.  **JSON 格式**:
    ```json
    {
      "sessionId": "uuid-v4",
      "timestamp": 1700000000,
      "stack": {
        "past": ["..."],
        "future": ["..."]
      }
    }
    ```

### 2.3 交互流程 (Workflow)

1.  **初始化**: 
    - 应用启动或打开文件时，生成新的 `sessionId`。
    - 初始化 `past = []`, `present = initialContent`, `future = []`。
2.  **用户编辑**:
    - 用户修改内容 -> 触发 `onChange`。
    - **防抖函数** 运行：
      - 将旧的 `present` 推入 `past`。
      - 更新 `present` 为新内容。
      - 清空 `future`。
      - 调用 API 写入临时 JSON。
3.  **执行撤回 (Undo)**:
    - 检查 `past` 是否为空。
    - 将 `present` 移入 `future`。
    - 从 `past` 弹出最后一个状态作为新的 `present`。
    - 调用 API 更新临时 JSON。
4.  **执行重做 (Redo)**:
    - 检查 `future` 是否为空。
    - 将 `present` 移入 `past`。
    - 从 `future` 弹出第一个状态作为新的 `present`。
    - 调用 API 更新临时 JSON。

## 3. 实施步骤 (Implementation Steps)

### Phase 1: 后端 API (Electron/Express)
- [ ] 添加 `POST /api/history` 接口：接收前端的 History 对象并写入临时文件。
- [ ] 添加 `GET /api/history` 接口：(可选) 读取历史记录。

### Phase 2: 前端 Hook (React)
- [ ] 创建 `useHistory` Hook。
  - 实现 `undo`, `redo`, `pushState` 逻辑。
  - 集成 `lodash.debounce` 进行自动保存。
  - 监听快捷键 (Ctrl+Z/Y)。

### Phase 3: 集成与测试
- [ ] 在 `InteractivePost` 或 `MarkdownEditor` 中集成 `useHistory`。
- [ ] 验证：
  - 连续输入是否合并为一次记录（防抖效果）。
  - 撤回是否准确恢复。
  - 查看临时文件夹，确认 JSON 文件生成。

## 4. 异常处理
- **文件写入失败**: 降级为仅内存模式，并在控制台警告，不打断用户操作。
- **文件过大**: 限制栈的最大长度（如 50 步），超过则丢弃最早的记录。
