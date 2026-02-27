# CHD 协议 v2.0：面向 AI 的生成规范 (CHD Protocol for AI Generation)

**版本**: v2.0
**日期**: 2026-02-26
**状态**: **已生效 (Active)**
**适用对象**: AI 助手 (LLMs), 内容创作者, 自动化脚本

---

## 1. 核心理念 (Core Philosophy)

**"Structure First, Content Condensed" (结构优先，内容精炼)**

CHD (Card-based Hierarchical Document) 协议不仅仅是一种 Markdown 格式，更是一种**信息可视化的设计语言**。当 AI 解析一篇长文（如论文、项目报告）并生成 CHD 文档时，它不应仅仅充当“翻译器”，而必须成为一名**高级信息架构师**。

### AI 的角色定义
*   **❌ 不是**: 简单的文本搬运工（不要直接复制粘贴长段落）。
*   **✅ 而是**:
    *   **信息架构师**: 将线性文本重构为网格化的卡片结构。
    *   **UI 设计师**: 根据内容的重要性选择合适的 `layout` (布局) 和 `card-style` (样式)。
    *   **数据分析师**: 从文本中提取关键指标，通过 `stat` 卡片进行可视化呈现。

---

## 2. 协议规范 (Protocol Specification)

CHD 采用严格的**三级刚性结构**。AI 生成时必须严格遵守此层级，禁止越级或混用。

### L0: 文档元数据 (YAML Frontmatter)
位于文档最顶部的 YAML 块，定义全局属性。

```yaml
---
title: "文档主标题"       # 必填，通常为论文/项目名称
subtitle: "副标题或口号"  # 必填，一句话概括核心价值
tags: ["关键词1", "关键词2"] # 必填，3-5个核心关键词
category: "project"      # 选填，文档分类：project（项目）、paper（论文）、knowledge（知识理解/知识分享）、other（其他）
version: "1.0"           # 选填，默认 1.0
status: "done"           # 选填，done/wip
training_sample: true    # 选填，标识是否为高质量样本
---
```

### L1: 逻辑章节 (Section - H2)
定义文档的横向切分。**必须使用二级标题 `##`**。
AI 必须为每个 Section 指定布局属性。

```markdown
## 核心亮点 {layout="grid" columns=4 section-color="chart-1"}
```

*   **`layout`**:
    *   `"grid"`: 网格布局（默认）。适合展示多个并列的观点、特征或数据。
    *   **注**: `single` 和 `gallery` 布局在 v2.0 中已**暂时锁定**，所有内容强制使用 Grid 布局以保证一致性。
*   **`columns`**: (仅在 grid 布局下有效)
    *   **智能列数规则 (Smart Columns)**:
        *   **1-4 张卡片**: 列数 = 卡片数量 (1->1, 2->2, 3->3, 4->4)。
        *   **5张及以上**: 强制分行，每行 3 列 (如 5 张 -> [3, 2], 6 张 -> [3, 3])。
        *   **最大列数**: 4 (仅当卡片数为 4 时)。
    *   **AI 策略**: 通常无需指定 `columns`，由渲染引擎自动计算。仅在需要强制特定视觉效果时指定。
*   **`section-color`**: (选填)
    *   `"chart-1"` 到 `"chart-5"`: 应用莫兰迪主题色背景。
    *   `"default"`: 默认背景。

