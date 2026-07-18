# CHD协议增强与设置功能实现计划

## 1. 项目概述

本计划旨在实现两个核心功能：
1. 在设置界面中预览CHD协议文件并提供一键复制功能
2. 在CHD协议中支持文档分类要求，增强下游程序的兼容性

## 2. 任务分解与优先级

### [x] 任务1: 实现设置界面中的CHD协议预览功能
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 在首页左下角设置中添加"协议配置"选项
  - 实现协议文件预览功能，显示 `portable_ml_package/resources/CHD_protocol.md` 的内容
  - 添加一键复制按钮，方便用户复制协议内容
- **Success Criteria**:
  - 设置界面中能看到"协议配置"选项
  - 点击后能正确显示CHD协议文件内容
  - 一键复制按钮功能正常
- **Test Requirements**:
  - `programmatic` TR-1.1: 点击设置中的"协议配置"选项能正确加载并显示协议内容 ✓
  - `programmatic` TR-1.2: 点击复制按钮后，协议内容能被正确复制到剪贴板 ✓
  - `human-judgement` TR-1.3: 预览界面布局美观，内容清晰易读 ✓
- **Notes**: 协议文件路径需要使用相对路径或配置管理，确保跨平台兼容性

### [x] 任务2: 扩展CHD协议，添加分类支持
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 在CHD协议的YAML Frontmatter中添加`category`字段
  - 支持的分类包括：project（项目）、paper（论文）、knowledge（知识理解/知识分享）
  - 当分类置信度低时，使用`other`作为默认值
- **Success Criteria**:
  - CHD协议文档中包含分类字段的定义 ✓
  - 分类字段能被正确解析并在JSON输出中体现 ✓
- **Test Requirements**:
  - `programmatic` TR-2.1: 带有category字段的CHD文档能被正确解析 ✓
  - `programmatic` TR-2.2: 生成的JSON文件中包含正确的分类信息 ✓
  - `human-judgement` TR-2.3: 分类字段的定义清晰易懂 ✓
- **Notes**: 需要更新CHD解析器以支持新的category字段

### [x] 任务3: 更新CHD解析器，支持分类字段
- **Priority**: P1
- **Depends On**: 任务2
- **Description**:
  - 修改 `src/lib/chdParser.ts` 文件，添加对category字段的解析支持
  - 确保解析结果包含分类信息
- **Success Criteria**:
  - CHD解析器能正确识别并解析category字段 ✓
  - 解析结果中包含分类信息 ✓
- **Test Requirements**:
  - `programmatic` TR-3.1: 解析带有category字段的CHD文档时，返回的解析结果包含正确的分类信息 ✓
  - `programmatic` TR-3.2: 解析测试用例通过 ✓
- **Notes**: 需要更新相关类型定义

### [x] 任务4: 更新类型定义，添加分类字段
- **Priority**: P1
- **Depends On**: 任务3
- **Description**:
  - 修改 `src/types/chd.ts` 文件，添加分类字段的类型定义
  - 确保类型定义与解析逻辑一致
- **Success Criteria**:
  - 类型定义文件中包含category字段的定义 ✓
  - 类型定义能正确反映分类的可能值 ✓
- **Test Requirements**:
  - `programmatic` TR-4.1: 类型定义文件编译通过 ✓
  - `programmatic` TR-4.2: 类型检查无错误 ✓
- **Notes**: 类型定义应包括所有支持的分类值

### [x] 任务5: 测试与验证
- **Priority**: P2
- **Depends On**: 任务1, 任务3, 任务4
- **Description**:
  - 测试设置界面中的协议预览功能
  - 测试带有分类字段的CHD文档解析
  - 验证生成的JSON文件中包含正确的分类信息
- **Success Criteria**:
  - 所有功能正常工作 ✓
  - 测试用例通过 ✓
- **Test Requirements**:
  - `programmatic` TR-5.1: 功能测试通过 ✓
  - `programmatic` TR-5.2: 集成测试通过 ✓
  - `human-judgement` TR-5.3: 用户体验良好 ✓
- **Notes**: 测试应覆盖各种边界情况

## 3. 技术实现要点

1. **设置界面实现**:
   - 在 `src/components/settings/` 目录下添加协议预览组件
   - 利用现有的设置面板结构
   - 使用Next.js的静态文件服务读取协议文件

2. **CHD协议扩展**:
   - 在 `portable_ml_package/resources/CHD_protocol.md` 中添加分类字段的定义
   - 确保字段定义清晰，包含所有支持的分类值

3. **解析器更新**:
   - 修改 `src/lib/chdParser.ts` 中的解析逻辑
   - 添加对category字段的处理

4. **类型定义更新**:
   - 在 `src/types/chd.ts` 中添加Category类型
   - 确保类型定义与实际使用一致

## 4. 预期成果

1. 用户可以在设置界面中预览CHD协议文件并一键复制
2. CHD协议支持文档分类，生成的JSON文件中包含分类信息
3. 系统能正确处理不同类型的文档分类需求

## 5. 风险评估

1. **文件路径问题**: 协议文件路径可能因环境不同而变化，需要使用配置管理
2. **解析器兼容性**: 更新解析器时需要确保向后兼容
3. **分类标准**: 需要明确分类的判断标准，确保一致性

## 6. 时间估计

- 任务1: 2小时
- 任务2: 1小时
- 任务3: 1.5小时
- 任务4: 0.5小时
- 任务5: 1小时

总计: 6小时