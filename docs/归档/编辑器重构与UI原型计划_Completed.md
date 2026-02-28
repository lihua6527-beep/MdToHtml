# 编辑器重构与 UI 原型计划书 (UI-First Strategy)

## 1. 核心目标

- 解决现有编辑器（SideToolbar/BottomToolbar）的交互混乱与类型系统崩溃问题。
- 在不破坏「Markdown/Frontmatter 是单一真理」的前提下，重构控制层与渲染层的协作方式。
- 严格执行「文档 → 审阅 → 分支开发 → 验证 → 合并」工作流，避免再次出现在 `master` 直接实验性改动的情况。

## 2. 实施步骤（编辑器 UI-First）

### Phase 1: 静态控制面板原型 (Static UI Prototype)

**目标**：构建一个纯 HTML/CSS 的控制面板，直观展示所有可调节的参数，确认布局合理性。
**产出物**：`docs/计划书/editor_prototype.html`

#### 2.1 全局/页面级控制 (Theme Level)

| 控制项   | 描述                         | UI 形式               | 默认值      |
| :------- | :--------------------------- | :-------------------- | :---------- |
| 主题风格 | 预设主题 (Ocean, Mint, etc.) | 色块选择器 (圆角矩形) | Ocean       |
| 页面背景 | 页面底色微调                 | 颜色选择器 (预设色板) | 默认        |
| 分区间距 | H2 标题之间的垂直距离        | 分段控制器 (紧/标/宽) | 标准 (2rem) |
| 分割线   | H2 下方是否显示分割线        | 开关 (Toggle Switch)  | 显示        |

#### 2.2 分区级控制 (Section Level - H2)

| 控制项   | 描述                         | UI 形式               | 默认值          | 扩展性备注                                                     |
| :------- | :--------------------------- | :-------------------- | :-------------- | :------------------------------------------------------------- |
| 布局模式 | 卡片排列方式                 | 图标按钮组 / 下拉菜单 | Parallel (Grid) | 预留 Hub/Ring/Timeline 等高级布局入口                          |
| 分区配色 | 统一控制该分区下所有卡片颜色 | 颜色圆点 (5色 + 默认) | 默认            | **新增约束**: 二级标题总管卡片颜色，卡片自身不可独立改色 |
| 网格列数 | 每行显示几张卡片 (Grid 模式) | 数字按钮 (1, 2, 3, 4) | 2               | 仅在 Parallel 模式下有效                                       |
| 标题字号 | H2 标题大小                  | 按钮组 (S / M / L)    | M               | -                                                              |
| 正文字号 | 分区内文本大小               | 按钮组 (S / M / L)    | M               | -                                                              |

#### 2.3 卡片级控制 (Card Level - H3)

**优先级最高**，直接决定内容呈现。

| 控制项   | 描述               | UI 形式                             | 默认值    | 扩展性备注                                                    |
| :------- | :----------------- | :---------------------------------- | :-------- | :------------------------------------------------------------ |
| 卡片形态 | 物理外观 (Shape)   | 图标网格 (Rect, Cut, Arrow, Circle) | Rectangle | **受布局模式约束** (见 2.4)，未来支持 Hub/Ring 特殊形态 |
| 卡片语义 | 内容样式 (Style)   | 下拉菜单 (Normal/Highlight/Stat…)  | Normal    | 与形态正交，控制排版与强调重点                                |
| 卡片宽度 | 在 Grid 中的跨列数 | 数字按钮 (1, 2, 3, 4)               | 1         | 仅在 Parallel 模式下有效，对应内部 `col-span` 属性          |

#### 2.4 交互逻辑与约束矩阵 (Interaction Logic & Constraints)

为适应未来 `Hub`, `Ring`, `Timeline` 等复杂布局，编辑器必须实现以下**约束逻辑**：

1. **布局决定形态 (Layout Drives Shape)**
   * 当 Section Layout = `Parallel` -> 允许用户自由选择所有 Card Shapes。
   * 当 Section Layout = `Hub` -> 强制锁定 Card Shape 为 `Circle` (Satellite)，禁用形态选择器。
   * 当 Section Layout = `Ring` -> 强制锁定 Card Shape 为 `Arrow`，禁用形态选择器。
2. **参数互斥 (Parameter Mutually Exclusive)**
   * `columns` 和 `col-span` 仅在 `Parallel` 布局下生效。在 `Hub/Ring` 模式下应自动隐藏或禁用，避免产生无效的 Markdown 参数。
3. **Markdown 真理 (Single Source of Truth)**
   * 所有视觉变化必须通过修改 Markdown 属性 (`{layout="... "}`, `{shape="..."}`) 实现。
   * **严禁**在编辑器中维护独立于 Markdown 之外的 UI 状态（如 "折叠/展开" 状态若需持久化，必须写入 Frontmatter 或 Block Attributes）。
   * 分割线 (`separator`)、间距 (`gap`) 等全局配置同理，必须映射到 Frontmatter。

### Phase 2: 后端逻辑验证 (Backend Logic Validation)

