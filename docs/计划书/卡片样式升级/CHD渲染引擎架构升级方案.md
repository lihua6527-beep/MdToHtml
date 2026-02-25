# CHD 渲染引擎架构升级方案 (Style Priority Edition)

## 1. 背景与目标 (Background & Objectives)

本方案基于“样式优先”的原则，旨在首先解决卡片样式的单一性问题，引入组合模式，支持异形卡片、复杂阴影和动态纹理。

**核心策略**：
1.  **卡片样式升级 (Card Style Upgrade)**：**[当前重点]** 引入组合模式，支持异形卡片、复杂阴影和动态纹理。
2.  **样式组合 (Style Composition)**：通过 Wrapper/Shape/Content 分离实现灵活的样式组合。

## 2. 核心架构设计 (Core Architecture Design)

### 2.1 样式系统：组合模式 (Composition Pattern) **[实施重点]**

将卡片拆解为三个正交的维度，以支持异形样式而不牺牲阴影效果。

**DOM 结构升级**：
```html
<!-- Card Wrapper: 负责定位、尺寸、外阴影 (Filter Drop-shadow) -->
<div class="card-wrapper relative">
  
  <!-- Shape Mask: 负责裁剪形状、背景色、边框 -->
  <div class="card-shape" style="clip-path: polygon(...)">
    
    <!-- Content: 负责文字、图片渲染 -->
    <div class="card-content">
      ...
    </div>
  </div>
</div>
```

**属性映射**：
-   `shape="hexagon"` -> 应用六边形 clip-path。
-   `shadow="xl"` -> 应用 CSS `filter: drop-shadow(...)` (针对异形) 或 `box-shadow` (针对矩形)。

## 3. 详细技术规范 (Technical Specifications)

### 3.1 卡片属性扩展 (Card Attributes)
```markdown
:: card { 
  shape="ticket"      <!-- [New] 形状: rect, circle, ticket, message -->
  badge="HOT"         <!-- [New] 徽标 -->
  texture="noise"     <!-- [New] 纹理叠加 -->
}
```

## 4. 实施路线图 (Implementation Roadmap)

### Phase 1: 样式增强 (Style Enhancement)
- [ ] 创建 `CardWrapper` 和 `CardShape` 组件。
- [ ] 实现基础形状库 (Circle, Pill, Ticket)。
- [ ] 解决异形卡片的 `drop-shadow` 渲染问题。

### Phase 2: 验证 (Verification)
- [ ] 验证现有 Grid 布局显示正常（无回归）。
- [ ] 验证新卡片形状 (`shape="..."`) 渲染正确。
