# Plan 03: useHistory 撤销/重做系统持久化与防抖优化

> **注意（2026-07-12 更新）**：本计划作为操作引擎子计划，保留原编号 03。内容聚焦于 useHistory 的持久化、防抖、深度限制等**原生存活机制**。操作类型化改造（`string[]` → `Operation[]`）已移至**计划02（撤销引擎架构改造）**处理。本计划与计划02配合使用时，将持久化/防抖/限深机制应用于 `Operation[]` 而非 `string[]`。
> **注意**：下方的 Step 4「添加操作类型元信息」已被计划01（操作类型系统设计）的完整 Operation 接口取代。保留此节仅作为历史参考。

> **简要说明**：优化 `hooks/useHistory.ts` 撤销/重做系统，解决刷新后历史丢失、无防抖导致历史栈膨胀、以及纯文本存储无法精细回滚的问题。将撤销系统从"可用"升级为"可靠"。

---

## 1. 现状分析

### 1.1 当前实现

`MdToHtml/src/hooks/useHistory.ts` 是一个提供撤销/重做功能的 React Hook，核心数据结构为：

```typescript
interface HistoryState {
  past: string[];    // 过去状态栈（纯字符串数组）
  future: string[];  // 未来状态栈（撤销后可以重做）
}

// 核心 API：
pushState(newContent)  // 压入新状态
undo() -> string | null      // 撤销 → 返回历史状态
redo() -> string | null      // 重做 → 返回未来状态
canUndo: boolean
canRedo: boolean
```

### 1.2 存在的核心问题

| 问题 | 严重程度 | 详细说明 |
|------|---------|---------|
| **刷新后历史全部丢失** | 🔴 严重 | `past[]` 和 `future[]` 全部存储在 React state 中，用户不小心刷新页面后，所有撤销能力归零。编辑器长时间编辑后刷新 → 无法撤销 |
| **无防抖/节流机制** | 🟡 中等 | 快速输入时每次按键（每几十毫秒）都触发 `pushState`，5 秒连续输入可能产生 50+ 条历史记录。`Ctrl+Z` 需要按几十次才能回到有意义的版本 |
| **无历史深度限制** | 🟡 中等 | 历史栈无上限，长时间编辑可能导致内存占用持续增长 |
| **只存储裸文本字符串** | 🟢 轻微 | 不存储结构化操作信息，无法实现"回滚某个属性修改"的精细操作 |

### 1.3 影响范围

`useHistory` 在编辑器中通过 `useMarkdownInteraction` 间接使用，所有编辑操作（输入文字、修改属性、移动卡片、增删卡片）都会产生历史记录。

---

## 2. 设计方案

### 2.1 总体方案：四层加固

```
持久化层    →  localStorage 定期快照
防抖层      →  300ms 间隔合并编辑
限深层      →  50 步上限 + LRU 裁剪
结构化层   →  记录操作类型（可选，降级方案）
```

### 2.2 具体改造

#### Step 1: 添加 localStorage 持久化

```typescript
const HISTORY_KEY = 'chd_editor_history';
const MAX_HISTORY_DEPTH = 50;

function HistoryProvider({ children }) {
  // 初始化时从 localStorage 恢复
  const [past, setPast] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // 每次 past 变化时持久化（使用 write 防抖）
  const persistHistory = useDebounce((history: string[]) => {
    // 只保存最近 MAX_HISTORY_DEPTH 条
    const trimmed = history.slice(-MAX_HISTORY_DEPTH);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  }, 1000);
  
  useEffect(() => {
    persistHistory(past);
  }, [past]);
}
```

**存储策略**：只持久化 `past[]`（撤销栈），不持久化 `future[]`（重做栈在刷新后无条件清空是合理的 UX 行为——用户通常不会预期刷新后还能重做）。

#### Step 2: 添加防抖合并机制

```typescript
// 核心变更：pushState 改为含防抖的版本
const pushState = useMemo(() => {
  let lastPushTime = 0;
  let pendingState: string | null = null;
  let flushTimer: NodeJS.Timeout | null = null;
  
  return (newContent: string) => {
    const now = Date.now();
    
    if (now - lastPushTime < 300) {
      // 300ms 内的连续编辑 → 只记录最新状态，不生成新条目
      pendingState = newContent;
      return;
    }
    
    if (pendingState !== null) {
      // 如果之前有防抖待处理的，先压入
      setPast(prev => [...prev, pendingState]);
      pendingState = null;
    }
    
    // 正常压入（距离上次超过 300ms）
    setPast(prev => [...prev, newContent]);
    setFuture([]); // 新编辑清空重做栈
    lastPushTime = now;
  };
}, []);
```

