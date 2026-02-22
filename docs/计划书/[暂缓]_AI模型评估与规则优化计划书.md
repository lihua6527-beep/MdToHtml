# AI 数据支持方案

## 1. 需求分析
当前系统在保存文档时，仅记录了最终的 Markdown 内容 (`input`) 和解析后的 CHD Blocks (`output`)。这种数据格式适用于训练 "Markdown -> 结构化数据" 的解析模型，但无法支持 "内容润色"、"纠错" 或 "风格迁移" 等编辑类任务的 AI 训练。

为了支持更广泛的 AI 辅助写作场景，我们需要捕获用户的 **修改行为**，即记录 **修改前 (Original)** 和 **修改后 (Modified)** 的内容对。

## 2. 数据形式分析
针对 AI 训练（特别是 LLM 微调），最佳的数据形式取决于目标任务：

1.  **解析任务 (Parsing)**: `Input: Markdown` -> `Output: JSON/Blocks` (现有支持)
2.  **编辑任务 (Editing)**: `Input: Original Markdown` -> `Output: Modified Markdown` (本方案目标)
3.  **生成任务 (Generation)**: `Input: Prompt/Title` -> `Output: Markdown`

**结论**: 采用 **(Original, Modified)** 配对的形式最便于分析和训练。单纯记录 Diff (差异) 虽然节省空间，但丢失了上下文，不利于直接训练端到端的生成模型。我们应完整记录修改前后的内容，Diff 可作为辅助特征在后期处理中生成。

## 3. 技术实现方案

### 3.1 前端改造 (`src/app/editor/page.tsx`)
- **状态管理**: 新增 `lastSavedContent` 状态，用于记录上一次保存（或初始加载）时的内容。
- **保存逻辑**:
    - 在用户点击保存时，将 `lastSavedContent` (作为 `previous_content`) 和当前 `content` (作为 `current_content`) 一并发送给后端。
    - 保存成功后，更新 `lastSavedContent` 为当前 `content`。

### 3.2 后端改造 (`src/app/api/dataset/route.ts`)
- **接口定义**: 扩展 POST 请求体，支持接收 `previous_content` 和 `current_content`。
- **数据存储**:
    - 在 `data/training_dataset.jsonl` 中存储新的数据结构：
      ```json
      {
        "task_type": "edit",
        "timestamp": "ISO_DATE",
        "input": "previous_content",
        "output": "current_content",
        "metadata": {
          "slug": "filename",
          "diff_size": 123 // 可选：修改字符数
        }
      }
      ```
    - 保留原有的解析任务数据记录（可选，或作为另一种 `task_type`）。

## 4. 预期效果
- 每次用户保存文档，系统将自动积累一组高质量的 "修改对" 数据。
- 这些数据可用于训练 AI 学习用户的写作风格、纠错习惯和排版偏好。
