# 下一阶段实施计划：AI 内联编辑（Plan 04 + 05 完善）

> **生成日期**：2026-07-26  
> **依据**：2026-07-25 Phase0+Phase1 已完成，Plan 04/05 骨架已搭建  
> **状态**：骨架已完成，待迭代优化

---

## 一、已完成的前置工作

| 阶段 | 已交付 | 文件 |
|------|--------|------|
| Phase 0 | 操作类型系统(14种) + 工厂 + 27个测试 | `operation.ts`, `OperationBuilder.ts`, `operation.test.ts` |
| Phase 0 | E2E 选择器修复 + 预存测试类型修复 | `Card.tsx`, `editor-workflow.spec.ts` |
| Phase 1 | 操作级撤销/重做引擎 | `useHistory.ts` |
| Phase 1 | 暂存点引擎 + UI | `CheckpointPanel.tsx`, `FloatingUndoRedo.tsx` |
| Plan 04+05 启动 | AI 上下文构建器（Prompt模板+Token估算+层级选择） | `AIContextBuilder.ts` |
| Plan 04+05 启动 | 浮动工具栏（选中≥10字符弹出，4按钮+自定义指令） | `AIInlineToolbar.tsx` |
| Plan 04+05 启动 | MarkdownEditor 暴露选中文本接口 | `MarkdownEditor.tsx` (getSelection/replaceSelection) |

---

## 二、当前实施状态与质量评估

> ⚠️ **核心结论**：基础框架已全部搭建完毕，但提示词质量、操作界面反馈、内容正确性均有待提升。

### 2.1 已完成项（2026-07-26 实施）

| 实施项 | 文件 | 状态 |
|--------|------|------|
| 结果对比弹窗（左右并排原文/AI结果） | `AIInlineResultDialog.tsx` | ✅ 完成 |
| InteractivePost.tsx 集成 | `InteractivePost.tsx` | ✅ 完成 |
| 编辑器集成（editor页面） | 旧版 `editor/page.tsx` 已删除 | ✅ 完成 |

### 2.2 已知不足与待优化项

#### ① 提示词质量（Prompt 工程）
- **现状**：`handleAIAction` 中的 5 种操作（润色/扩充/总结/转卡片/自定义）仅使用了最基础的中文指令模板，例如 `请润色以下文本，修正语法和表达：\n\n${selectedText}`
- **问题**：缺乏场景化、角色化、格式化的 Prompt 设计，AI 输出质量不稳定
- **建议改进**：
  - 引入 `PromptEngine`（已有骨架 `AIContextBuilder.ts`）生成结构化的 system prompt + user prompt
  - 针对不同操作类型设计角色（如"你是专业的学术写作助手"、"你是文档排版专家"）
  - 输出格式约束（如"请用 CHD 卡片格式返回"）

#### ② 操作界面反馈
- **现状**：
  - 选中检测已从 `setInterval(300ms)` 改为 `mouseup` 事件，但仍存在 50ms 延迟
  - 点击工具栏外部关闭功能存在异步注册问题（`setTimeout` 包裹 `addEventListener`）
  - 卡片右键菜单的"AI 润色"通过 `CustomEvent` 桥接，没有直接的 props 传递
- **问题**：用户对"什么时候AI开始工作"、"处理进度如何"感知不足
- **建议改进**：
  - 添加 Toast/Notification 反馈"AI 正在处理..."
  - 替换关闭机制为更稳定的 `useEffect` 清理模式
  - 将 `ai-context-card` 自定义事件改为直接的回调 props（更符合 React 数据流）

#### ③ 内容正确性
- **现状**：
  - AI 返回结果直接展示为文本，未做格式校验
  - 替换逻辑依赖 `content.indexOf(selectedText)` 查找位置——如果原文有多处相同文本会匹配第一个，可能不是用户预期的位置
  - AI 服务 API 调用使用 `'deepseek-chat'` 硬编码，无 fallback 机制
- **问题**：替换位置不准确、AI 输出可能破坏文档结构
- **建议改进**：
  - 使用选中范围的位置信息（range 的 start/end offset）而非文本查找
  - AI 输出前做 CHD 格式校验
  - 支持多模型 fallback（如 deepseek-chat → deepseek-reasoner → 本地模型）

#### ④ UI/UX 统一性
- **现状**：AI 工具栏、结果弹窗使用独立样式（白色底、蓝色按钮），与系统组件库（shadcn/ui）风格不一致
- **建议改进**：统一使用 `@/components/ui/dialog.tsx` 等既有组件，复用系统主题

---

## 三、剩余实施项（框架层已完成）

> 基础框架已全部完成，以下为二次迭代优化内容。

### 3.1 Prompt 工程优化（预计 2h）
- [ ] 设计场景化 System Prompt（学术/技术/通用 3 套）
- [ ] 设计输出格式约束（JSON Schema / CHD 格式校验）
- [ ] 集成 `AIContextBuilder.ts` 中的 Token 估算与层级选择

### 3.2 交互反馈优化（预计 1.5h）
- [ ] 添加 Toast 加载状态反馈
- [ ] 修复 Toolbar 点击外部关闭逻辑（移除 `setTimeout` 方式）
- [ ] 将 `ai-context-card` 自定义事件改为 props 回调
- [ ] 合并 AI 工具栏样式与系统主题

### 3.3 内容正确性优化（预计 2h）
- [ ] 使用 DOM Range 的 offset 信息替换 `indexOf` 文本查找
- [ ] AI 输出格式校验
- [ ] 多模型 fallback 支持

### 3.4 撤销引擎深度集成（预计 1h）
- [ ] 将 `OperationBuilder.aiOperation()` 与 `useHistory.pushState` 打通
- [ ] diff 对比可视化（替换前/后高亮）

---

## 四、实施顺序（二次迭代）

```
Phase A: Prompt 工程优化（2h）
  → 设计 3 套 scenario-based system prompt
  → 集成 AIContextBuilder

Phase B: 交互反馈优化（1.5h）
  → Toast + 加载态 + 关闭逻辑修复

Phase C: 内容正确性优化（2h）
  → Range offset 替换 + 格式校验 + 多模型 fallback

Phase D: 撤销引擎深度集成（1h）
  → pushOperation 打通 + diff 可视化
```

---

## 五、验收标准

### 当前已达标
- [x] 选中 ≥10 字符时，浮动工具栏出现在选中区域上方
- [x] 点击"润色" / "扩充" / "总结" / "转卡片" 触发 AI 调用
- [x] 自定义指令输入框可用（≤50字）
- [x] AI 加载时按钮禁用，显示加载状态
- [x] 结果弹窗左右对比显示原文/AI结果
- [x] 点击"替换"后，选中文本被替换为 AI 结果
- [x] Ctrl+Z 可撤销 AI 替换
- [x] 编译零错误

### 待优化
- [ ] 场景化 System Prompt（提升输出质量）
- [ ] Toast 加载反馈（提升操作感知）
- [ ] Range offset 替换（提升位置准确度）
- [ ] 多模型 fallback（提升可用性）
- [ ] 样式统一化（提升 UI 一致性）