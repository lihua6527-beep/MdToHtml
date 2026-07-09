# CHD 协议 v2.1：面向 AI 的生成规范 (CHD Protocol for AI Generation)

**版本**: v2.1
**日期**: 2026-03-22
**状态**: **已生效 (Active)**
**适用对象**: AI 助手 (LLMs), 内容创作者, 自动化脚本
**向后兼容**: 支持 v1.5 及以上版本的 CHD 文档

---

## 1. 核心理念 (Core Philosophy)

**"Structure First, Content Condensed" (结构优先，内容精炼)**

CHD (Card-based Hierarchical Document) 协议不仅仅是一种 Markdown 格式，更是一种**信息可视化的设计语言**。当 AI 解析一篇长文（如论文、项目报告）并生成 CHD 文档时，它不应仅仅充当"翻译器"，而必须成为一名**高级信息架构师**。

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
icon: "logo"            # 选填，文档左上角图标
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
### 突破全网拓扑假设 {card-style="highlight" icon="zap"}
这里是卡片的正文内容...
```

*   **`card-style` (样式)**:
    *   `"normal"`: 标准卡片（默认）。适合一般性描述。
    *   `"highlight"`: 高亮卡片。适合核心观点、重要结论。
    *   `"quote"`: 引用卡片。适合名言、用户评价、设计理念。
    *   **兼容性说明**: 为保证向后兼容，系统仍支持识别 `stat`, `warning`, `summary`, `code` 等旧版样式，但会自动将其映射到对应的新版样式。
    *   **注**: AI 生成时请优先使用上述 3 种推荐样式。代码块应使用标准 Markdown 格式处理。

*   **`icon` (图标)**:
    *   **可选属性**：为卡片添加左上角视觉图标，增强视觉表现力。
    *   **允许的值**：请参考 `docs/技术规范与前端规范/卡片图标资产库.md` 中的图标列表。
    *   **使用规则**：
        *   **成套使用**：同一 `Section` 下的所有卡片，要么都使用图标，要么都不使用图标。
        *   **相关性**：选择与卡片内容相关的图标。
        *   **限制**：图标只能在标准矩形卡片中使用。
        *   **命名规范**：请遵循 `docs/技术规范与前端规范/图标命名规范.md` 中的命名规则。
    *   **AI 策略**：
        *   可以为卡片添加图标以增强视觉效果。
        *   确保在同一 Section 内保持图标使用的一致性。
        *   只在需要突出显示的卡片中使用图标，避免过度使用。
        *   当不确定图标名称时，使用通用的图标名称，系统会自动处理不存在的图标。

### L2.2: 支持的图标列表 (Supported Icons)

以下是 CHD 协议支持的所有图标列表，按分类组织：

#### 基础图标 (Basic Icons)
- **zap**: 创新、能量、快速、高效
- **cpu**: 技术、性能、计算、架构
- **chart**: 数据、分析、统计、趋势
- **chart3**: 高级数据、复杂分析、多维度统计
- **award**: 成就、奖项、荣誉、认可
- **rocket**: 增长、启动、推进、突破
- **clock**: 时间、计划、进度、截止日期
- **alert**: 警告、注意、提示、安全
- **check**: 成功、完成、验证、确认
- **checksquare**: 任务完成、清单、确认
- **network**: 连接、网络、关系、协作
- **eye**: 观察、监控、查看、洞察
- **tag**: 标签、分类、标记、关键词
- **layers**: 层次、结构、组织、组件
- **box**: 容器、包装、存储、内容
- **globe**: 全球、国际化、地球、多元文化
- **trending**: 趋势、增长、上升、进步
- **book**: 知识、学习、文档、教育
- **message**: 沟通、对话、消息、交流
- **settings**: 设置、配置、选项、偏好
- **user**: 用户、个人、账号、个人资料
- **users**: 团队、用户群、社区、合作
- **userplus**: 添加用户、邀请、注册、新成员
- **shield**: 安全、保护、防御、隐私
- **lightbulb**: 创意、想法、灵感、创新
- **calendar**: 日期、计划、安排、日程
- **dollar**: 财务、金钱、价值、投资
- **target**: 目标、目的、焦点、方向
- **star**: 星级、评分、优秀、突出
- **heart**: 喜欢、爱、情感、关注
- **bookmark**: 收藏、保存、标记、重要
- **camera**: 图片、摄影、视觉、媒体
- **cloud**: 云存储、云端、在线、备份
- **database**: 数据、存储、数据库、信息
- **download**: 下载、获取、保存、离线
- **file**: 文件、文档、资料、内容
- **filetext**: 文本文件、文档、文章、报告
- **filecode**: 代码文件、编程、开发、脚本
- **fileimage**: 图片文件、图像、视觉、设计
- **filevideo**: 视频文件、影片、媒体、演示
- **fileaudio**: 音频文件、音乐、声音、播客
- **filespreadsheet**: 电子表格、数据、表格、计算
- **filearchive**: 压缩文件、归档、存储、备份
- **filter**: 筛选、过滤、分类、排序
- **flag**: 标记、旗帜、国家、地区
- **folder**: 文件夹、目录、组织、存储
- **gift**: 礼物、奖励、优惠、惊喜
- **github**: 代码托管、版本控制、开发、协作
- **home**: 首页、主页、开始、返回
- **image**: 图片、图像、视觉、设计
- **key**: 密钥、权限、访问、安全
- **link**: 链接、连接、关联、引用
- **lock**: 锁定、安全、保护、隐私
- **mail**: 邮件、通信、消息、联系
- **map**: 地图、位置、导航、方向
- **menu**: 菜单、选项、导航、列表
- **moon**: 夜晚、暗色模式、睡眠、宁静
- **music**: 音乐、音频、声音、娱乐
- **pentool**: 编辑、设计、绘画、创作
- **piechart**: 饼图、数据、比例、分布
- **search**: 搜索、查找、探索、发现
- **share2**: 分享、传播、合作、社交
- **sun**: 白天、亮色模式、能量、活力
- **upload**: 上传、提交、分享、同步
- **video**: 视频、影片、媒体、演示
- **wifi**: 网络、连接、无线、信号
- **code**: 代码、编程、开发、脚本
- **clipboard**: 剪贴板、复制、粘贴、内容
- **git-branch**: 分支、版本控制、开发、协作
- **grid**: 网格、布局、组织、结构
- **layout**: 布局、设计、安排、组织
- **list**: 列表、项目、清单、组织
- **monitor**: 显示器、屏幕、设备、显示
- **package**: 包、软件、部署、分发
- **server**: 服务器、后端、主机、服务
- **smartphone**: 手机、移动设备、便携、通讯
- **tablet**: 平板、设备、便携、显示
- **terminal**: 终端、命令行、开发、系统
- **chevronright**: 向右、前进、下一步、展开
- **chevrondown**: 向下、展开、显示、下拉
- **chevronup**: 向上、收起、隐藏、上拉
- **chevronleft**: 向左、后退、上一步、收起

#### 新增图标 (New Icons)
- **signal**: 信号、网络、连接、通信
- **refresh**: 刷新、更新、重试、循环
- **timer**: 时间、定时器、倒计时、准时
- **history**: 历史、记录、过去、回顾
- **phone**: 手机、移动设备、通信、联系
- **index**: 索引、搜索、查找、定位
- **memory**: 内存、存储、缓存、数据
- **tree**: 树、自然、环境、生态
- **controller**: 控制器、控制、管理、指挥
- **service**: 服务、服务层、后端、支持
- **data**: 数据、信息、资料、内容
- **spring**: 弹簧、弹性、Spring框架、复苏
- **storage**: 存储、硬盘、保存、备份
- **mobile**: 移动、手机、便携、无线
- **expand**: 扩展、放大、增长、发展
- **edge**: 边缘、边界、边缘计算、前沿

#### 区块链相关图标 (Blockchain Icons)
- **blockchain**: 区块链、分布式账本、加密货币、智能合约
- **bitcoin**: 比特币、加密货币、数字资产、金融

#### 机器学习相关图标 (Machine Learning Icons)
- **brain**: 人工智能、机器学习、神经网络、认知
- **ml**: 机器学习、数据科学、模型训练、预测

#### 密码学相关图标 (Cryptography Icons)
- **cryptography**: 密码学、加密、安全、隐私
- **hash**: 哈希、加密、数据完整性、验证

#### 视觉相关图标 (Vision Icons)
- **vision**: 视觉、计算机视觉、图像识别、视觉处理
- **camera**: 相机、摄影、图像捕获、视觉输入

#### 测试相关图标 (Testing Icons)
- **test**: 测试、验证、质量保证、自动化测试
- **automation**: 自动化、脚本、流程、效率

#### 微信小程序文档中使用的图标 (WeChat Mini Program Icons)
- **tool**: 工具、构建、开发、调试
- **pen-tool**: 编辑、设计、绘画、创作
- **trending-up**: 趋势、增长、上升、进步
- **bar-chart**: 柱状图、数据、分析、统计
- **pie-chart**: 饼图、数据、比例、分布
- **send**: 发送、提交、传输、通信
- **alert-circle**: 警告、注意、提示、安全
- **type**: 文本、字体、排版、命名
- **message-square**: 消息、对话、交流、注释
- **activity**: 活动、动态、数据、响应
- **git-branch**: 分支、版本控制、开发、协作
- **book-open**: 文档、指南、学习、参考

#### 进程通信与状态流转分析文档中使用的图标 (Process Communication Icons)
- **share**: 分享、传播、合作、社交
- **save**: 保存、存储、持久化、备份
- **promise**: 承诺、异步、保证、契约
- **bell**: 通知、提醒、警报、消息
- **cycle**: 循环、周期、流程、轮转
- **pipe**: 管道、通信、流、传输
- **queue**: 队列、顺序、等待、处理

#### 其他图标 (Other Icons)
- **workflow**: 工作流、流程、步骤、顺序
- **check-circle**: 成功、完成、验证、确认
- **wrench**: 工具、维修、调整、设置
- **puzzle**: 拼图、组件、集成、组合
- **scan**: 扫描、搜索、检测、分析
- **hard-drive**: 硬盘、存储、数据、设备

### L2.3: 富文本支持 (Rich Text Support)
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
    - **Allowed Styles Only**: `normal`, `highlight`, `quote`.
    - **Core Concepts/Stats/Math**: Use `{card-style="highlight"}`. **Math MUST use LaTeX**.
    - **Quotes/Feedback**: Use `{card-style="quote"}`.
    - **Code/Config**: Use `{card-style="normal"}` (or `highlight`) with standard Markdown code blocks, and add language identifier (e.g., ```javascript).
    - **General Text**: Use `{card-style="normal"}`.
    - **Consistency**: Maintain style consistency within a section.
    - **No Col-Span**: Do NOT use `col-span`. All cards must be equal width.
    - **Icons**:
        - **Optional**: You may add icons to cards using `{icon="icon-name"}`.
        - **Icon List**: Refer to the icon library for available icon names.
        - **Consistency Rule**: If you use icons in a section, ALL cards in that section MUST have an icon. Do NOT mix cards with and without icons in the same section.
        - **Relevance**: Choose icons that are relevant to the card content.
        - **Moderation**: Use icons sparingly to avoid visual clutter.

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