### L2: 语义卡片 (Card - H3)
定义具体的内容单元。**必须使用三级标题 `###`**。
**严禁在 L1 (##) 下直接书写正文，所有内容必须包裹在 L2 (###) 卡片中。**

```markdown
### 突破全网拓扑假设 {card-style="highlight"}
这里是卡片的正文内容...
```

*   **`card-style` (样式)**:
    *   `"normal"`: 标准卡片（默认）。适合一般性描述。
    *   `"highlight"`: 高亮卡片。适合核心观点、重要结论。
    *   `"quote"`: 引用卡片。适合名言、用户评价、设计理念。
    *   `"code"`: **[用户专用]** 代码卡片。
        *   **AI 禁止生成**: AI **严禁**直接生成此样式。
        *   **原因**: 该样式具有特殊的视觉效果，仅由用户在后期编辑时根据审美偏好手动开启。
        *   **AI 策略**: 对于代码块、配置文件或伪代码，AI 应始终将其放在 `normal` 或 `highlight` 卡片中。
    *   **注**: `stat`, `warning`, `summary` 等样式在 v2.0 中已**精简**，请勿使用。所有内容请归类为上述 3 种允许的样式。

### L2.1: 富文本支持 (Rich Text Support)
CHD 协议全面支持以下富文本格式。
**核心原则**: 为了保证内容的可编辑性与语义化，**必须优先使用标准文本格式normal**，严禁使用图片或硬编码 HTML。

*   **数学公式 (Math/LaTeX)**:
    *   **规范**: 必须使用 LaTeX 语法（`$` 或 `$$`）。**严禁使用行内代码（反引号）包裹公式**。**禁止使用公式截图**。
    *   **行内公式**: 使用 `$ E = mc^2 $`。
    *   **块级公式**: 使用 `$$` 包裹。
    *   **适用场景**: 算法推导、物理公式、统计模型。
    *   **示例**:
        ```latex
        $$
        J(\theta) = -\frac{1}{m} \sum_{i=1}^m [y^{(i)}\log(h_\theta(x^{(i)})) + (1-y^{(i)})\log(1-h_\theta(x^{(i)}))]
        $$
        ```
*   **表格 (Tables)**:
    *   **规范**: 必须使用标准 GFM Markdown 表格语法。**禁止使用 HTML `<table>` 标签或表格截图**。
    *   支持标准 GFM (GitHub Flavored Markdown) 表格语法。
    *   **适用场景**: 数据对比、参数列表、优缺点分析。
    *   **示例**:
        ```markdown
        | 模型 | 准确率 | 召回率 | F1 |
        | :--- | :---: | :---: | --: |
        | BERT | 92.5% | 91.0% | 91.7 |
        | LSTM | 88.3% | 85.2% | 86.7 |
        ```

*   **`col-span` (跨列)**:
    *   **[v2.1 更新] 已弃用 (Deprecated)**。
    *   为了保证视觉统一性，**所有卡片宽度必须完全一致**。
    *   禁止 AI 为卡片指定 `col-span` 属性。渲染引擎将自动忽略此属性。
*   **`row-span` (跨行)**:
    *   默认为 `1`。
    *   `2`: 让卡片在垂直方向上占据更多空间（仅在 grid 布局且由引擎自动排列时有效）。

---

## 3. AI 生成提示词 (System Prompt for AI)

当要求 AI 将一篇论文或报告转换为 CHD 格式时，请使用以下 Prompt：

```markdown
# Role
You are an expert Information Architect and UI Designer. Your task is to restructure the provided input text (Paper/Report/Article) into a **Card-based Hierarchical Document (CHD)** using Markdown.

# CHD Protocol Rules (Strict Enforcement)
1.  **Structure**:
    - **L0**: Start with YAML Frontmatter (`title`, `subtitle`, `tags`).
    - **L1**: Use `## Section Title {attributes}` for major sections.
    - **L2**: Use `### Card Title {attributes}` for content blocks.
    - **NO Orphan Text**: NEVER write text directly under `## Section`. All text MUST be inside `### Card`.
    - **No H4+**: Do not use `####` or deeper headings.
    - **Math/Tables**: MUST use LaTeX (`$`/`$$`) for formulas. **NEVER use code blocks (backticks) for math**. Do NOT use images.

2.  **Layout Strategy (L1 Attributes)**:
    - **FORCE GRID**: Always use `{layout="grid"}`. Other layouts (`single`, `gallery`) are DISABLED.
    - **Columns**:
        - 1-4 cards -> `columns=N` (e.g. 3 cards -> 3 columns).
        - 5+ cards -> `columns=3`.
    - **Color**: Use `section-color="chart-N"` for visual distinction.

3.  **Card Styling (L2 Attributes)**:
    - **Allowed Styles Only**: `normal`, `highlight`, `quote`. (**'code' style is BANNED for AI**)
    - **Core Concepts/Stats/Math**: Use `{card-style="highlight"}`. **Math MUST use LaTeX**.
    - **Quotes/Feedback**: Use `{card-style="quote"}`.
    - **Code/Config**: Use `{card-style="normal"}` (or `highlight`). **NEVER generate `{card-style="code"}`**. This style is reserved for manual user application.
    - **General Text**: Use `{card-style="normal"}`.
    - **Consistency**: Maintain style consistency within a section.
    - **No Col-Span**: Do NOT use `col-span`. All cards must be equal width.

4.  **Content Refinement**:
    - **Summarize**: Do not paste long paragraphs. Break them into bullet points.
    - **Title Extraction**: Card titles (`### Title`) should be punchy (2-6 words).
    - **Consistency**: Maintain a uniform grid.
    - **Data**: Use Tables for structured data comparison.
    - **Formula**: Use LaTeX for mathematical expressions.

# Example Output

---
title: "Project Alpha"
subtitle: "Next-Gen AI Rendering Engine"
tags: ["AI", "Rendering", "Optimization"]
---

## Core Highlights {layout="grid" columns=4 section-color="chart-1"}

### 10x Performance {card-style="highlight"}
Optimized rendering pipeline reduces latency by 90%.

### Zero Config {card-style="highlight"}
Fully automated setup with smart defaults. No manual tuning required.

### 99.9% Uptime {card-style="highlight"}
Enterprise-grade reliability.

### Math Ready {card-style="highlight"}
Supports LaTeX: $ E = mc^2 $.

## Architecture {layout="grid" columns=3}

### Frontend Layer {card-style="normal"}
Built with React and Tailwind for maximum flexibility.

### AI Core {card-style="normal"}
Powered by a custom transformer model optimized for structural understanding.

## User Feedback {layout="grid" columns=2}

### "Game Changer" {card-style="quote"}
This tool completely revolutionized our workflow.

### "Must Have" {card-style="quote"}
I can't imagine working without it anymore.
```

---

## 4. 最佳实践 (Best Practices)

### 4.1 如何处理论文摘要 (Abstract)
*   **不要**：直接复制一大段摘要文本。
*   **要**：将其拆解为 `## 核心亮点` 或 `## 论文概览`。
    *   将“背景”拆为一个卡片。
    *   将“贡献”拆为 2-3 个 `highlight` 卡片。
    *   将“结果”拆为 `highlight` 卡片（并在文中加粗数据）。

### 4.2 如何处理实验数据 (Experiments)
*   **不要**：仅仅列出表格。
*   **要**：使用 `highlight` 卡片展示最关键的提升指标（如 "**SOTA +2.5%**"）。
*   **要**：使用 `normal` 卡片解释数据背后的原因。

### 4.3 如何处理技术架构 (Architecture)
*   **不要**：用纯文本描述流程。
*   **要**：使用 `normal` 样式卡片展示模块名称或伪代码（**勿用 `code` 样式**）。
*   **要**：使用 `columns=3` 的网格布局，按逻辑顺序排列。

### 4.4 视觉一致性 (Visual Consistency)
*   **强制网格**: 严格遵守 `1-4 张 = N 列`，`5+ 张 = 3 列` 的规则。
*   **避免孤儿**: 确保每行卡片数量平衡。例如 5 张卡片会排成 `3 + 2`，这是允许的。
*   **不要**: 尝试使用 `col-span` 或 `row-span` 来创造“艺术感”。在 v2.0 中，整齐划一是最高优先级。
*   **AI 智能列数**:
    *   **1-4 张卡片**: 列数 = 卡片数 (如 3张 -> `columns=3`)。
    *   **5+ 张卡片**: **强制** `columns=3`。这能保证最佳的阅读体验（如 5张排成 3+2，6张排成 3+3）。
    *   **避免拥挤**: 尽量不要使用 `columns=4`，除非卡片内容极短。绝大多数情况下，`columns=3` 是最佳选择。
*   **Section 内部一致性**: 同一个 Section 下的 Card 样式应尽可能保持统一。
*   **特殊区域例外 (Footer Exceptions)**: 对于文档的结尾部分（如“引言”、“总结”、“参考文献”），允许其样式与正文部分不同。例如，可以使用 `card-style="quote"` 来突出总结性陈述。

### 4.5 内容原子化 (Content Atomicity)
*   **"One Card, One Point" (一卡一义)**: 严禁将整个章节的所有内容（如多个无序列表项、多段长文本）塞进同一个 `###` 卡片中。
*   **拆解策略**:
    *   遇到含有多个 `h4` 或加粗标题的段落，应拆分为多个独立的 `###` 卡片。
    *   遇到长列表（超过 5 项），应考虑按逻辑分组拆分为多个卡片。
*   **避免单体巨石 (No Monolithic Cards)**: 保持卡片高度相对一致，以维持 Grid 布局的美观。

---

## 5. 常见错误自检 (Self-Correction)

*   **错误 1**: `## Introduction` 下面直接写了 "This paper proposes..."。
    *   **修正**: 必须包裹在 `### Background {card-style="normal"}` 中。
*   **错误 2**: `### Result` 卡片里使用了 `card-style="stat"`。
    *   **修正**: v2.0 已移除 `stat` 样式。请使用 `card-style="highlight"`，并直接在内容中加粗数字，如 `**95%** Accuracy`。
*   **错误 3**: 整个文档只用了一种 `card-style="normal"`。
    *   **修正**: 根据语义，至少应用 3 种允许的样式（`normal`, `highlight`, `quote`）。
*   **错误 4**: 公式使用了代码块包裹，如 `` `E=mc^2` `` 或使用了 `code` 样式卡片。
    *   **修正**: 必须使用 LaTeX 语法 `$ E=mc^2 $`，并使用 `highlight` 或 `normal` 样式。
