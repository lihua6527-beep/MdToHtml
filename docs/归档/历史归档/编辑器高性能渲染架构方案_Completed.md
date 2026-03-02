# 编辑器高性能渲染架构方案 (Editor Performance Architecture)

> **目标**: 实现编辑器输入与页面渲染的架构分离，确保在处理长文档时依然保持极致的输入流畅度 (High Efficiency Rendering)。

## 1. 背景与痛点 (Background & Pain Points)

当前编辑器采用 **"强耦合单向数据流"** 架构：
`Editor Input` -> `State Update` -> `Markdown Parsing` -> `React Re-render`

**痛点**:
1.  **输入阻塞 (Input Blocking)**: 用户每次击键都会触发全链路的解析与重绘。如果文档较长（如 >50 张卡片），解析+渲染耗时超过 16ms (60fps)，会导致输入明显的卡顿。
2.  **资源争抢 (Resource Contention)**: 编辑器逻辑（CodeMirror/Monaco）与渲染逻辑（React Components）运行在同一个主线程上，互抢 CPU 资源。

## 2. 核心架构升级：分离渲染模型 (Separated Rendering Model)

为了实现“更高效”的渲染策略，我们将采用 **"输入-输出分离" (Input-Output Separation)** 架构。

### 2.1 架构对比

| 维度 | 当前架构 (Coupled) | 目标架构 (Decoupled) |
| :--- | :--- | :--- |
| **数据流** | 同步 (Sync) | 异步 (Async) |
| **线程模型** | 单主线程 | 主线程 (UI) + Worker (Parser) |
| **更新频率** | 每次击键 (Per Keystroke) | 防抖/节流 (Debounced) |
| **输入体验** | 随文档变长而下降 | 恒定流畅 (O(1)) |

### 2.2 详细设计方案

#### A. 异步防抖管道 (Async Debounce Pipeline)
建立一个缓冲层，将高频的输入事件转换为低频的渲染更新。

```mermaid
graph LR
    User[用户输入] --> Editor[编辑器组件]
    Editor -- 实时 (0ms) --> LocalState[本地 UI 状态]
    LocalState -- 防抖 (300ms) --> SyncEngine[同步引擎]
    SyncEngine --> Parser[解析器]
    Parser --> Renderer[渲染器]
```

*   **输入层**: 仅更新编辑器自身的 View Model，确保光标移动和文字上屏零延迟。
*   **缓冲层**: 使用 `useDebounce` 或 `RxJS` 控制向下游发送更新的频率。
*   **渲染层**: 接收到更新后的 Markdown 快照，进行 Diff 和 Patch。

#### B. Web Worker 解析 (Off-Main-Thread Parsing)
将耗时的 Markdown 解析（AST 生成、Frontmatter 解析）移出主线程。

*   **Worker**: 负责运行 `matter-js` 和 CHD 协议解析逻辑，返回纯 JSON 结构的 IR (Intermediate Representation)。
*   **Main Thread**: 仅负责根据 IR 更新 React 组件树。

#### C. 独立滚动与视口渲染 (Independent Scrolling & Virtualization)
*   **滚动同步**: 采用基于百分比或锚点的“松散同步”，而非像素级强制同步，避免滚动时的抖动。
*   **虚拟列表**: 对于预览区域，仅渲染视口可见范围内的 Section/Card，极大降低 DOM 节点数量。

## 3. 实施路线图 (Implementation Roadmap)

### Phase 1: 软分离 (Soft Separation) - Quick Win
*   [ ] **状态解耦**: 将 `Editor` 组件的输入状态 (`value`) 与全局 `App` 的存储状态 (`content`) 分离。
*   [ ] **防抖机制**: 引入 `lodash.debounce`，设置 300ms~500ms 的渲染延迟。
*   [ ] **Loading 状态**: 在渲染滞后时，在 Preview 区域右上角显示微小的 "Syncing..." 状态指示器。

### Phase 2: 硬分离 (Hard Separation) - Worker Integration
*   [ ] **Worker 封装**: 创建 `parser.worker.ts`，将 `parseCHDBlocks` 逻辑迁移至 Worker。
*   [ ] **消息通信**: 建立主线程与 Worker 的 `postMessage` 通信机制。
*   [ ] **错误边界**: 处理 Worker 解析失败的情况，确保编辑器不会崩溃。

### Phase 3: 渲染优化 (Rendering Optimization)
*   [ ] **React Memoization**: 对 `Section` 和 `Card` 组件进行深度 `React.memo` 优化，确保只有属性变化的组件才会重绘。
*   [ ] **增量更新**: 探索基于 AST 的增量解析（仅重新解析修改过的 Section），而非全文重算。

## 4. 预期收益 (Expected Outcome)

*   **输入延迟**: < 5ms (与文档长度无关)。
*   **渲染帧率**: 保持 60fps，即使在拥有 100+ 卡片的文档中。
*   **能耗**: 降低 CPU 占用率，减少风扇噪音。

---
**状态**: 规划中
**最后更新**: 2026-02-24