### 10x Performance {card-style="highlight" icon="zap"}
Optimized rendering pipeline reduces latency by 90%.

### Zero Config {card-style="highlight" icon="settings"}
Fully automated setup with smart defaults. No manual tuning required.

### 99.9% Uptime {card-style="highlight" icon="check"}
Enterprise-grade reliability.

### Math Ready {card-style="highlight" icon="cpu"}
Supports LaTeX: $ E = mc^2 $.

## Architecture {layout="grid" columns=3}

### Frontend Layer {card-style="normal" icon="layers"}
Built with React and Tailwind for maximum flexibility.

### AI Core {card-style="normal" icon="cpu"}
Powered by a custom transformer model optimized for structural understanding.

## User Feedback {layout="grid" columns=2}

### "Game Changer" {card-style="quote" icon="message"}
This tool completely revolutionized our workflow.

### "Must Have" {card-style="quote" icon="star"}
I can't imagine working without it anymore.
```

---

## 4. 最佳实践 (Best Practices)

### 4.1 如何处理论文摘要 (Abstract)
*   **不要**：直接复制一大段摘要文本。
*   **要**：将其拆解为 `## 核心亮点` 或 `## 论文概览`。
    *   将"背景"拆为一个卡片。
    *   将"贡献"拆为 2-3 个 `highlight` 卡片。
    *   将"结果"拆为 `highlight` 卡片（并在文中加粗数据）。

