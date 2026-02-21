# MdToHtml 项目开发规划与分析报告

## 1. 已完成工作评估 (Completed Work Assessment)

经过对项目代码库的深入检查，当前状态评估如下：

### ✅ 1.1 项目结构与基础 (Project Structure)
- **完整性**: 项目基于 Next.js 14 构建，结构清晰。
- **目录**: `MdToHtml/src/` 下包含了 `components/CHD/` (核心渲染)、`lib/chdParser.ts` (解析器)、`app/` (路由) 等关键目录。
- **协议**: 根目录下存在 `CHD协议规范_v1.1.md`，为开发提供了明确的指导。

### ✅ 1.2 Markdown 解析机制 (Markdown Parsing)
- **状态**: `src/lib/chdParser.ts` 已实现了基础的 CHD 块解析。
- **功能**:
  - 支持 L0 (Frontmatter)、L1 (Section `##`)、L2 (Card `###`)、Code Block 的识别。
  - **待完善**: 目前解析逻辑较为基础，缺乏对复杂文本结构（如并列、总分、递进）的语义细粒度切分，仅支持按行或代码块粗粒度处理。

### ⚠️ 1.3 组件与样式系统 (Components & Styling)
- **卡片组件**: `src/components/CHD/Card.tsx` 已实现基础版本。
  - **现有样式**: `normal`, `highlight`, `stat`, `quote`, `warning`, `code`, `summary`。
  - **样式实现**: 使用 Tailwind CSS，但颜色硬编码在 `styleVariants` 对象中，**尚未实现动态 CSS 变量主题切换**。
- **布局**: `Section.tsx` 支持基础的 Grid 布局 (`col-span`, `row-span`)。
- **扩展性**: 样式系统目前耦合度较高，缺乏统一的主题配置文件。

### ❌ 1.4 数据与训练 (Data & Training)
- **状态**: `data/` 目录**不存在**。
- **结论**: 目前尚未建立用于 AI 训练的 Markdown 输入/输出样本对，需从零构建。

---

## 2. 待完成核心功能开发 (Core Features to be Developed)

基于目标差距分析，以下功能需按优先级开发：

1.  **Markdown 语义切分模块 (Semantic Splitter)**
    - **目标**: 超越简单的 Header 切分，识别段落间的逻辑关系（并列/递进）。
    - **实现**: 升级 `chdParser.ts`，增加 AST (Abstract Syntax Tree) 深度分析。

2.  **扩展卡片组件库 (Expanded Card Library)**
    - **目标**: 丰富视觉表现。
    - **内容**: 增加 `TimelineCard` (时间轴), `ComparisonCard` (对比), `StepCard` (步骤), `ImageCard` (图文)。

3.  **智能样式映射系统 (Smart Style Mapping)**
    - **目标**: 解决"什么内容用什么样式"的问题。
    - **实现**: 建立 `Content Type -> Card Style` 的规则引擎。

4.  **主题切换系统 (Theme System)**
    - **目标**: 一键换肤。
    - **实现**: 重构 Tailwind 配置，全面使用 CSS Variables (`var(--primary)`, `var(--bg-card)`)。

5.  **可视化编辑器 (Visual Editor)**
    - **目标**: 降低使用门槛。
    - **实现**: 在现有双栏预览基础上，增加属性面板 (Side Panel) 用于调整卡片参数。

6.  **数据记录系统 (Data Logger)**
    - **目标**: 积累 AI 训练数据。
    - **实现**: 在转换过程中自动保存 `input.md` 和 `structure.json` 到 `data/` 目录。

---

## 3. 开发优先级排序 (Development Priority)

### 🚀 第一阶段：解析器完善 (High Priority)
- **任务**: 升级 `chdParser.ts`。
- **产出**: 能完美识别 Markdown 中的列表、引用、嵌套结构，并将其转化为结构化的 JSON 对象。
- **耗时**: 约 200 分钟。

### 🛠️ 第二阶段：组件库扩展 (Medium Priority)
- **任务**: 开发 10+ 种新卡片组件。
- **产出**: `src/components/CHD/cards/` 下丰富的组件集合。
- **耗时**: 约 150 分钟。

### 🎨 第三阶段：样式与主题 (Medium Priority)
- **任务**: CSS 变量重构与多主题实现。
- **产出**: 支持 "深色模式"、"科技蓝"、"护眼绿" 等 5-8 套主题。
- **耗时**: 约 125 分钟。

### 📊 第四阶段：编辑器与数据 (Low Priority)
- **任务**: 开发 UI 属性面板与数据埋点。
- **产出**: 可视化编辑界面 + `data/` 样本库。
- **耗时**: 约 100 分钟。

---

## 4. 前端组件库调研 (Frontend Component Library Research)

为了加速开发，建议参考以下成熟方案的设计模式：

| 组件库 | 参考价值 | 关键借鉴点 |
| :--- | :--- | :--- |
| **Ant Design** | ⭐⭐⭐⭐⭐ | **Card 组件的 Actions/Cover 设计**；ConfigProvider 全局主题配置方案（基于 CSS 变量）。 |
| **Element Plus** | ⭐⭐⭐⭐ | **Shadow 属性** (always/hover/never) 的控制逻辑；简洁的 Header/Body 插槽设计。 |
| **View UI** | ⭐⭐⭐ | **Displace (幽灵节点)** 设计；适用于后台管理系统的卡片排版。 |
| **ProComponents** | ⭐⭐⭐⭐⭐ | **ProCard** 的可折叠、分栏、Tabs 嵌套设计，非常适合复杂信息展示。 |
| **Semi Design** | ⭐⭐⭐⭐ | 抖音风格的**极简设计**，适合内容阅读型产品。 |

**推荐资源**:
- GitHub: `ant-design/ant-design` (关注 `components/card`)
- GitHub: `element-plus/element-plus` (关注 `packages/components/card`)
- 博客: "React 组件设计模式 - 卡片组件的最佳实践"

---

## 5. 下一步行动计划 (Next Steps)

我们将立即启动 **第一阶段：完善 Markdown 解析器**。

**具体任务**:
1.  创建一个测试用的 Markdown 文件 (`input/test_structure.md`)，包含各种复杂的文本结构。
2.  修改 `chdParser.ts`，引入 `remark` 生态插件增强解析能力。
3.  验证解析结果是否能正确输出层级化的 JSON 数据。
