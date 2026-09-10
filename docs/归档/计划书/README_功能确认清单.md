# 操作引擎 — 功能确认清单

> 每条后面写 **"要"** / **"不要"** / **"改一下"**，我按你说的保留/删除/修改对应计划。

---

## 核心概念：要不要"操作引擎"这个抽象层？

**操作引擎** = 把编辑器里每一次变更都记录为结构化的 `Operation` 对象（包含类型、位置、变更内容），而不是存整篇文档的快照。

| 当前做法 | 操作引擎做法 |
|---------|------------|
| `past: ["完整文档A", "完整文档B"]` | `undoStack: [{type:"INSERT_TEXT",pos:120,...}]` |

> **如果不要**，后面的所有功能都不需要，只保留原来的计划03（持久化+防抖）就够了。

---

## ① 类型系统（基础定义）

| 函数/组件 | 说明 |
|----------|------|
| `OperationType` 枚举 | INSERT_TEXT、DELETE_TEXT、AI_POLISH 等类型 |
| `Operation` 接口 | 操作的数据结构 |
| `invert(op)` 函数 | 生成逆操作（撤销用） |
| `validateOperation(op)` 函数 | 检查操作合法性 |
| `OperationBuilder.textInsert()` 工厂 | 快速创建插入操作 |
| `OperationBuilder.aiOperation()` 工厂 | 快速创建 AI 操作 |

---

## ② 撤销引擎改造

| 函数/组件 | 说明 |
|----------|------|
| `undoStack: Operation[]` | 内部从 string[] 改为 Operation[] |
| `pushOperation(op)` | 新增接口：推入 Operation |
| `undo()` | 内部执行逆操作，对外接口不变 |
| `redo()` | 内部重放操作，对外接口不变 |
| `pushState(content)` | 旧接口保留，内部自动转 Operation |
| 编辑器监听→Operation | CodeMirror onChange 自动生成 Operation |

---

## ③ 持久化 + 防抖

| 函数/组件 | 说明 |
|----------|------|
| localStorage 持久化 | 刷新后历史不丢 |
| 300ms 防抖 | 快速输入只记一条 |
| 50 步上限 | 历史栈不膨胀 |

---

## ④ AI 上下文控制

| 函数/组件 | 说明 |
|----------|------|
| `buildContext()` 函数 | 按操作类型决定传多少上下文字数 |

---

## ⑤ AI 内联编辑（UI 交互）

| 函数/组件 | 说明 |
|----------|------|
| `AIInlineToolbar` 组件 | 浮动工具栏：4个按钮 + **≤20字指令输入框** |
| `AIInlineResultDialog` 组件 | 建议替换弹窗（原文/AI建议对比） |
| 简短指令 → 拼入 Prompt | ≤20字指令自动追加到 AI prompt 末尾 |
| AI操作→Operation | 确认替换后自动生成 Operation |

> **新增**：用户选中文案后，除了点四个按钮，还可以输入 ≤20 字的说明（如"加个例子"、"强调结论"、"写具体"），AI 按指示做。

---

## ⑥ 手动暂存点

| 函数/组件 | 说明 |
|----------|------|
| `useCheckpoint()` hook | 打点保存当前版本 |
| `📍 暂存` 按钮 UI | 编辑器上一个按钮，点一下就存 |
| 暂存点列表 | 显示所有暂存点，点击跳回 |

---

## ⑦ 拓展其他生产者

| 函数/组件 | 说明 |
|----------|------|
| 卡片样式→CARD_STYLE_CHANGE | 修改卡片样式时生成 Operation |
| 拖拽排序→CARD_MOVE | 拖拽改变顺序时生成 Operation |

---

## 设计模式关注

操作引擎的核心逻辑天然适配 **策略模式（Strategy Pattern）**：

```
每种操作类型（INSERT/DELETE/AI_POLISH/CARD_MOVE 等）= 一个具体策略
撤销引擎（UndoRedoEngine） = 上下文（Context）
扩展新操作类型 = 新增策略类，无需修改上下文
```

其他考虑的架构模式：
- **命令模式（Command Pattern）**：Operation 本身就是 Command 对象，附带 execute()/undo() 语义
- **观察者模式（Observer Pattern）**：撤销引擎状态变化通知 UI（历史面板/暂存点列表）
- **职责链模式（Chain of Responsibility）**：防抖合并器作为职责链，将多个小操作合并为 BATCH

> 这些模式在相应的计划文档中已经有体现，需要我在哪个计划里展开分析？