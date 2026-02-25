# CHD 渲染引擎架构升级方案 (CHD Rendering Engine Architecture Upgrade Proposal)

## 1. 背景与目标 (Background & Objectives)

当前 CHD (Card-Human-Design) 渲染引擎基于标准的 CSS Grid/Flex 布局系统，虽然在结构化内容的呈现上表现优异，但在应对高自由度、艺术化、非线性叙事的场景时显得力不从心。

**目标**：
从“排版工具”进化为“视觉设计引擎”。
1.  **相对位置支持 (Relative Positioning)**：打破 Grid 限制，支持卡片的自由定位、重叠、旋转和层级控制。
2.  **卡片样式升级 (Card Style Upgrade)**：解耦形状与内容，支持异形卡片（非矩形）、复杂阴影和动态纹理。
3.  **架构健壮性 (Robustness)**：引入策略模式，确保新增布局和样式不会破坏现有逻辑，保持系统的可维护性。

## 2. 现状分析 (Current Analysis)

### 2.1 布局系统的局限性
目前 `Section.tsx` 强绑定于 Tailwind CSS 的 `grid-cols-*` 系统。
- **痛点**：无法实现“中心辐射”、“时间轴”、“堆叠卡片”等非网格布局。
- **代码耦合**：布局逻辑通过大量的 `if (isGrid)` 判断硬编码在组件内，扩展新布局需要修改核心代码，违反“开闭原则”。

### 2.2 卡片样式的单一性
目前 `Card.tsx` 假设所有卡片都是矩形（`rounded-*`）。
- **痛点**：无法实现圆形、菱形、平行四边形或自定义 SVG 路径的卡片。
- **技术冲突**：若直接引入 `clip-path` 实现异形，会裁剪掉 CSS `box-shadow`，导致卡片失去立体感。

### 2.3 属性解析的潜力
`attributeParser.ts` 已经支持 `key="value"` 的通用解析，这为我们引入复杂的配置属性提供了坚实的基础，无需修改解析内核。

## 3. 核心架构设计 (Core Architecture Design)

### 3.1 布局引擎：策略模式 (Layout Strategy Pattern)

不再由 `Section` 组件直接决定渲染方式，而是根据 `layout` 属性委托给具体的**布局策略**。

**架构变更**：
```typescript
// 伪代码：Section 组件重构
const LAYOUT_STRATEGIES = {
  grid: GridLayout,      // 现有 Grid 系统
  flex: FlexLayout,      // 现有 List/Row 系统
  canvas: CanvasLayout,  // [NEW] 自由画布/绝对定位系统
  timeline: TimelineLayout, // [NEW] 时间轴布局
  hub: HubLayout,        // [NEW] 中心辐射布局
};

const Section = ({ layoutProps, cards }) => {
  const LayoutComponent = LAYOUT_STRATEGIES[layoutProps.layout] || GridLayout;
  return <LayoutComponent config={layoutProps} cards={cards} />;
};
```

### 3.2 样式系统：组合模式 (Composition Pattern)

将卡片拆解为三个正交的维度：**容器(Container)**、**形状(Shape)**、**内容(Content)**。

**DOM 结构升级**：
```html
<!-- Card Wrapper: 负责定位、尺寸、外阴影 (Filter Drop-shadow) -->
<div class="card-wrapper" style="transform: translate(...) rotate(...)">
  
  <!-- Shape Mask: 负责裁剪形状、背景色、边框 -->
  <div class="card-shape" style="clip-path: polygon(...)">
    
    <!-- Content: 负责文字、图片渲染 -->
    <div class="card-content">
      ...
    </div>
  </div>
</div>
```

### 3.3 坐标与定位系统 (Coordinate & Positioning System)

为了支持相对位置，我们需要在 CSS 变量层面建立一套坐标系。

- **属性扩展**：
  - `pos="x,y"`: 相对父容器的百分比或像素坐标。
  - `dim="w,h"`: 显式指定尺寸（覆盖 Grid 默认行为）。
  - `z="10"`: 层级控制。
  - `rot="15deg"`: 旋转角度。

- **实现机制**：
  使用 CSS Custom Properties 传递数据，避免 React 重复渲染。
  ```css
  .card-wrapper {
    position: absolute; /* 在 Canvas 布局下 */
    left: var(--pos-x);
    top: var(--pos-y);
    width: var(--dim-w);
    height: var(--dim-h);
    transform: rotate(var(--rot));
    z-index: var(--z);
  }
  ```

## 4. 详细技术规范 (Technical Specifications)

### 4.1 扩展 CHD 协议

#### 4.1.1 Section 属性扩展
```markdown
:: section { layout="canvas" height="600px" bg="dots" }
```
- `layout="canvas"`: 激活自由布局模式。
- `height`: 强制指定容器高度（自由布局必须指定高度）。

#### 4.1.2 Card 属性扩展
```markdown
:: card { 
  shape="hexagon" 
  pos="10%,20%" 
  dim="200px,auto" 
  rot="-5deg" 
  z="2" 
}
```

### 4.2 形状注册表 (Shape Registry)
建立预设形状库，支持通过属性直接调用。
- `rect` (默认)
- `circle` / `pill`
- `hexagon` (六边形)
- `diamond` (菱形)
- `ticket` (缺角票据)
- `message` (聊天气泡)

### 4.3 阴影处理方案 (Shadow Handling)
- **常规矩形**：继续使用 `box-shadow`。
- **异形卡片**：自动切换为 `filter: drop-shadow()`。注意 `drop-shadow` 的性能消耗略高于 `box-shadow`，需在大量卡片时做性能监控。

## 5. 实施路线图 (Implementation Roadmap)

### Phase 1: 基础重构 (Refactoring)
- [ ] 提取 `GridLayout` 和 `FlexLayout` 为独立组件。
- [ ] 重构 `Section.tsx` 为策略分发器。
- [ ] 验证现有功能无回归。

### Phase 2: 样式增强 (Style Enhancement)
- [ ] 实现 `Shape` 组件，支持 `clip-path`。
- [ ] 升级 `Card.tsx` 结构，支持 `shape` 属性。
- [ ] 解决异形卡片的阴影渲染问题。

### Phase 3: 自由布局 (Free Layout)
- [ ] 实现 `CanvasLayout` 策略。
- [ ] 解析 `pos`, `dim`, `rot` 属性并映射到 CSS 变量。
- [ ] 在原型页面中测试自由布局效果。

## 6. 风险与规避 (Risks & Mitigation)

1.  **移动端适配**：
    *   *风险*：绝对定位在移动端可能导致重叠混乱。
    *   *对策*：引入 `mobile-layout="stack"` 属性。在小屏幕下，强制回退到流式堆叠布局，忽略绝对坐标。

2.  **性能问题**：
    *   *风险*：过多的 `drop-shadow` 和复杂 `clip-path` 可能导致滚动掉帧。
    *   *对策*：使用 `will-change: transform` 开启 GPU 加速；对静态卡片考虑使用 SVG 图片背景代替 CSS 裁剪。

3.  **内容溢出**：
    *   *风险*：异形裁剪可能切掉部分文字内容。
    *   *对策*：在 `Card` 内部增加 `padding-safe-area` 逻辑，根据不同形状预设内边距。