**目标**：确保前端的每一次操作都能正确映射到 Markdown/Frontmatter 数据结构，并被后端正确解析。

1. **Frontmatter 扩展**：
   * 验证 `gap`, `separator`, `theme` 等全局属性的读写。
   * 确保 `yaml` 解析库能处理新增字段。
2. **CHD 协议扩展**：
   * 验证 `:::` 属性解析器能否处理 `layout=gallery`, `columns=3` 等复杂参数。
   * 确保 `span=2` 等卡片属性不与布局冲突。
3. **渲染传导测试**：
   * 编写测试用例：修改 Frontmatter -> 重新解析 -> 生成 HTML -> 样式类名是否正确应用 (e.g., `grid-cols-3`, `gap-8`)。

### Phase 3: 集成与组件化 (Integration)

**目标**：将静态原型转化为 React 组件 (`NewBottomToolbar.tsx`)。

1. **组件拆分**：
   * `ThemePanel`: 负责全局设置。
   * `SectionPanel`: 负责当前选中 H2 的布局。
   * `CardPanel`: 负责当前选中卡片的样式。
2. **状态同步**：
   * 使用 `useContext` 或 `zustand` 管理编辑器状态，避免 props drilling。
   * 实现防抖 (Debounce) 的 Frontmatter 更新，避免频繁重渲染。

## 3. 系统架构与渲染响应性分析 (System Architecture Analysis)

### 3.1 架构分离性分析

当前编辑器架构遵循 **"单向数据流" (Unidirectional Data Flow)** 原则，但存在紧耦合的"视图-模型"关系：

* **模型层 (Model)**: `EditorPage` 中的 `content` (Markdown 字符串) 是唯一的真理来源 (Single Source of Truth)。所有的配置（主题、布局、样式）都必须序列化为 Markdown 文本（Frontmatter 或 Block Attributes）才能持久化。
* **视图层 (View)**: `CHDRenderer` 是一个纯函数组件 `f(markdown) -> UI`。它不维护任何独立的配置状态，完全依赖于对 Markdown 的实时解析。
* **控制层 (Controller)**: `BottomToolbar` (拟重构) 和 `ThemeSwitcher` 充当控制器。它们不直接操作 DOM 或 Renderer，而是通过 `useMarkdownInteraction` 修改 Markdown 文本。

**分离性评价**:

* **优势**: 实现了极致的 "所见即所得" (WYSIWYG) 和数据可移植性。只要 Markdown 文件在，视图状态就在。
* **劣势**: 控制层与视图层在 *运行时* 是分离的（通过文本中转），但在 *逻辑上* 是高耦合的。控制层必须精确知道如何生成 Renderer 能识别的 Markdown 语法（如 `{layout="grid"}`），否则配置将失效。

### 3.2 渲染响应性分析 (Rendering Responsiveness)

用户关心的"配置改变是否能正确引起渲染页面相应参数或画面的改变"，取决于以下链路的畅通性：

1. **UI 触发**: 用户点击 "Grid 模式" 按钮。
2. **文本变更**: `useMarkdownInteraction` 正则匹配当前 Section 标题，注入/替换 `{layout="grid"}` 属性。
3. **状态更新**: `setContent(newMarkdown)` 触发 React 更新。
4. **解析重算**: `CHDRenderer` 中的 `useMemo` 监听到 `markdown` 变化，触发 `parseCHDBlocks` 和 `matter` 解析。
5. **Diff 渲染**: React Virtual DOM 计算出 `Section` 组件的 `className` 从 `flex-col` 变为 `grid-cols-3`，浏览器重绘。

**潜在风险与优化**:

* **解析开销**: 每次微小的配置修改（如拖动滑块）都会触发全文重解析。对于长文档，可能导致卡顿 (>50ms)。
  * *优化策略*: 在 Phase 3 中引入 **防抖 (Debounce)** 机制，或将解析逻辑移至 Web Worker。
* **正则脆弱性**: 如果 Markdown 格式不规范（如标题后缺少空格），正则替换可能失败，导致配置无法写入文本，进而导致渲染无响应。
  * *优化策略*: 强化 `useMarkdownInteraction` 的鲁棒性，采用 AST (抽象语法树) 操作而非纯正则替换。

### 3.4 结论

当前的架构设计能够保证配置改变引起画面改变，前提是 **控制层生成的 Markdown 语法严格符合 Renderer 的解析规则**。因此，Phase 2 (后端逻辑验证) 至关重要，必须确保生成的 Markdown 片段是合法的 CHD 协议代码。

## 4. 验收标准

1. **视觉验收**：控制面板布局清晰，无遮挡，在 1080p 屏幕下可用。
2. **功能验收**：所有开关、滑块、按钮均能正确触发数据变更。
3. **渲染验收**：前端修改配置后，预览区域能实时（<200ms）反映变化。
4. **架构验收**: 确认控制层生成的 Markdown 语法正确，且 Renderer 能正确解析该语法，无"配置丢失"现象。

## 5. 编辑器渲染与控制层次结构分析

### 5.1 分层结构总览

