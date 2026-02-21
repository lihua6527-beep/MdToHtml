# ADR-001: 采用 CodeMirror 6 作为编辑器内核

## 状态
已接受 (Accepted)

## 日期
2026-02-05

## 背景
原有的 `<textarea>` 方案功能简陋，无法支持语法高亮、行号显示、代码折叠等现代 IDE 特性。用户体验与"专业级编辑器"愿景存在显著差距。

## 决策
采用 **CodeMirror 6** (`@uiw/react-codemirror`) 替换原生 `textarea`。

## 理由 (Decision Drivers)
1.  **生态丰富**: 拥有成熟的 Markdown 语法插件与主题系统。
2.  **性能优异**: 虚拟滚动技术支持长文档编辑，性能远优于 Monaco Editor（包体积更小）。
3.  **可扩展性**: 模块化架构，易于扩展自定义快捷键和交互逻辑。
4.  **React 适配**: `@uiw/react-codemirror` 提供了优秀的 React 封装，易于集成。

## 后果 (Consequences)
*   **正向**: 获得了行号、高亮、撤销重做栈等能力；支持了 `scrollToLine` 等高级 API。
*   **负向**: 引入了额外的包体积依赖；需要处理 CSS 样式适配。

## 验证
已在 `src/components/Editor/CodeMirrorEditor.tsx` 中实现，并验证了双向滚动同步功能正常。
