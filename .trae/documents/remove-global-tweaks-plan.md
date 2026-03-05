# 取消全局微调在编辑器中的修改窗口 - 实施计划

## 问题分析
当前在编辑器的底部工具栏中有一个"全局微调"部分，包含了段落间隔和分割线的控制。根据用户需求，这些控制应该移到系统设置中，而编辑器中应该取消这个修改窗口，保留位置用于其他功能。

## 实施计划

### [x] 任务 1: 从 BottomToolbar 组件中移除全局微调部分
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 修改 `BottomToolbar.tsx` 文件，移除"全局微调"部分
  - 保留该位置，为其他功能做准备
- **Success Criteria**:
  - 底部工具栏中不再显示"全局微调"部分
  - 保留的位置布局合理，为后续功能扩展做好准备
- **Test Requirements**:
  - `human-judgment` TR-1.1: 底部工具栏中不再显示"分区与间距"和"分割线"控制
  - `human-judgment` TR-1.2: 底部工具栏布局保持美观，预留位置合理

### [/] 任务 2: 确保系统设置中能调整段落间隔和分割线显示
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 检查系统设置组件，确保段落间隔和分割线显示的控制在系统设置中可用
  - 如果不存在，添加相应的控制选项
- **Success Criteria**:
  - 系统设置中可以调整段落间隔
  - 系统设置中可以控制分割线显示与否
- **Test Requirements**:
  - `human-judgment` TR-2.1: 系统设置中存在段落间隔调整选项
  - `human-judgment` TR-2.2: 系统设置中存在分割线显示控制选项

### [ ] 任务 3: 修复分割线实现
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 检查分割线的实现代码
  - 修复分割线显示/隐藏的功能
  - 考虑文本标题自带分割符号的问题
- **Success Criteria**:
  - 分割线可以正确显示和隐藏
  - 分割线的显示/隐藏状态在系统设置中可以控制
  - 文本标题自带的分割符号不会与系统分割线冲突
- **Test Requirements**:
  - `programmatic` TR-3.1: 分割线显示/隐藏功能正常工作
  - `human-judgment` TR-3.2: 文本标题自带的分割符号与系统分割线不冲突

### [ ] 任务 4: 为底部工具栏预留位置添加其他功能
- **Priority**: P1
- **Depends On**: 任务 1
- **Description**:
  - 考虑在底部工具栏预留位置添加其他有用的功能
  - 确保新功能与整体布局协调一致
- **Success Criteria**:
  - 底部工具栏预留位置有新功能填充
  - 新功能与整体布局协调一致
- **Test Requirements**:
  - `human-judgment` TR-4.1: 底部工具栏布局美观，新功能与整体协调
  - `human-judgment` TR-4.2: 新功能实用且易于使用

### [ ] 任务 5: 测试验证
- **Priority**: P1
- **Depends On**: 任务 1, 任务 2, 任务 3, 任务 4
- **Description**:
  - 测试所有修改是否正常工作
  - 确保系统设置中的段落间隔和分割线控制功能正常
  - 确保底部工具栏布局美观，新功能正常
- **Success Criteria**:
  - 所有功能正常工作
  - 布局美观协调
  - 用户体验良好
- **Test Requirements**:
  - `programmatic` TR-5.1: 所有功能正常工作，无错误
  - `human-judgment` TR-5.2: 整体布局美观，用户体验良好

## 技术实现细节

### 任务 1 实现
- 修改文件: `MdToHmtl/src/components/CHD/BottomToolbar.tsx`
- 移除"全局微调"部分的代码，保留布局结构

### 任务 2 实现
- 检查文件: `MdToHmtl/src/components/SettingsPanel.tsx`
- 确保段落间隔和分割线控制选项存在

### 任务 3 实现
- 检查文件: `MdToHmtl/src/components/CHD/Section.tsx`
- 修复分割线显示/隐藏逻辑
- 考虑文本标题自带分割符号的处理

### 任务 4 实现
- 考虑在底部工具栏添加的功能，如：
  - 文档统计信息
  - 快速操作按钮
  - 其他有用的编辑工具

## 预期效果
- 编辑器底部工具栏不再显示"全局微调"部分
- 系统设置中可以调整段落间隔和分割线显示
- 分割线功能正常实现
- 底部工具栏预留位置有新功能填充
- 整体布局美观，用户体验良好