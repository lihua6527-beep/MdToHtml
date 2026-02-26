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
    *   `"single"`: 单栏流式布局。适合长文本、叙事性内容或代码块。
    *   `"gallery"`: 画廊布局（默认 3 列，无缝隙）。适合图片展示。
*   **`columns`**: (仅在 grid 布局下有效)
    *   `2`: 双栏对比。
    *   `3`: 标准三栏（最常用）。
    *   `4`: 高密度信息（如核心亮点、数据指标）。
*   **`section-color`**: (选填)
    *   `"chart-1"` 到 `"chart-5"`: 应用莫兰迪主题色背景。
    *   `"default"`: 默认背景。

### L2: 语义卡片 (Card - H3)
定义具体的内容单元。**必须使用三级标题 `###`**。
**严禁在 L1 (##) 下直接书写正文，所有内容必须包裹在 L2 (###) 卡片中。**

```markdown
### 突破全网拓扑假设 {card-style="highlight" col-span=2 row-span=1}
这里是卡片的正文内容...
```

*   **`card-style` (样式)**:
    *   `"normal"`: 标准卡片（默认）。适合一般性描述。
    *   `"highlight"`: 高亮卡片。适合核心观点、重要结论。背景色会有所不同。
    *   `"stat"`: 统计卡片。**核心数据指标专用**。字体会自动放大居中。
    *   `"quote"`: 引用卡片。适合名言、用户评价、设计理念。
    *   `"code"`: 代码卡片。适合展示技术栈、算法伪代码、配置参数。
    *   `"warning"`: 警告卡片。适合展示风险、痛点、错误提示。
    *   `"summary"`: 摘要卡片。通常用于章节开头的综述。
*   **`col-span` (跨列)**:
    *   默认为 `1`。
    *   `2`, `3`, `4`: 让卡片跨越更多列，用于强调重要性或适应长内容。
    *   **AI 策略**: 重要的卡片（如“核心贡献”）应设为 `col-span=2` 或 `col-span=3` 以打破网格的单调感。
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

2.  **Layout Strategy (L1 Attributes)**:
    - For "Abstract/Highlights/Metrics": Use `{layout="grid" columns=4}`.
    - For "Introduction/Background": Use `{layout="grid" columns=3}` or `{layout="single"}` (if narrative).
    - For "Methodology/Architecture": Use `{layout="grid" columns=2}` or `{layout="grid" columns=3}`.
    - For "Comparison/Results": Use `{layout="grid" columns=3}`.

3.  **Card Styling (L2 Attributes)**:
    - **Key Metrics** (e.g., "Accuracy 98%", "Speed 10x"): MUST use `{card-style="stat"}`.
    - **Core Concepts/Definitions**: Use `{card-style="highlight"}`.
    - **Quotes/Feedback**: Use `{card-style="quote"}`.
    - **Code/Algorithms/Tech Stack**: Use `{card-style="code"}`.
    - **General Text**: Use `{card-style="normal"}`.
    - **Important Cards**: Add `col-span=2` or `col-span=3` to emphasize them.

4.  **Content Refinement**:
    - **Summarize**: Do not paste long paragraphs. Break them into bullet points or short summaries.
    - **Title Extraction**: Card titles (`### Title`) should be punchy and descriptive (2-6 words).
    - **Visual Rhythm**: Mix `col-span=1` and `col-span=2` cards to create a dynamic grid layout, avoiding a boring "wall of text".

# Example Output

---
title: "Project Alpha"
subtitle: "Next-Gen AI Rendering Engine"
tags: ["AI", "Rendering", "Optimization"]
---

## Core Highlights {layout="grid" columns=4 section-color="chart-1"}

### 10x Performance {card-style="stat"}
Optimized rendering pipeline reduces latency by 90%.

### Zero Config {card-style="highlight" col-span=2}
Fully automated setup with smart defaults. No manual tuning required.

### 99.9% Uptime {card-style="stat"}
Enterprise-grade reliability.

## Architecture {layout="grid" columns=3}

### Frontend Layer {card-style="normal"}
Built with React and Tailwind for maximum flexibility.

### AI Core {card-style="code" col-span=2}
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
    *   将“结果”拆为 `stat` 卡片。

### 4.2 如何处理实验数据 (Experiments)
*   **不要**：仅仅列出表格。
*   **要**：使用 `stat` 卡片展示最关键的提升指标（如 "SOTA +2.5%"）。
*   **要**：使用 `col-span=2` 的 `highlight` 卡片解释数据背后的原因。

### 4.3 如何处理技术架构 (Architecture)
*   **不要**：用纯文本描述流程。
*   **要**：使用 `code` 样式卡片展示模块名称或伪代码。
*   **要**：使用 `columns=3` 的网格布局，按逻辑顺序（输入->处理->输出）排列卡片。

### 4.4 视觉节奏 (Visual Rhythm)
*   避免所有卡片都是 `col-span=1`。
*   尝试 `1-2-1` 或 `2-1-1` 的排列模式。
*   在每个 Section 的开头或结尾，使用一个 `col-span=full` (即等于列数) 的卡片作为综述或总结。

---

## 5. 常见错误自检 (Self-Correction)

*   **错误 1**: `## Introduction` 下面直接写了 "This paper proposes..."。
    *   **修正**: 必须包裹在 `### Background {card-style="normal"}` 中。
*   **错误 2**: `### Result` 卡片里写了 "Accuracy is 95%."。
    *   **修正**: 改为 `### Accuracy {card-style="stat"}`，内容写 "95%"。
*   **错误 3**: 整个文档只用了一种 `card-style="normal"`。
    *   **修正**: 根据语义，至少应用 3 种不同的样式（如 `stat` 用于数字，`highlight` 用于重点，`quote` 用于引用）。