### 4.2 如何处理实验数据 (Experiments)
*   **不要**：仅仅列出表格。
*   **要**：使用 `highlight` 卡片展示最关键的提升指标（如 "**SOTA +2.5%**"）。
*   **要**：使用 `normal` 卡片解释数据背后的原因。

### 4.3 如何处理技术架构 (Architecture)
*   **不要**：用纯文本描述流程。
*   **要**：使用 `normal` 样式卡片展示模块名称或伪代码，使用标准 Markdown 代码块。
*   **要**：使用 `columns=3` 的网格布局，按逻辑顺序排列。
*   **兼容性说明**：对于包含代码块的卡片，系统会将其作为卡片内容的一部分处理，确保旧版文档中的代码块能正确渲染。

### 4.4 视觉一致性 (Visual Consistency)
*   **强制网格**: 严格遵守 `1-4 张 = N 列`，`5+ 张 = 3 列` 的规则。
*   **避免孤儿**: 确保每行卡片数量平衡。例如 5 张卡片会排成 `3 + 2`，这是允许的。
*   **不要**: 尝试使用 `col-span` 或 `row-span` 来创造"艺术感"。在 v2.0 中，整齐划一是最高优先级。
*   **AI 智能列数**:
    *   **1-4 张卡片**: 列数 = 卡片数 (如 3张 -> `columns=3`)。
    *   **5+ 张卡片**: **强制** `columns=3`。这能保证最佳的阅读体验（如 5张排成 3+2，6张排成 3+3）。
    *   **避免拥挤**: 尽量不要使用 `columns=4`，除非卡片内容极短。绝大多数情况下，`columns=3` 是最佳选择。
*   **Section 内部一致性**: 同一个 Section 下的 Card 样式应尽可能保持统一。
*   **特殊区域例外 (Footer Exceptions)**: 对于文档的结尾部分（如"引言"、"总结"、"参考文献"），允许其样式与正文部分不同。例如，可以使用 `card-style="quote"` 来突出总结性陈述。

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
*   **错误 4**: 公式使用了代码块包裹，如 `` `E=mc^2` ``。
    *   **修正**: 必须使用 LaTeX 语法 `$ E=mc^2 $`，并使用 `highlight` 或 `normal` 样式。