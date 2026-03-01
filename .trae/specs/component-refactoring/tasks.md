# 组件重构项目 - 实现计划

## [x] 任务 1: 提取状态管理逻辑 (useDocumentState)
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 从 InteractivePost 组件中提取状态管理逻辑到自定义hook
  - 包含内容状态、保存状态、编辑状态等核心状态管理
  - 集成错误处理机制：处理frontmatter解析错误和重复键问题
  - 合理使用useMemo缓存计算结果
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-1.1: 内容更新功能正常
  - `programmatic` TR-1.2: 保存逻辑正常执行
  - `programmatic` TR-1.3: 状态更新正确
  - `programmatic` TR-1.4: 错误处理机制正常工作
- **Notes**: 确保所有必要的状态和方法正确暴露

## [x] 任务 2: 创建评分组件 (ScoreIndicator)
- **Priority**: P1
- **Depends On**: 任务 1
- **Description**: 
  - 从 InteractivePost 中拆分评分显示和详情弹窗功能
  - 创建独立的 ScoreIndicator 组件
  - 确保评分数据正确传递和显示
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-2.1: 评分显示正确
  - `programmatic` TR-2.2: 评分详情弹窗正常显示
  - `programmatic` TR-2.3: 评分数据正确传递
- **Notes**: 基于 useDocumentState hook 创建组件

## [x] 任务 3: 创建导出组件 (ExportButton)
- **Priority**: P1
- **Depends On**: 任务 1
- **Description**: 
  - 从 InteractivePost 中拆分导出功能
  - 创建独立的 ExportButton 组件
  - 包含导出按钮和导出状态管理
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `programmatic` TR-3.1: 导出功能正常执行
  - `programmatic` TR-3.2: 导出状态显示正确
- **Notes**: 基于 useDocumentState hook 创建组件

## [x] 任务 4: 创建导航栏组件 (NavigationHeader)
- **Priority**: P0
- **Depends On**: 任务 1, 任务 2, 任务 3
- **Description**: 
  - 从 InteractivePost 中拆分顶部导航栏
  - 创建独立的 NavigationHeader 组件
  - 集成 ScoreIndicator 和 ExportButton 组件
  - 确保文档类型按钮功能正常，下拉菜单正确显示
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-4.1: 导航栏所有按钮功能正常
  - `programmatic` TR-4.2: 文档类型选择器正常工作，下拉菜单正确显示
  - `programmatic` TR-4.3: 与评分和导出组件集成正常
  - `programmatic` TR-4.4: 文档类型更新功能正常
- **Notes**: 集成文档类型按钮修复经验，确保下拉菜单正确显示（z-index设置）

## [x] 任务 5: 创建文档项组件 (DocumentItem)
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 从 DocumentList 中拆分单个文档项显示功能
  - 创建独立的 DocumentItem 组件
  - 包含文档类型标签、标题、状态图标、时间戳
  - 应用 React.memo 优化组件渲染
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-5.1: 文档项显示正确
  - `programmatic` TR-5.2: 点击导航功能正常
  - `programmatic` TR-5.3: 拖拽功能正常
- **Notes**: 优化组件渲染性能

## [x] 任务 6: 创建批量选择组件 (SelectionMode)
- **Priority**: P1
- **Depends On**: 任务 5
- **Description**: 
  - 从 DocumentList 中拆分批量选择模式功能
  - 创建独立的 SelectionMode 组件
  - 包含全选按钮、已选项显示、批量删除按钮
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `programmatic` TR-6.1: 批量选择功能正常
  - `programmatic` TR-6.2: 全选功能正常
  - `programmatic` TR-6.3: 批量删除功能正常
- **Notes**: 基于 DocumentItem 组件创建

## [x] 任务 7: 创建设置菜单组件 (SettingsMenu)
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 从 DocumentList 中拆分设置菜单功能
  - 创建独立的 SettingsMenu 组件
  - 包含文件路径设置、存储容量设置、排序方式设置
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-7.1: 设置菜单显示正常
  - `programmatic` TR-7.2: 存储容量设置功能正常
  - `programmatic` TR-7.3: 排序方式设置功能正常
- **Notes**: 确保设置功能与原功能一致

## [x] 任务 8: 创建列表头部组件 (ListHeader)
- **Priority**: P0
- **Depends On**: 任务 6, 任务 7
- **Description**: 
  - 从 DocumentList 中拆分列表头部功能
  - 创建独立的 ListHeader 组件
  - 集成 SelectionMode 和 SettingsMenu 组件
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `programmatic` TR-8.1: 头部按钮功能正常
  - `programmatic` TR-8.2: 布局切换功能正常
  - `programmatic` TR-8.3: 与其他组件集成正常
- **Notes**: 确保头部功能与原功能完全一致

## [x] 任务 9: 功能验证测试
- **Priority**: P0
- **Depends On**: 任务 4, 任务 8
- **Description**: 
  - 验证所有拆分后的组件功能正常
  - 测试所有原有功能是否正常工作
  - 确保组件间集成正常
- **Acceptance Criteria Addressed**: AC-9
- **Test Requirements**:
  - `programmatic` TR-9.1: 所有原有功能正常工作
  - `programmatic` TR-9.2: 组件间集成正常
  - `programmatic` TR-9.3: 应用运行无错误
- **Notes**: 确保已修复的文档类型按钮功能正常

## [x] 任务 10: 性能优化
- **Priority**: P2
- **Depends On**: 任务 9
- **Description**: 
  - 应用 React.memo 优化组件渲染
  - 优化 useMemo 和 useCallback 的使用
  - 减少不必要的重渲染
- **Acceptance Criteria Addressed**: AC-10
- **Test Requirements**:
  - `programmatic` TR-10.1: 组件渲染性能良好
  - `programmatic` TR-10.2: 性能不低于原版本
  - `programmatic` TR-10.3: 系统响应速度有所提升
- **Notes**: 参考缓存系统优化经验

## [x] 任务 11: 编写单元测试
- **Priority**: P1
- **Depends On**: 任务 9
- **Description**: 
  - 为拆分后的组件编写单元测试
  - 确保测试覆盖关键功能
- **Acceptance Criteria Addressed**: AC-11
- **Test Requirements**:
  - `programmatic` TR-11.1: 测试覆盖率达到80%以上
  - `programmatic` TR-11.2: 所有测试用例通过
- **Notes**: 包括对错误处理机制的测试