- **数据层（Markdown / Frontmatter）**`EditorPage` 中的 `content`（Markdown 字符串）是系统唯一真理来源，所有主题、布局、样式等配置最终都必须序列化为 Frontmatter 或 Block Attributes 写入文本。
- **协议层（CHD 协议）**Section（H2）与 Card（H3）通过 `{layout="..." columns=...}`、`{shape="..." style="..." span=...}` 等属性表达布局与样式约束，为渲染层提供结构化输入。
- **渲染层（CHDRenderer 视图）**`CHDRenderer` 作为纯函数组件 `f(markdown) -> UI`，通过 `parseCHDBlocks` + `matter` 将 Markdown 解析为结构化数据，再映射为具体的 Tailwind 类与 React 组件树。
- **控制层（BottomToolbar / ThemeSwitcher 等控制组件）**
  控制组件不直接操作 DOM，只通过 `useMarkdownInteraction` 修改 Markdown 文本，从而间接驱动渲染层更新。

### 5.2 从控制操作到画面更新的完整链路

1. **UI 触发**用户在 `ThemePanel` / `SectionPanel` / `CardPanel` 中执行操作，例如点击“Grid 模式”、调整列数、切换卡片形态等。
2. **Markdown 变更**控制组件调用 `useMarkdownInteraction`，在当前选中范围（H2/H3）内增加或替换属性，例如：

   - Section 级：`{layout="parallel" columns=3}`
   - Card 级：`{shape="rect" style="highlight" span=2}`
3. **状态更新**`useMarkdownInteraction` 返回新的 Markdown 字符串，`EditorPage` 调用 `setContent(newMarkdown)`，触发 React 状态更新。
4. **解析与映射**`CHDRenderer` 监听到 `markdown` 变化，通过 `useMemo` 重新执行：

   - `matter`：解析 Frontmatter 中的全局配置（如 `theme`, `gap`, `separator`）。
   - `parseCHDBlocks`：解析 Section / Card 级属性，生成结构化 AST。
     然后将这些结构映射为具体的布局与样式类，如 `grid-cols-3`、`gap-8`、`col-span-2` 等。
5. **渲染与重绘**
   React Virtual DOM 对比前后树形结构，计算差异并更新真实 DOM，浏览器完成重绘，用户看到布局/样式的即时变化。

### 5.3 约束矩阵在层次中的作用

- **布局驱动形态（Layout Drives Shape）**

  - 当 Section Layout = `Parallel` 时，允许自由选择卡片形态（Rect/Cut/Arrow/Circle）。
  - 当 Section Layout = `Hub` 时，强制所有卡片 `shape=Circle`，控制面板需禁用形态选择器。
  - 当 Section Layout = `Ring` 时，强制 `shape=Arrow`，同样禁用形态选择器。
    这些规则保证控制层生成的属性组合始终在 CHD 协议允许的范围内。
- **参数互斥（Parameter Mutually Exclusive）**

  - `columns`、`col-span` 仅在 `Parallel` 布局下生效。
  - 在 `Hub` / `Ring` 模式中，相应控件应自动隐藏或禁用，避免写入无效 Markdown 参数。
    通过在控制层应用该约束，可以从源头上减少“有参数但无效果”的情况。
- **Markdown 单一真理（Single Source of Truth）**所有视觉变化必须最终反映在 Markdown/Frontmatter 中：

  - 全局配置：Frontmatter 中的 `theme`, `gap`, `separator`。
  - Section 配置：标题后的 `{layout="..." columns=...}`。
  - 卡片配置：H3 标题后的 `{shape="..." style="..." span=...}`。
    控制面板不允许维护与 Markdown 脱离的长期 UI 状态。

### 5.4 渲染响应性与性能注意事项

- **解析频率**任何一次控制操作都会触发 Markdown 变更与全文解析，对于长文档可能产生 >50ms 的卡顿感。因此在 Phase 3 中必须：

  - 对频繁触发的操作（滑块、拖动等）增加防抖（Debounce）。
  - 评估是否需要将解析逻辑移动到 Web Worker 中，减轻主线程压力。
- **文本匹配鲁棒性**
  目前 `useMarkdownInteraction` 依赖正则匹配标题与属性，若 Markdown 不规范（如标题后缺少空格）可能导致替换失败，进而出现“控制面板点击无反应”的问题。
  未来应逐步过渡到基于 AST 的文本操作，提升鲁棒性。

### 5.5 结论：控制组件对画面内容修改的可追溯性

在上述分层与约束体系下，任意一次控制操作都具备清晰的可追溯路径：

> 控制组件交互 → Markdown/Frontmatter 属性变更 → CHD 解析 → React 渲染 → 画面更新

只要：

- 控制层严格遵守约束矩阵（布局驱动形态、参数互斥）；
- 所有配置无例外地落在 Markdown/Frontmatter 中；
- 渲染层继续保持 `f(markdown) -> UI` 的纯函数特性；

就可以保证编辑器中每个控制组件都能稳定、可预测地修改画面内容，并且在未来扩展 Hub/Ring/Timeline 等复杂布局时，仍然保持清晰的系统层次结构。