**效果**：用户在 300ms 内连续输入 "Hello World" 的 11 个字符只产生 1 条历史记录，而不是 11 条。

#### Step 3: 添加历史深度上限

```typescript
// 在每次 setPast 时应用裁剪
const pushState = (content: string) => {
  setPast(prev => {
    const next = [...prev, content];
    // 超过上限时丢弃最早的历史
    return next.length > MAX_HISTORY_DEPTH 
      ? next.slice(next.length - MAX_HISTORY_DEPTH) 
      : next;
  });
};

// 同时更新 undo() 和 redo() 来应用同一上限
```

#### Step 4: 添加操作类型元信息（可选增强）

```typescript
// 扩展历史记录的定义
interface HistoryEntry {
  content: string;        // 完整文档内容
  operation?: {           // 操作描述（可选，用于展示）
    type: 'edit' | 'attribute' | 'card-add' | 'card-delete' | 'card-move';
    description: string;  // 人类可读的描述
    timestamp: number;
  };
}

// 在 UI 上展示历史变更概览
const HistoryTimeline: React.FC<{ past: HistoryEntry[] }> = ({ past }) => {
  return (
    <div className="history-timeline">
      {past.slice(-10).reverse().map((entry, i) => (
        <div key={i} className="text-xs text-text-secondary">
          {entry.operation?.description || '内容编辑'}
        </div>
      ))}
    </div>
  );
};
```

### 2.3 兼容性设计

- 保持 `useHistory` 的导出接口完全不变
- 所有新增功能通过内部优化实现，调用方无需修改
- 存储的 key `chd_editor_history` 与 `useAutoSave` 的 key `chd_md_content` 不同，不会冲突
- 版本兼容：未来如果修改数据结构，增加版本字段 `chd_editor_history_v2` 无缝迁移

---

## 3. 测试策略

| 测试场景 | 操作 | 预期 |
|---------|------|------|
| 快速输入撤销 | 以 <300ms 间隔输入 "abc" | 1 次撤销回到初始状态 |
| 慢速输入撤销 | 以 >500ms 间隔输入 "a"、"b"、"c" | 3 次撤销逐级返回 |
| 刷新后恢复 | 编辑 10 步 → 刷新页面 → 按 Ctrl+Z | 可以逐步撤销到编辑前的状态 |
| 深度上限 | 连续 push 60 次 | 只保留最近的 50 条 |
| 空历史撤销 | 未编辑时按 Ctrl+Z | 无任何反应，无崩溃 |
| 跨标签持久化 | 标签 A 编辑 → 标签 B 打开同一文档 | 两标签历史独立（符合预期） |

---

## 4. 实施计划

| 步骤 | 内容 | 预估工时 | 依赖 |
|------|------|---------|------|
| 1 | 实现 localStorage 持久化初始化 | 1h | - |
| 2 | 实现 history 状态变化时的自动保存 | 0.5h | 步骤 1 |
| 3 | 实现防抖合并的 pushState | 1.5h | - |
| 4 | 实现历史深度上限（MAX_HISTORY_DEPTH） | 0.5h | - |
| 5 | 添加操作元信息类型（可选） | 1h | - |
| 6 | 手动测试所有场景 | 1h | 步骤 2-5 |
| 7 | 更新 API 接口手册（如有接口变更） | 0.5h | - |
| **总计** | | **约 6h** | |

---

## 5. 验收标准

- [ ] 刷新页面后撤销历史仍然可用
- [ ] 快速输入时每 300ms 窗口内只产生 1 条历史记录
- [ ] 历史栈上限为 50 条，不随编辑时间无限增长
- [ ] `useHistory` 的导出 API 完全向后兼容
- [ ] `Ctrl+Z` / `Ctrl+Shift+Z` 在编辑器中的行为直观可预期
- [ ] 持久化不影响到首页、预览页等其他页面