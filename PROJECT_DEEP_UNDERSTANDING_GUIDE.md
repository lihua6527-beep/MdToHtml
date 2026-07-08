# CHD Renderer 项目深度理解指南

> **核心目标**：当你提出关于此工程的任何问题时，本指南确保回答的颗粒度达到"变量级"——即明确指出**哪个组件的哪个变量、通过哪个函数、与哪个组件通信、完整的数据流路径是什么**，而非泛泛而谈。

---

## 目录

1. [项目总体架构](#1-项目总体架构)
2. [组件通讯网络](#2-组件通讯网络)
3. [数据流核心链路](#3-数据流核心链路)
4. [状态管理详解](#4-状态管理详解)
5. [Markdown 编辑与渲染联动](#5-markdown-编辑与渲染联动)
6. [CHD Markdown 解析引擎](#6-chd-markdown-解析引擎)
7. [文件系统服务层](#7-文件系统服务层)
8. [回收站与容量管理](#8-回收站与容量管理)
9. [事务管理与错误处理](#9-事务管理与错误处理)
10. [界面交互机制](#10-界面交互机制)

---

## 1. 项目总体架构

### 1.1 技术栈
- **框架**：Next.js 14 (`app/` 目录路由)
- **UI 构建**：React 18 函数组件 + TypeScript
- **数据获取**：SWR (`useSWR`) + `mutate` 缓存管理
- **编辑器**：CodeMirror 6
- **样式**：Tailwind CSS + `clsx`
- **Markdown 解析**：gray-matter (frontmatter) + 自定义 `parseCHDBlocks()`
- **状态管理**：React Hooks（无 Redux/Zustand，纯 hooks 链）

### 1.2 目录结构与职责

```
src/
├── app/                    # Next.js 路由页面
│   ├── page.tsx            # 首页 (HomePage) → 服务端组件
│   ├── editor/page.tsx     # 编辑器页面 → 客户端组件
│   ├── preview/page.tsx    # 预览页面 → 客户端组件
│   └── api/                # API 路由 (Next.js API Routes)
├── components/             # 视图层组件
│   ├── HomeClient.tsx      # 首页客户端逻辑（文件拖拽上传）
│   ├── DocumentList.tsx    # 左侧文档列表（sidebar）
│   ├── CHD/                # CHD 渲染组件族
│   │   ├── CHDRenderer.tsx # 核心渲染引擎
│   │   ├── Section.tsx     # 分区（Section）渲染
│   │   ├── Card.tsx        # 卡片（Card）渲染
│   │   └── BottomToolbar.tsx # 底部工具栏（属性编辑器）
│   └── ui/                 # 通用 UI 组件
├── hooks/                  # 所有自定义 Hooks（纯逻辑层）
│   ├── useFileSystem.ts    # SWR 数据获取（文件列表/容量/回收站）
│   ├── useDocumentState.ts # 文档编辑的核心状态聚合器
│   ├── useMarkdownInteraction.ts # Markdown 字符串操作引擎
│   ├── useCHDSelection.ts  # 光标位置 → 区块选择推导
│   ├── useHistory.ts       # 通用 Undo/Redo 历史栈
│   ├── useScoring.ts       # 文档评分引擎
│   └── useDebounce.ts      # 防抖工具
├── services/               # 服务层（API 调用封装）
│   ├── FileService.ts      # 文件 CRUD 操作
│   ├── TrashService.ts     # 回收站操作
│   ├── ConfigService.ts    # 配置操作
│   └── core/               # 核心基础设施
│       ├── ApiClient.ts    # HTTP 客户端（超时/重试）
│       ├── TransactionManager.ts # 事务管理器（原子操作）
│       ├── PermissionManager.ts  # 权限管理器
│       └── ErrorHandler.ts      # 统一错误处理
├── lib/                    # 工具库（纯函数、无副作用）
│   ├── chdParser.ts        # CHD Markdown 块解析器
│   ├── attributeParser.ts  # {key=value} 属性解析器
│   ├── scorer.ts           # 规则评分器
│   └── ...
└── types/                  # TypeScript 类型定义
    ├── chd.ts              # CHD 相关类型
    └── file-system.ts      # 文件系统相关类型
```

---

## 2. 组件通讯网络

### 2.1 通讯总览图（组件间数据流动）

```
app/page.tsx (Server)
    │ getAllPosts()
    ▼
HomeClient.tsx (Client)  ──props──→  DocumentList.tsx
    │                                     │ useFileSystem (SWR) 
    │                                     ▼
SettingsPanel.tsx ←──props (onOpenSettings) 
    │
    │ (点击文档)
    ▼
app/editor/[slug]/layout.tsx (或 editor/page.tsx)
    │
    ▼
EditorPage.tsx (编辑器主页面)
    ├── CodeMirrorEditor.tsx ←── ref: CodeMirrorEditorHandle
    │       │ onChange={setContent} → content 状态存储在 EditorPage
    │       │ onCursorChange={setActiveLine}
    │       └ insertText() (通过 ref 调用)
    │
    ├── CHDRenderer.tsx ←── props: markdown={content}, activeLine, editMode
    │       │ onCardClick → setActiveLine (双向联动)
    │       │ onCardUpdate → useMarkdownInteraction.updateAttribute()
    │       │ onSelectSection → setActiveLine
    │       └ 内部解析: useMemo → sections / blocks
    │
    ├── BottomToolbar.tsx ←── props: sectionLayout/cardStyle 等
    │       │ onChange → useMarkdownInteraction 的各种 update 方法
    │       └ 读取自 useCHDSelection Hook 的状态
    │
    └── useCHDSelection(content, activeLine) → 推导出当前选区状态
            │ 返回: { activeSectionProps, activeCardProps, selectedBlockIndex }
            └ 提供给 BottomToolbar 作为属性编辑器的当前值
```

### 2.2 关键组件间通讯的变量级详解

#### 2.2.1 EditorPage → CodeMirrorEditor（通过 Props + Ref）

| 方向 | 变量/方法 | 类型 | 作用 |
|------|----------|------|------|
| 父→子 (prop) | `value={content}` | `string` | EditorPage 的 content 状态 → CodeMirror 显示 |
| 父→子 (prop) | `onChange={setContent}` | `(val:string)=>void` | CodeMirror 内容变化 → 更新 EditorPage 的 content |
| 父→子 (prop) | `onCursorChange={setActiveLine}` | `(line:number)=>void` | 光标移动 → 更新 EditorPage 的 activeLine（用于同步渲染区高亮） |
| 子→父 (ref) | `editorRef.current.insertText(text)` | `(t:string)=>void` | EditorPage 的工具栏点击 → 通过 ref 调用 CodeMirror 插入文本 |
| 子→父 (ref) | `editorRef.current.scrollToLine(line)` | `(line:number)=>void` | 渲染区点击卡片 → 通过 ref 让编辑器滚动到对应行 |

**完整链路示例（用户编辑内容）**：
1. 用户在 CodeMirror 中键入字符
2. CodeMirror 内部 onChange 触发 → `onChange={setContent}` 被调用
3. `setContent` 是一个 `useState` 的 setter → `content` 状态更新
4. React 重新渲染 → `CHDRenderer` 收到新的 `markdown={content}` prop
5. `CHDRenderer` 内部 `useMemo` 重新解析 → `sections` 数组变化
6. `useEffect` 触发 `useScoring` 重新评分
7. `useEffect` 触发 `useCHDSelection` 根据新的 content + activeLine 重新推导选区

#### 2.2.2 EditorPage → CHDRenderer（通过 Props 双向绑定）

| Prop 名 | 值来源 | 传递给 CHDRenderer 后 |
|---------|--------|----------------------|
| `markdown={content}` | EditorPage 的 `content` state (useState) | CHDRenderer 内部 `useMemo` 解析 → sections/cards |
| `activeLine={activeLine}` | EditorPage 的 `activeLine` state | 传递给 Section → Card，用于高亮当前行 |
| `editMode={true}` | 硬编码 | Card 组件渲染时显示编辑/删除按钮和可点击状态 |
| `onCardClick={(line)=>setActiveLine(line)}` | EditorPage 定义的箭头函数 | 渲染区点击卡片 → 更新光标行 → 双向同步编辑器 |
| `onCardUpdate` | 指向 `updateAttribute` | 渲染区直接修改卡片属性 → 通过 useMarkdownInteraction 更新底层 Markdown 字符串 |
| `onBatchCardUpdate` | 指向 `batchUpdateAttributes` | 批量更新多个卡片属性（如更改列数时批量更新 col-span） |
| `onSelectSection` | EditorPage 定义 | Section 组件点击时触发 → 更新 activeLine → 同步编辑器光标 |

#### 2.2.3 EditorPage → BottomToolbar（通过 Props 传递当前选区状态）

| Prop | 值来源 | 说明 |
|------|--------|------|
| `sectionLayout={activeSectionProps.layout}` | `useCHDSelection` 返回的 `state.activeSectionProps.layout` | 当前选中的 Section 的 layout 属性值 |
| `sectionColor={activeSectionProps.color}` | 同上 `.color` | 当前 Section 的颜色值 |
| `sectionColumns={activeSectionProps.columns}` | 同上 `.columns` | 当前 Section 的列数 |
| `cardShape={activeCardProps.shape}` | `useCHDSelection` 返回的 `state.activeCardProps.shape` | 当前选中 Card 的 shape |
| `cardStyle={activeCardProps.style}` | 同上 `.style` | 当前选中 Card 的样式 |
| `selectedBlockIndex={selectedBlockIndex}` | `useCHDSelection` 返回的 `.selectedBlockIndex` | 当前选中的块在 blocks 数组中的索引 |

**完整链路示例（通过 BottomToolbar 修改 Section 列数）**：
1. 用户在渲染区点击某 Section
2. `CHDRenderer` → `Section` 组件收到 `onSelectSection` 调用
3. `onSelectSection(blockIndex, title, layoutProps)` → EditorPage 的 `onSelectSection` 被调用
4. → `setActiveLine(sectionBlock.startLine)` 
5. `useCHDSelection(content, activeLine)` 重新计算 → 检测到当前行属于该 Section
6. → 返回的 `activeSectionProps.columns = 3`（假设 Section 原有 columns=3）
7. BottomToolbar 收到 `sectionColumns={3}` → 下拉框显示 "3"
8. 用户在下拉框中选择 "4列"
9. BottomToolbar 的 `onSectionColumnsChange(4)` → EditorPage 的 `onSectionColumnsChange` 被调用
10. → 解析 blocks → 构建 `updates` 数组（包含 Section 的 columns 更改 + 所有子 Card 的 col-span 更改）
11. → 调用 `batchUpdateAttributes(updates)` 
12. `useMarkdownInteraction.batchUpdateAttributes()` → 遍历 updates → 使用 `parseAttributes()` 解析每行的现有属性 → 修改/追加新属性 → `serializeAttributes()` 序列化 → `handleUpdate()` 将新 Markdown 字符串推入 React 状态
13. `content` 状态更新 → CHDRenderer 重新解析渲染 → 页面 UI 变化

### 2.3 跨页面/跨层级通讯（Event 机制）

| 事件名 | 触发位置 | 监听位置 | 传递数据 | 作用 |
|--------|---------|---------|---------|------|
| `app-paths-updated` | 配置保存后（SettingsPanel 等） | `DocumentList.tsx` 的 `useEffect` | 无（仅触发刷新） | 通知文档列表刷新文件和容量统计数据 |
| `storage` (DOM) | `localStorage.setItem('chd_md_content')` | `PreviewPage.tsx` | `chd_md_content` 键 | 多标签页之间同步编辑器内容到预览页面 |

**`app-paths-updated` 完整链路**：
1. 用户在 `SettingsPanel` 中修改路径配置 → 调用 API `/api/config`
2. API 保存成功后 → `SettingsPanel` 调用 `window.dispatchEvent(new Event('app-paths-updated'))`
3. `DocumentList.tsx` 的 `useEffect` 监听到该事件
4. → 调用 `refresh()`（SWR 的 mutate，触发 `FileService.getAllFiles()` 重新请求）
5. → 调用 `refreshCapacity()`（SWR 的 mutate，触发 `ConfigService.getCapacity()` 重新请求）
6. → 调用 `router.refresh()`（Next.js 服务端组件重新获取数据）

---

## 3. 数据流核心链路

### 3.1 文档从加载到展示的完整链路

```
用户点击文档列表中的文档
    │
    ▼
DocumentList.tsx
    │ 调用: router.push(`/editor/${encodeURIComponent(slug)}`)
    │ slug 是文件标识符（如 "my-document"）
    ▼
app/editor/[slug]/page.tsx (或 editor/page.tsx 的处理逻辑)
    │ 服务端: getPostBySlug(slug) → 读取 .md 文件 → 返回 content 字符串
    │ 客户端: 通过 useEffect 请求 /api/load?slug=xxx
    ▼
EditorPage.tsx
    │ useState: const [content, setContent] = useState<string>('')
    │ useEffect: fetch(`/api/load?slug=${slug}`) → setContent(data.content)
    ▼
CHDRenderer.tsx 收到 markdown={content}
    │ useMemo 内部:
    │   1. matter(content) → 解析 frontmatter → { title, subtitle, tags, ... }
    │   2. parseCHDBlocks(content) → blocks[] (section/card/code 结构)
    │   3. 遍历 blocks, 构建 sections[]
    │   4. 智能列计算（Smart Sizing Logic）
    ▼
sections[] 数据 → 传给 Section 组件
    Section 组件 → 根据 layoutProps.columns 生成 Grid
    │ 每个 grid-item 内渲染 Card 组件
    ▼
Card 组件 → 根据 cardProps 渲染样式（card-style, shape, color 等）
    │ 内容通过 dangerouslySetInnerHTML 或直接文本渲染
    ▼
用户看到完整的 CHD 渲染视图
```

### 3.2 文件保存的完整链路

```
用户点击「保存」按钮 或 Ctrl+S
    │
    ▼
EditorPage.handleSaveToWorkspace()
    │ 1. 重命名逻辑: 判断是否需要 prompt 用户输入文件名
    │ 2. setIsSaving(true)
    ▼
FileService.saveFile(slug, content, operationLog)
    │ 1. PermissionManager.requirePermission(PermissionLevel.WRITE)
    │ 2. ApiClient.post('/api/save', { slug, content, operations })
    ▼
/api/save API Route (服务端)
    │ 1. 验证 slug 是否存在
    │ 2. 写入 .md 文件到 posts/{slug}.md
    │ 3. 如果 frontmatter 变化，更新文件头
    │ 4. 返回 { success: true, slug }
    ▼
ApiClient 收到响应
    │ 检测到 success === true
    │ mutate(QUERY_KEYS.FILES)     → 文件列表缓存失效 → 下次获取时重新请求
    │ mutate(QUERY_KEYS.CAPACITY)  → 容量缓存失效
    ▼
EditorPage 收到 save 结果
    │ FileService.logTrainingData({ ... }) → 记录训练数据
    │ setSaveSuccess(true) → 按钮显示 "✓ 已保存"
    │ setTimeout(() => setSaveSuccess(false), 2000)
```

### 3.3 文件拖拽上传的完整链路

```
用户从桌面拖动 .md 文件到 HomeClient 区域
    │
    ▼
HomeClient.tsx (首页)
    │ handleDragOver → setIsDragging(true) → 显示拖拽覆盖层
    ▼
handleDrop(e)
    │ 1. e.preventDefault() → 阻止浏览器默认行为
    │ 2. Array.from(e.dataTransfer.files) → 获取文件列表
    │ 3. filter(f => f.name.endsWith('.md') || f.name.endsWith('.markdown'))
    │ 4. setIsUploading(true)
    │
    ▼
    for (const file of validFiles) {
        │ const formData = new FormData()
        │ formData.append('file', file)
        │ await fetch('/api/upload', { method: 'POST', body: formData })
    }
    │
    ▼
    mutate('/api/files')   → SWR 缓存失效 → 文档列表自动刷新
    setIsUploading(false)
```

---

## 4. 状态管理详解

### 4.1 核心状态拓扑图

```
EditorPage.tsx
├── content (useState<string> = '')             ← 整个编辑器的核心状态
│   ├── CodeMirrorEditor.value (prop)
│   ├── CHDRenderer.markdown (prop)
│   ├── useDebounce(content, 1000)               → auto-save
│   ├── useMarkdownInteraction(content, setContent) → 提供所有 update 方法
│   │   └── operationLog (useState<OperationLogEntry[]>)  ← 记录所有修改操作
│   ├── useCHDSelection(content, activeLine)     → 选区推导
│   ├── useScoring(content, historyCount)        → 实时评分
│   └── useEffect → 解析 frontmatter → tagStyle
│
├── activeLine (useState<number> = 0)            ← 当前光标/点击行
│   ├── CodeMirrorEditor.onCursorChange → setActiveLine
│   ├── CHDRenderer.onCardClick → setActiveLine
│   └── CHDRenderer.onSelectSection → setActiveLine
│
├── isSaving (useState<boolean> = false)
├── saveSuccess (useState<boolean> = false)
├── lastSavedContent (useState<string> = '')
├── currentFilename (useState<string> = '示例1.md')
│
├── editorRef (useRef<CodeMirrorEditorHandle>)   ← 通过 ref 操作 CodeMirror
├── sections (useMemo)                           ← parseCHDBlocks 的结果
│   └── 传给 BottomToolbar.sections prop
│
└── useMarkdownInteraction 返回的这些方法:
    ├── updateAttribute(blockIndex, key, value)
    ├── batchUpdateAttributes(updates[])
    ├── updateContent(blockIndex, newContent)
    ├── updateTitle(blockIndex, newTitle)
    ├── updateFrontmatter(key, value)
    ├── moveCard(blockIndex, direction)
    ├── deleteCard(blockIndex)
    └── addCard(sectionBlockIndex)
```

### 4.2 useDocumentState Hook（预览页面/文档详情页的状态管理器）

> 文件：`src/hooks/useDocumentState.ts`

**作用**：在预览/编辑文档页面，聚合多个子 Hook 到一个统一的返回接口。

**依赖的 Hook 链**：
```
useDocumentState
    ├── useHistory(initialContent, { sessionId: decodedSlug })
    │       → 提供: state(content), pushState(setContent), undo, redo, canUndo, canRedo
    ├── useMarkdownInteraction(content, handleContentUpdate)
    │       → 提供: updateAttribute, updateContent, updateTitle, updateFrontmatter, 
    │               moveCard, deleteCard, addCard, batchUpdateAttributes, operationLog
    └── useScoring(content, effectiveHistoryCount)
            → 提供: scoreResult, showScoreDetails, setShowScoreDetails
```

**核心机制 - 保存与导航保护**：

```typescript
// useDocumentState.ts 中的 handleBack
const handleBack = useCallback(() => {
    if (isSavingRef.current) {
        // 如果正在保存，等待保存完成再导航
        const checkSave = setInterval(() => {
            if (!isSavingRef.current) {
                clearInterval(checkSave);
                router.push('/');
            }
        }, 100);
    } else {
        router.push('/');
    }
}, [router]);
```

**关键行为**：
- `isSavingRef.current` 是一个 `useRef<boolean>`，用于在异步保存过程中保持引用
- `debouncedSave` 函数在开始时设置 `isSavingRef.current = true`，在 finally 中设置 `false`
- `triggerDebouncedSave` 在内容变化时立即设置 `isSavingRef.current = true`（即使实际网络请求还没发出）
- 这确保了用户在点击返回按钮时不会丢失正在保存中的数据

### 4.3 SWR 缓存管理

> 文件：`src/hooks/useFileSystem.ts`

```typescript
// 三个 SWR Hook 的定义
export function useFiles(fallbackData?: FileItem[]) {
    const { data, error, isLoading, mutate: refresh } = useSWR<FileItem[]>(
        QUERY_KEYS.FILES,       // = '/api/files'
        () => FileService.getAllFiles(),
        {
            dedupingInterval: 10 * 60 * 1000,  // 10分钟缓存
            revalidateOnFocus: false,           // 聚焦时不自动刷新
            keepPreviousData: true,             // 保留旧数据
            errorRetryCount: 3,                 // 错误重试3次
            fallbackData,                        // 服务端渲染的初始数据
        }
    );
}

export function useCapacity() {
    // 容量统计 - 60秒轮询一次
    useSWR(QUERY_KEYS.CAPACITY, ConfigService.getCapacity, {
        refreshInterval: 60000  // Poll every 60s
    });
}

export function useTrash() {
    // 回收站文件 - 8分钟缓存
    useSWR(QUERY_KEYS.TRASH_FILES, TrashService.getTrashFiles, {
        dedupingInterval: 8 * 60 * 1000
    });
}
```

**缓存失效机制**：
- 在 `FileService.deleteFile()`、`FileService.saveFile()` 等方法成功后，手动调用 `mutate(QUERY_KEYS.FILES)` 使缓存失效
- SWR 检测到缓存 key 的 mutate 调用后，在下一次渲染时自动重新请求数据

---

## 5. Markdown 编辑与渲染联动

### 5.1 双向光标同步机制

**EditorPage 中的核心状态链**：
```
CodeMirror 光标变化
    → onCursorChange={setActiveLine}
    → activeLine state 更新
    → CHDRenderer 收到 activeLine={activeLine}
    → CHDRenderer 将 activeLine 传递给 Section → Card
    → 对应行的 Card 显示高亮边框

渲染区点击卡片
    → CHDRenderer.onCardClick(lineIndex)
    → EditorPage 中: setActiveLine(lineIndex)
    → editorRef.current.scrollToLine(lineIndex)
    → CodeMirror 滚动到对应行并设置光标位置
```

### 5.2 useCHDSelection - 从光标位置到选区状态推导

> 文件：`src/hooks/useCHDSelection.ts`

**输入**：`content: string`, `activeLine: number | null`
**输出**：`CHDSelectionState`

**核心算法**：

```typescript
useEffect(() => {
    // 1. 解析所有 blocks
    const blocks = parseCHDBlocks(content);
    
    // 2. 找到 activeLine 所在的 block
    let currentBlock = blocks.find(b => 
        activeLine >= b.startLine && activeLine <= b.endLine
    );
    
    // 3. 如果没找到（可能光标在空白区域），找最近的 section
    if (!currentBlock) {
        const sections = blocks.filter(b => b.type === 'section');
        const closestSection = sections.reduce((prev, current) => {
            return (current.startLine <= activeLine && 
                    current.startLine > (prev?.startLine || -1)) 
                ? current : prev;
        }, null);
        if (closestSection) currentBlock = closestSection;
    }
    
    // 4. 根据 block.type 推导选区状态
    if (currentBlock.type === 'section') {
        // → 设置 activeSectionProps（从 Section 标题行的属性解析）
        // → 重置 activeCardProps = DEFAULT_CARD_PROPS
        // → selectedBlockIndex = blockIndex（指向 Section）
    } else if (currentBlock.type === 'card' || currentBlock.type === 'code') {
        // → 解析 Card 标题行的属性 → activeCardProps
        // → 反向查找父 Section → activeSectionProps
        // → selectedBlockIndex = blockIndex（指向 Card）
    }
}, [content, activeLine]);
```

**使用 `parseAttributes()` 解析属性**：
```typescript
// 标题行示例: "### My Card {card-style=highlight shape=rounded}"
const titleLine = lines[currentBlock.startLine];
const { props, cleanText } = parseAttributes(
    titleLine.replace(/^#+\s+/, '')
);
// props = { 'card-style': 'highlight', 'shape': 'rounded' }
// cleanText = "My Card"
```

### 5.3 BottomToolbar 属性编辑的实时同步

```
BottomToolbar 修改属性
    → onSectionLayoutChange(newVal) 或 onCardStyleChange(newVal) 等
    → EditorPage 中: updateAttribute(blockIndex, key, value)
    → useMarkdownInteraction.updateAttribute()
        │ 1. parseCHDBlocks(content) → 找到 block
        │ 2. 解析 block 所在行的现有属性
        │ 3. 修改/追加/删除目标属性
        │ 4. serializeAttributes(attrs) → 重新序列化属性字符串
        │ 5. 重建行内容: `${level} ${cleanText} {${attrString}}`
        │ 6. handleUpdate(modifiedLines.join('\n'))
    → content state 更新
    → React 重新渲染
    → CHDRenderer 接收新的 markdown
    → sections/cards 重新解析
    → 页面 UI 更新
    → useCHDSelection 重新计算 → BottomToolbar 显示更新后的值
```

---

## 6. CHD Markdown 解析引擎

### 6.1 CHD 块解析器 (`parseCHDBlocks`)

> 文件：`src/lib/chdParser.ts`

**输入**：原始 Markdown 字符串
**输出**：`CHDBlock[]`

**解析规则**：

| Markdown 语法 | 块类型 | level | 示例 |
|--------------|--------|-------|------|
| 文件开头的 `---...---` | `frontmatter` | 0 | YAML 元数据 |
| `## 标题文字` | `section` | 1 | 分区定义 |
| `### 标题文字` | `card` | 2 | 卡片定义 |
| ```` ```\n代码\n``` ```` | `code` | 2 | 代码块（不在 card 内时） |

**状态机解析流程**：

```typescript
for (let i = 0; i < lines.length; i++) {
    // 状态判断优先级：
    // 1. Frontmatter 模式 (inFrontmatter = true)
    // 2. CodeBlock 模式 (inCodeBlock = true)
    // 3. Section 检测 (行以 ## 开头)
    // 4. Card 检测 (行以 ### 开头)
    // 5. 普通内容（扩展到当前 block）
    
    if (i === 0 && trimmed === '---') { /* 进入 Frontmatter */ }
    if (inFrontmatter) { /* 处理 Frontmatter 内容 */ }
    if (trimmed.startsWith('```')) { /* 进入/退出 CodeBlock */ }
    if (trimmed.startsWith('## ')) { /* Section 开始 */ }
    if (trimmed.startsWith('### ')) { /* Card 开始 */ }
    else { /* 内容行 → 扩展当前 block.endLine */ }
}
```

**关键变量状态机**：
- `currentBlock: CHDBlock | null` — 当前正在构建的块
- `inFrontmatter: boolean` — 是否在 frontmatter 区块内
- `inCodeBlock: boolean` — 是否在代码块内（` ``` `）
- `inCard: boolean` — 是否在当前 Card 内（用于代码块嵌套时的归属判断）

### 6.2 属性解析器 (`parseAttributes`)

> 文件：`src/lib/attributeParser.ts`

**输入**：标题行的原始文本（如 `My Card {card-style=highlight col-span=2}`）
**输出**：`{ cleanText: string, props: Record<string, string> }`

**核心正则**：
```typescript
const attrRegex = /([a-zA-Z0-9_-]+)=(?:"([^"]*)"|'([^']*)'|([^,\s}]+))/g;
// 匹配: key="value" 或 key='value' 或 key=value（无引号）
```

**边缘情况处理**：
- 中文括号 `｛｝` → 自动标准化为 `{}`
- 没有等号的内容 `{grid}` → 不视为属性（`= ` 是判断是否为属性的必要条件）
- 多层嵌套 `{attr="value {nested}"}` → 只识别最后一对 `{}`
- Key 必须是 `[a-zA-Z0-9_-]+`（含连字符和下划线）
- Value 可以带引号（允许包含空格）或不带引号（不允许空格）

### 6.3 CHDRenderer 的智能列计算（Smart Sizing Logic）

> 文件：`src/components/CHD/CHDRenderer.tsx`，lines 181-225

```typescript
result.forEach(section => {
    const cardCount = section.cards.length;
    let smartColumns = 2; // 默认

    if (cardCount === 1)       smartColumns = 1;
    else if (cardCount === 2)  smartColumns = 2;
    else if (cardCount === 3)  smartColumns = 3;
    else if (cardCount === 4)  smartColumns = 4;
    else if (cardCount >= 5)   smartColumns = 3;

    section.layoutProps.columns = String(smartColumns);
    
    // 强制等宽：删除所有 Card 的 col-span 属性
    section.cards.forEach(card => {
        delete card.props['col-span'];
    });
});
```

**规则**：
- **1张卡片** → 1列
- **2张卡片** → 2列
- **3张卡片** → 3列
- **4张卡片** → 4列
- **≥5张卡片** → 3列（避免行太长）
- **强制等宽**：覆盖用户设置的 col-span，确保 UI 一致性
- **覆盖条件**：仅在未显式设置 `columns`/`cols`/自定义 `layout` 时生效

---

## 7. 文件系统服务层

### 7.1 服务层架构

```
服务层 (services/)
├── FileService        → 文件 CRUD (getAllFiles, getFileBySlug, saveFile, deleteFile, moveFile)
├── TrashService       → 回收站 (getTrashFiles, restoreFiles, deleteFiles, emptyTrash, getTrashStats)
├── ConfigService      → 配置 (getCapacity, updateCapacityLimit, getAppInfo, updateConfig)
└── core/
    ├── ApiClient       → HTTP 客户端 (get/post/put/delete/upload + 超时/重试)
    ├── TransactionManager → 事务管理器 (原子操作 + 回滚)
    ├── PermissionManager  → 权限管理 (PermissionLevel: READ/WRITE/DELETE/ADMIN)
    └── ErrorHandler       → 错误处理 (ApiError → AppError 转换 + 分类)

数据获取层 (hooks/)
├── useFileSystem     → SWR Hook (useFiles, useCapacity, useTrash)
└── useFileManager    → 聚合 Hook (统一状态 + 所有操作方法)
```

### 7.2 ApiClient 的请求重试机制

```typescript
private static async request<T>(url, options, config): Promise<T> {
    const mergedConfig = { timeout: 30000, retries: 3, retryDelay: 1000, ...config };
    
    for (let attempt = 0; attempt < mergedConfig.retries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), mergedConfig.timeout);
        
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            // ... 处理响应
        } catch (error) {
            // 不重试: AbortError (超时)、VALIDATION 错误
            if (error.name === 'AbortError' || error.type === 'VALIDATION') throw error;
            
            lastError = error;
            if (attempt < mergedConfig.retries - 1) {
                await new Promise(resolve => setTimeout(resolve, mergedConfig.retryDelay));
                continue; // 继续下一轮重试
            }
            throw error; // 最终重试还是失败
        }
    }
}
```

**重试策略**：
- 最大 **3次** 重试
- **1秒** 间隔
- **30秒** 超时（AbortController）
- 超时和校验错误不重试

### 7.3 FileService.moveFile 的原子操作事务

```typescript
static async moveFile(oldSlug: string, newSlug: string): Promise<boolean> {
    // 1. 权限检查（需要 WRITE + DELETE 两个权限）
    PermissionManager.requireAllPermissions([PermissionLevel.WRITE, PermissionLevel.DELETE]);
    
    // 2. 创建事务
    const transaction = TransactionManager.createTransaction();
    
    // 3. 步骤1: 读取原文件内容
    transaction.addOperation(
        async () => { /* 读取文件内容 */ },
        async () => { /* 步骤1 无需回滚 */ },
        'Read file content'
    );
    
    // 4. 步骤2: 保存到新位置
    transaction.addOperation(
        async () => { /* 保存到新 slug */ },
        async () => { /* 回滚: 删除新创建的文件 */ },
        'Save file to new location'
    );
    
    // 5. 步骤3: 删除原文件
    transaction.addOperation(
        async () => { /* 删除旧 slug 的文件 */ },
        async () => { /* 回滚: 恢复旧文件 */ },
        'Delete old file'
    );
    
    // 6. 执行事务（含重试机制）
    return await TransactionManager.executeWithRetry(transaction);
}
```

**失败场景**：
- 步骤2失败 → 回滚：删除新创建的文件（已保存的内容被清理）
- 步骤3失败 → 回滚：先删除新位置的文件，再恢复旧文件

---

## 8. 回收站与容量管理

### 8.1 容量统计机制

```typescript
// ConfigService.getCapacity() 调用 /api/config 获取:
interface CapacityStats {
    limit: number;         // 容量上限（默认 100）
    count: number;         // 已使用文件数
    remaining: number;     // 剩余容量
    isFull: boolean;       // 是否已满
}
```

**容量管理 UI 组件链**：
```
DocumentList.tsx
    ├── CapacityProgressBar   → 显示进度条 (count/limit)
    ├── CapacityWarningDialog → 容量满时弹窗警告
    │   └── 提供 "删除回收站最早文件" 按钮
    └── useCapacity() → 60秒轮询一次，获取 stats
```

### 8.2 回收站冲突处理（容量满时的拖拽删除）

**完整链路**（拖拽文档到回收站时回收站已满）：

```typescript
// DocumentList.tsx 中的 handleDropToTrash
const handleDropToTrash = async (e) => {
    const stats = await TrashService.getTrashStats();
    
    if (stats.count >= 500) { // 回收站上限 500 个文件
        setWarningDialog({
            message: `回收站已满（${stats.count}/500）`,
            onConfirm: async () => {
                // 1. 获取回收站文件列表
                const files = await TrashService.getTrashFiles();
                // 2. 按 deletedAt 升序排序（最早的在前）
                files.sort((a, b) => a.deletedAt - b.deletedAt);
                // 3. 删除最早的一个文件
                await TrashService.deleteFiles([oldestFile.name]);
                // 4. 继续执行原删除操作
                await performDelete(slug, false, true);
            }
        });
    }
};
```

---

## 9. 事务管理与错误处理

### 9.1 Transaction 类的执行与回滚

```typescript
class Transaction {
    private operations: TransactionOperation[] = [];
    private completedOperations: number = 0;

    async execute(): Promise<boolean> {
        try {
            for (let i = 0; i < this.operations.length; i++) {
                await this.operations[i].execute();
                this.completedOperations = i + 1; // 持续跟踪已完成的步骤
            }
            return true;
        } catch (error) {
            await this.rollback(); // 任何步骤失败 → 回滚所有已完成的步骤
            throw error;
        }
    }

    private async rollback(): Promise<void> {
        // 从后往前依次执行 rollback
        for (let i = this.completedOperations - 1; i >= 0; i--) {
            await this.operations[i].rollback();
        }
        this.completedOperations = 0;
    }
}
```

### 9.2 统一错误处理

```typescript
// ErrorHandler 的错误分类
interface AppError {
    type: ErrorType;       // 'VALIDATION' | 'NETWORK' | 'PERMISSION' | 'FILESYSTEM' | 'UNKNOWN'
    message: string;
    code?: number;
    details?: any;
}

// 使用示例（FileService.saveFile 中的磁盘空间检测）:
catch (error) {
    const appError = ErrorHandler.handleError(error);
    // 针对磁盘空间错误特殊处理
    if (appError.message.includes('disk') || 
        appError.message.includes('space') || 
        appError.message.includes('quota')) {
        // 记录磁盘空间错误日志
        logger.error('Disk space error', { ... });
    }
    return false;
}
```

---

## 10. 界面交互机制

### 10.1 主题系统

**组件链**：
```
ThemeProvider (Context Provider)
    ├── 提供: { theme, setTheme, resolvedTheme, isDark }
    ├── 从 localStorage 读取/写入主题
    └── 提供 theme classes → body class

ThemeScope (局部作用域)
    ├── 用于覆盖特定区域的主题
    └── 在 editor 中用于预览区的主题隔离

ThemeSwitcher (UI 组件)
    ├── 在 EditorPage 顶栏显示
    └── 调用 setTheme(newTheme)
```

**主题变量**（在 Tailwind 中注册）：
```typescript
// lib/themes.ts
export const AVAILABLE_THEMES = [
    { id: 'light', name: '浅色' },
    { id: 'dark', name: '深色' },
    { id: 'glass', name: '玻璃态' },
    // ...
];
```

### 10.2 文档评分系统

```typescript
// useScoring(content, historyCount)
// 调用: RuleBasedScorer.evaluate(content, historyCount)

// lib/scorer.ts → RuleBasedScorer.evaluate()
// 评估维度：
// - 是否有 frontmatter（必填）
// - 是否有 sections（必填）
// - 是否有卡片内容为空
// - 卡片属性是否合法（card-style, col-span 等）
// - 文档结构是否完整
// - 编辑历史次数（historyCount）
// 返回: ScoreResponse { totalScore, issues[], details }

// 自动弹窗条件：
if (result.totalScore === 0 || result.issues.some(i => i.severity === 'error')) {
    setShowScoreDetails(true);
}
```

### 10.3 上下文菜单（右键菜单）

```typescript
// DocumentList.tsx 中的 contextMenu 状态
const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    slug: null
});

// 右键点击文档 → handleContextMenu(e, slug)
// → setContextMenu({ visible: true, x: e.clientX, y: e.clientY, slug })

// 全局点击关闭菜单
useEffect(() => {
    const handleGlobalClick = () => {
        setContextMenu(prev => ({ ...prev, visible: false }));
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('contextmenu', handleGlobalClick);
}, []);

// 菜单包含两个操作:
// 1. 「仅删除源文件」→ performDelete(slug, false)
// 2. 「删除源文件与输出」→ performDelete(slug, true)
```

---

## 附录：常见问题速查索引

| 问题 | 参见章节 | 关键文件 |
|------|---------|---------|
| 组件通讯是如何实现的？ | 第2章 | `EditorPage.tsx` → `CHDRenderer.tsx` props |
| 编辑器和渲染区如何双向同步？ | 第5章 | `activeLine` 状态 + `onCardClick` / `onCursorChange` |
| 保存文档时发生了什么？ | 第3.2节 | `EditorPage.tsx` → `FileService.saveFile()` |
| 容量满了怎么办？ | 第8.2节 | `DocumentList.tsx` → `handleDropToTrash` |
| 文件移动的原子性如何保证？ | 第7.3节 | `FileService.moveFile()` + `TransactionManager` |
| 属性解析如何处理中文括号？ | 第6.2节 | `attributeParser.ts` → `normalizedText.replace()` |
| 智能列计算规则是什么？ | 第6.3节 | `CHDRenderer.tsx` → `Smart Sizing Logic` |
| 回收站上限是多少？ | 第8.2节 | `if (stats.count >= 500)` |
| 自动保存的防抖时间？ | 第4.2节 | `useDocumentState.ts` → `setTimeout 5000ms` |
| 错误重试策略？ | 第7.2节 | `ApiClient.request()` → 3次 × 1秒间隔 |
| 前端路由如何映射到文档？ | 第3.1节 | `router.push(editor/${slug})` + API load |
| SWR 缓存如何失效？ | 第4.3节 | `FileService` 成功操作后调用 `mutate()` |

---

> **使用方式**：将本文件放置在项目根目录。当您需要深入理解某个机制时，通过章节索引快速定位。
> **提问建议**：例如问 "HomeClient 和 DocumentList 之间是如何通讯的？" → 应回答 "HomeClient 通过 props `initialPosts` 和 `onOpenSettings` 传递给 DocumentList，其中 initialPosts 来自 app/page.tsx 的 `getAllPosts()` 服务端渲染数据..."