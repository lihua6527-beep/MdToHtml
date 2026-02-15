# 关系定义与样式继承测试

## 1. 并列关系测试 (Parallel) {relation="parallel", columns=3, card-style="normal"}

### 模块 A

这是并列关系中的第一个模块。
所有模块应该保持相同的高度和样式。

### 模块 B

这是并列关系中的第二个模块。
即使内容长度稍有不同，它们也应该对齐。

### 模块 C

这是并列关系中的第三个模块。
样式（card-style）统一由 Section 定义为 normal。

## 2. 总分关系测试 (Total-Part) {relation="total-part", columns=3, card-style="highlight"}

### 核心总述

这是一个总分关系的“总”部分。
根据逻辑，它应该占据更显著的位置（如左侧两列或全宽）。
所有子卡片都继承 Section 的 highlight 样式。

### 分支 1

细节分支 1。

### 分支 2

细节分支 2。

### 分支 3

细节分支 3。

## 3. 样式继承测试 (Stat) {relation="parallel", columns=2, card-style="stat"}

### 关键指标 A

99.9%

### 关键指标 B

< 10ms

### 关键指标 C

100 TB
