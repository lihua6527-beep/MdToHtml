# 小模型任务定义书 (AI Model Task Specification)

## 1. 概述
本文档旨在定义用于辅助 CHD (Card-Hierarchy-Data) 协议处理的小模型（Small Language Model, SLM）的具体工作职责。基于当前编辑器的功能短板与 CHD 协议的特性，我们将模型的核心任务聚焦于 **"理解-纠错-切块-增强"** 四个维度。

## 2. 核心任务矩阵

### 任务一：智能纠错与协议清洗 (Protocol Sanitization)
**目标**：将非标准、含糊或错误的 Markdown 输入转化为严格符合 CHD 规范的文本。

- **输入**：用户随手输入的 Markdown 文本。
- **模型工作**：
  1.  **层级修复**：检测跳跃的标题层级（如 `H1` 直接接 `H3`），自动插入虚拟 `H2` 容器。
  2.  **闭合检查**：补全未闭合的属性括号 `{`。
  3.  **语法标准化**：将自然语言描述的属性（如 "用红色显示"）转化为标准 CHD 属性（`{card-style="warning"}`）。
- **Example**:
  ```markdown
  [Input]
  # 销售报告
  ### 第一季度数据
  有些下滑 {style=alert
  
  [Output]
  # 销售报告
  ## 概览 (Auto-Generated)
  ### 第一季度数据 {card-style="warning"}
  有些下滑
  ```

### 任务二：语义切块与卡片化 (Semantic Chunking)
**目标**：解决用户"大段文本粘贴"导致的展示问题，自动将长文本拆解为独立的卡片单元。

- **输入**：一段非结构化的长文本（如会议记录、文章段落）。
- **模型工作**：
  1.  **语义分割**：识别文本中的语义转折点（"首先"、"其次"、"但是"）。
  2.  **摘要提炼**：为每个切分后的片段生成简短的 `### 标题`。
  3.  **结构重组**：将切分后的内容封装为 CHD 卡片流。
- **Example**:
  ```markdown
  [Input]
  昨天服务器挂了，原因是内存溢出，我们重启了服务，未来计划增加监控。
  
  [Output]
  ## 事故复盘
  ### 故障现象 {card-style="warning"}
  昨天服务器挂了，原因是内存溢出。
  
  ### 临时处置
  我们重启了服务。
  
  ### 改进计划 {card-style="highlight"}
  未来计划增加监控。
  ```

### 任务三：内容理解与属性增强 (Content Tagging)
**目标**：基于卡片内容的语义，自动推荐最佳的渲染样式和元数据。

- **输入**：一个标准 CHD 卡片的内容。
- **模型工作**：
  1.  **类型分类**：判断内容是 "数据指标"、"代码片段"、"引用语" 还是 "警告"。
  2.  **样式注入**：自动添加 `{card-style="..."}`。
  3.  **布局建议**：根据文本长度推荐 `{col-span="2"}` 或 `{aspect-ratio="16/9"}`。
- **Example**:
  ```markdown
  [Input]
  ### 错误日志
  Error: 500 Internal Server Error at /api/login
  
  [Output]
  ### 错误日志 {card-style="code"}
  ```

### 任务四：自然语言转布局 (NL to Layout)
**目标**：通过自然语言指令直接生成复杂的 Grid 布局结构。

- **输入**：用户指令（如 "帮我生成一个包含左侧导航和右侧数据展示的布局"）。
- **模型工作**：生成包含 `relation="parallel"` 或特定 Grid 属性的 CHD 结构。

## 3. 技术集成方案

### 3.1 接口定义 (I/O)
模型应作为一个纯函数服务集成：
`Result<CHDText> = Model.process(RawText, TaskType)`

### 3.2 训练/微调建议
- **数据集构造**：
  - **正样本**：高质量的 CHD 文档。
  - **负样本**：人工构造的包含层级错误、语法错误、长文本堆砌的文档。
- **Prompt Engineering 重点**：
  - 强调 **"Atomicity" (原子性)**：One Card, One Concept。
  - 强调 **"Hierarchy" (层级)**：Strict H1 -> H2 -> H3。

## 4. 阶段演进规划
- **Phase 1 (规则辅助)**：当前阶段。使用 Regex 和 AST 进行基础校验（已完成）。
- **Phase 2 (小模型 Copilot)**：在编辑器右下角提供 "AI Format" 按钮，一键执行上述的任务一和任务二。
- **Phase 3 (实时流式处理)**：用户输入时，后台模型实时分析并以 "Ghost Text" (灰色文字) 形式建议补全或修正。
