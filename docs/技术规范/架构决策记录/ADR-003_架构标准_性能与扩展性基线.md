# ADR-003: 架构标准与基线定义

## 状态
拟定中 (Proposed) -> 待下一阶段实施

## 日期
2026-02-05

## 背景
随着项目从原型走向生产级应用，需要明确量化的架构指标以指导开发与测试。

## 决策
定义以下架构基线：

### 1. 性能基线 (Performance Thresholds)
*   **LCP (Largest Contentful Paint)**: < 1.2s
*   **FID (First Input Delay)**: < 100ms
*   **CLS (Cumulative Layout Shift)**: < 0.1
*   **编辑器响应**: 输入延迟 < 16ms (60fps)
*   **渲染延迟**: 复杂文档渲染 < 300ms (Debounced)

### 2. 扩展性指标 (Scalability)
*   **文档大小**: 支持 10,000 行 Markdown 流畅编辑。
*   **插件化**: 编辑器与渲染器需保持松耦合，通过 `Props` 通信，不允许直接依赖内部实现。

### 3. 安全等级 (Security Level)
*   **XSS**: Markdown 渲染必须经过 DOMPurify 过滤（若使用 `dangerouslySetInnerHTML`）。
*   **CSP**: 生产环境需配置 Content Security Policy。

### 4. 成本约束 (Cost Constraints)
*   **部署**: 优先支持静态托管 (GitHub Pages, Vercel, Netlify)，零服务器成本。
*   **构建**: 单次构建时间 < 2分钟。

## 后果
所有后续功能开发（如离线构建、解析器优化）必须通过上述指标的验收。
