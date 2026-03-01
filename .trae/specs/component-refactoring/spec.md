# 组件重构项目 - 产品需求文档

## Overview
- **Summary**: 对 InteractivePost.tsx 和 DocumentList.tsx 两个大型组件进行重构，拆分为更小、更专注的组件，提高代码可读性、可维护性和性能。
- **Purpose**: 解决现有组件代码行数过长、职责过多、逻辑复杂等问题，通过合理拆分和优化，使代码更易于理解和维护。
- **Target Users**: 开发团队成员，包括前端开发者、测试人员和维护人员。

## Goals
- 提高代码可读性：将大组件拆分为更小、更专注的组件
- 提高可维护性：每个组件只负责单一职责
- 提高测试性：组件粒度更小，更容易编写单元测试
- 提高性能：减少不必要的渲染和计算
- 确保功能完整性：拆分后所有原有功能保持不变
- 确保依赖关系：确保组件间的依赖关系正确传递
- 增强系统健壮性：集成错误处理机制

## Non-Goals (Out of Scope)
- 不修改现有功能的业务逻辑
- 不添加新的功能特性
- 不改变现有的API接口
- 不修改数据库结构或后端逻辑

## Background & Context
- 现有两个主要组件：InteractivePost.tsx (861行) 和 DocumentList.tsx (730行)
- 这些组件存在代码行数过长、职责过多、逻辑复杂等问题
- 重构计划基于现有的缓存系统优化经验，包括合理使用useMemo和错误处理机制

## Functional Requirements
- **FR-1**: 提取 InteractivePost 组件的状态管理逻辑到自定义hook
- **FR-2**: 从 InteractivePost 中拆分出评分组件 (ScoreIndicator)
- **FR-3**: 从 InteractivePost 中拆分出导出组件 (ExportButton)
- **FR-4**: 从 InteractivePost 中拆分出导航栏组件 (NavigationHeader)
- **FR-5**: 从 DocumentList 中拆分出文档项组件 (DocumentItem)
- **FR-6**: 从 DocumentList 中拆分出批量选择组件 (SelectionMode)
- **FR-7**: 从 DocumentList 中拆分出设置菜单组件 (SettingsMenu)
- **FR-8**: 从 DocumentList 中拆分出列表头部组件 (ListHeader)

## Non-Functional Requirements
- **NFR-1**: 代码可读性：每个文件代码行数控制在200行以内
- **NFR-2**: 性能：组件性能不低于原版本，最好有所提升
- **NFR-3**: 可维护性：组件职责单一，易于理解和修改
- **NFR-4**: 测试性：组件粒度小，容易编写单元测试
- **NFR-5**: 健壮性：集成错误处理机制，提高系统稳定性

## Constraints
- **Technical**: 使用 React 框架，保持现有技术栈不变
- **Business**: 确保所有原有功能保持不变
- **Dependencies**: 保持现有的依赖关系，不引入新的依赖

## Assumptions
- 现有组件的功能逻辑是正确的
- 重构后的组件能够正确集成到现有系统中
- 开发团队熟悉 React 组件拆分和优化技术

## Acceptance Criteria

### AC-1: 状态管理逻辑提取
- **Given**: InteractivePost 组件的状态管理逻辑
- **When**: 提取到自定义hook useDocumentState
- **Then**: hook能独立提供完整的状态管理功能，包括内容状态、保存状态、编辑状态等
- **Verification**: `programmatic`
- **Notes**: 集成错误处理机制，处理frontmatter解析错误和重复键问题

### AC-2: 评分组件拆分
- **Given**: InteractivePost 组件的评分显示和详情弹窗功能
- **When**: 拆分到独立的 ScoreIndicator 组件
- **Then**: 评分显示功能与原功能一致，评分详情弹窗正常工作
- **Verification**: `programmatic`

### AC-3: 导出组件拆分
- **Given**: InteractivePost 组件的导出功能
- **When**: 拆分到独立的 ExportButton 组件
- **Then**: 导出功能与原功能一致，导出状态显示正确
- **Verification**: `programmatic`

### AC-4: 导航栏组件拆分
- **Given**: InteractivePost 组件的顶部导航栏
- **When**: 拆分到独立的 NavigationHeader 组件
- **Then**: 导航栏功能与原功能完全一致，包括文档类型按钮功能
- **Verification**: `programmatic`
- **Notes**: 确保下拉菜单正确显示（z-index设置）

### AC-5: 文档项组件拆分
- **Given**: DocumentList 组件的单个文档项显示功能
- **When**: 拆分到独立的 DocumentItem 组件
- **Then**: 文档项显示与原功能一致，点击导航和拖拽功能正常
- **Verification**: `programmatic`

### AC-6: 批量选择组件拆分
- **Given**: DocumentList 组件的批量选择模式功能
- **When**: 拆分到独立的 SelectionMode 组件
- **Then**: 批量选择功能与原功能一致，全选和批量删除功能正常
- **Verification**: `programmatic`

### AC-7: 设置菜单组件拆分
- **Given**: DocumentList 组件的设置菜单功能
- **When**: 拆分到独立的 SettingsMenu 组件
- **Then**: 设置菜单功能与原功能一致，存储容量和排序方式设置功能正常
- **Verification**: `programmatic`

### AC-8: 列表头部组件拆分
- **Given**: DocumentList 组件的列表头部功能
- **When**: 拆分到独立的 ListHeader 组件
- **Then**: 头部功能与原功能完全一致，与其他组件集成正常
- **Verification**: `programmatic`

### AC-9: 功能验证测试
- **Given**: 所有拆分后的组件
- **When**: 集成到系统中并测试
- **Then**: 所有原有功能正常工作，组件间集成正常，应用运行无错误
- **Verification**: `programmatic`

### AC-10: 性能优化
- **Given**: 拆分后的组件
- **When**: 应用性能优化措施
- **Then**: 组件性能不低于原版本，最好有所提升，渲染流畅
- **Verification**: `programmatic`

### AC-11: 单元测试
- **Given**: 拆分后的组件
- **When**: 编写单元测试
- **Then**: 测试覆盖率达到80%以上，所有测试用例通过
- **Verification**: `programmatic`

## Open Questions
- [ ] 拆分后的组件文件结构如何组织？
- [ ] 如何确保错误处理机制在所有组件中正确集成？
- [ ] 性能优化的具体指标如何衡量？