---
title: "组件展示与渲染范式"
subtitle: "系统所有卡片样式与渲染逻辑的临时展示页面"
version: "1.0"
---

## 1. 渲染范式分析报告 {layout="grid", columns=2}

### 核心样式分析 {card-style="summary", col-span=2}

经代码分析，"自研图表引擎"与"百万级数据传输"之所以呈现独特的视觉风格（大号字体、居中、无边框），是因为它们在输入端被显式指定了 `card-style="stat"`。这不是随机渲染，而是基于规则的确定性渲染。

### 渲染规则 {card-style="highlight", col-span=2}

系统目前支持以下渲染范式（Card Styles），每种样式对应特定的视觉表达：

1. **Normal**: 默认样式，白色背景，阴影，适用于普通文本。
2. **Highlight**: 浅灰背景，边框微亮，用于强调内容。
3. **Stat**: **即您喜欢的样式**。居中、大号字体、适合展示关键指标或核心亮点。
4. **Summary**: 全宽、浅色背景，用于章节综述。
5. **Quote**: 左侧边框高亮，引用样式。
6. **Warning**: 红色调，用于警告或风险提示。
7. **Code**: 深色背景，代码风格。

---

## 2. 全组件样式展示 {layout="grid", columns=3}

### 普通卡片 (Normal) {card-style="normal"}

这是最基础的卡片样式，用于承载常规信息。白色背景，带有轻微阴影，鼠标悬停时会有浮起效果。

### 高亮卡片 (Highlight) {card-style="highlight"}

用于需要稍微区分的区块。背景带有极淡的纹理或灰色，边框有微弱的色彩，比普通卡片更醒目。

### 统计/亮点卡片 (Stat) {card-style="stat"}

核心指标

### 统计/亮点卡片 (Stat) {card-style="stat"}

60fps 引擎

### 引用卡片 (Quote) {card-style="quote"}

"设计不仅仅是外观，更是运作方式。" —— 这是一个引用样式的卡片，左侧有明显的强调线。

### 警告卡片 (Warning) {card-style="warning"}

注意：这是一个警告样式的卡片。通常用于显示错误信息、风险提示或需要特别注意的内容。

### 代码/技术卡片 (Code) {card-style="code"}

console.log("Hello World");
// 这是一个代码样式的卡片
// 深色背景，等宽字体

### 宽卡片测试 (Normal) {card-style="normal", col-span=2}

这是一个跨越两列的普通卡片，用于测试布局引擎的网格自适应能力。当内容较多时，使用跨列卡片可以获得更好的阅读体验。

### 总结卡片 (Summary) {card-style="summary", col-span=3}

这是一个跨越全宽（3列）的总结样式卡片。通常放置在章节的开头或结尾，用于概括性描述。
