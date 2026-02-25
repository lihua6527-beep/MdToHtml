# CHD 渲染引擎架构升级方案 (Layout Deferred Edition)

## 1. 背景 (Background)

本预案详细描述了暂缓实施的高级布局功能。这些功能将在卡片样式升级（Phase 1）完成后，视需求在后续版本中逐步引入。

## 2. 规划中的布局策略 (Planned Layout Strategies)

### 2.1 自由画布 (Canvas Layout)
- **特性**：允许卡片通过 `x, y, rot, z` 属性进行绝对定位。
- **场景**：海报设计、复杂的重叠视觉效果。
- **技术难点**：响应式适配（需实现 Mobile Stack 回退）。

### 2.2 时间轴 (Timeline Layout)
- **特性**：卡片沿中心线或侧边线垂直排列，自动连接节点。
- **场景**：历史沿革、项目里程碑、日志记录。
- **属性**：`line-style="solid|dashed"`, `node-icon="..."`

### 2.3 中心辐射 (Hub Layout)
- **特性**：中心卡片突出显示，子卡片环绕排列。
- **场景**：思维导图、核心概念解析。

## 3. 接口预留 (Interface Reservation)

当前架构已通过 `ILayoutStrategy` 预留了扩展点。
未来只需实现对应的策略类并注册到 `LayoutRegistry` 即可激活上述布局，无需修改 `Section` 核心逻辑。

```typescript
// Future Implementation Example
const TimelineLayout: ILayoutStrategy = {
  id: 'timeline',
  render: (ctx) => {
    return <div className="timeline-container">...</div>
  }
};
LayoutRegistry.register(TimelineLayout);
```
