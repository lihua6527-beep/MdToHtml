# 自动保存关闭编辑界面问题修复计划

## 问题分析
当前自动保存功能在保存完成后会调用 `router.refresh()`，导致整个页面重新加载，从而关闭了用户的编辑界面，严重影响用户体验。

## 修复方案

### [x] 任务 1: 修改 saveFile 函数，增加参数控制是否刷新页面
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 修改 `saveFile` 函数，增加 `shouldRefresh` 参数
  - 默认值为 `false`，保持向后兼容
- **Success Criteria**:
  - `saveFile` 函数接受 `shouldRefresh` 参数
  - 函数签名保持向后兼容
- **Test Requirements**:
  - `programmatic` TR-1.1: 函数调用时不传递 `shouldRefresh` 参数，默认值为 `false`
  - `programmatic` TR-1.2: 函数调用时传递 `shouldRefresh: true`，参数被正确接收

### [x] 任务 2: 修改 debouncedSave 函数，根据参数控制是否刷新页面
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 修改 `debouncedSave` 函数，增加 `shouldRefresh` 参数
  - 只有当 `shouldRefresh` 为 `true` 时才调用 `router.refresh()`
- **Success Criteria**:
  - `debouncedSave` 函数根据 `shouldRefresh` 参数决定是否刷新页面
  - 自动保存时不刷新页面
  - 手动保存时可以选择是否刷新页面
- **Test Requirements**:
  - `programmatic` TR-2.1: 当 `shouldRefresh` 为 `false` 时，不调用 `router.refresh()`
  - `programmatic` TR-2.2: 当 `shouldRefresh` 为 `true` 时，调用 `router.refresh()`

### [x] 任务 3: 更新自动保存逻辑，设置 shouldRefresh 为 false
- **Priority**: P0
- **Depends On**: 任务 2
- **Description**:
  - 在自动保存的 `useEffect` 中，调用 `saveFile` 时明确设置 `shouldRefresh: false`
- **Success Criteria**:
  - 自动保存完成后不刷新页面
  - 编辑界面保持打开状态
- **Test Requirements**:
  - `human-judgment` TR-3.1: 自动保存触发后，编辑界面保持打开状态
  - `programmatic` TR-3.2: 自动保存完成后，`router.refresh()` 不被调用

### [x] 任务 4: 更新手动保存逻辑，设置 shouldRefresh 为 true
- **Priority**: P0
- **Depends On**: 任务 2
- **Description**:
  - 在 `handleSave` 函数中，调用 `saveFile` 时明确设置 `shouldRefresh: true`
  - 保持手动保存后退出编辑模式的行为
- **Success Criteria**:
  - 手动保存完成后刷新页面
  - 手动保存后退出编辑模式
- **Test Requirements**:
  - `human-judgment` TR-4.1: 手动保存后，页面刷新并退出编辑模式
  - `programmatic` TR-4.2: 手动保存完成后，`router.refresh()` 被调用

### [x] 任务 5: 测试验证
- **Priority**: P1
- **Depends On**: 任务 3, 任务 4
- **Description**:
  - 测试自动保存功能，确保编辑界面不关闭
  - 测试手动保存功能，确保正常退出编辑模式
  - 测试快捷键保存功能，确保行为正确
- **Success Criteria**:
  - 自动保存触发后，编辑界面保持打开状态
  - 手动保存后，页面刷新并退出编辑模式
  - 快捷键保存（Ctrl+S）后，页面刷新并退出编辑模式
- **Test Requirements**:
  - `human-judgment` TR-5.1: 自动保存触发后，编辑界面保持打开状态
  - `human-judgment` TR-5.2: 手动保存后，页面刷新并退出编辑模式
  - `human-judgment` TR-5.3: 快捷键保存后，页面刷新并退出编辑模式

## 修复完成

### 问题原因
自动保存功能在保存完成后会调用 `router.refresh()`，导致整个页面重新加载，从而关闭了用户的编辑界面，严重影响用户体验。

### 解决方案
1. **修改 `saveFile` 函数**：增加 `shouldRefresh` 参数，默认值为 `false`
2. **修改 `debouncedSave` 函数**：根据 `shouldRefresh` 参数决定是否调用 `router.refresh()`
3. **更新自动保存逻辑**：调用 `saveFile` 时明确设置 `shouldRefresh: false`
4. **更新手动保存逻辑**：调用 `saveFile` 时明确设置 `shouldRefresh: true`

### 预期效果
- **自动保存**：编辑器保持打开状态，不干扰用户操作
- **手动保存**：保持原有行为，保存后退出编辑模式
- **快捷键保存**：保持原有行为，保存后退出编辑模式

### 技术实现
修改文件：`MdToHtml/src/hooks/useDocumentState.ts`
- 增加了 `shouldRefresh` 参数控制是否刷新页面
- 自动保存时不刷新页面，手动保存时刷新页面
- 保持了向后兼容性

## 技术实现细节
- 修改文件：`MdToHtml/src/hooks/useDocumentState.ts`
- 主要修改点：
  1. `saveFile` 函数签名和实现
  2. `debouncedSave` 函数签名和实现
  3. 自动保存的 `useEffect` 调用
  4. `handleSave` 函数调用

## 预期效果
- 自动保存时，编辑器保持打开状态，不干扰用户操作
- 手动保存时，保持原有行为，保存后退出编辑模式
- 快捷键保存时，保持原有行为，保存后退出编辑模式