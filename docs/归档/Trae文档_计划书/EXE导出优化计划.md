# MdToHtml - EXE导出与性能优化计划

## 项目现状分析

当前项目是一个基于Next.js的Markdown到HTML转换工具，具有以下特点：
- 使用start.bat脚本启动
- 包含Electron配置，可打包为桌面应用
- 启动流程：检查Node.js → 安装依赖 → 运行setup-port.js → 启动开发服务器
- 已有electron/main.js和electron/server.js配置
- package.json中已配置build选项，支持nsis和portable目标

## 实施目标

1. 将当前系统状态从启动脚本转换为exe格式
2. 实现1键启动功能
3. 提高启动速度和性能
4. 确保打包后的启用性能更高
5. 保持当前系统状态，不做安装软件

## 详细任务计划

### [ ] 任务1：优化Electron启动逻辑
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 优化main.js中的启动逻辑，减少启动时间
  - 实现启动时的代码结构区分，提高性能
  - 优化窗口创建和加载流程
- **Success Criteria**:
  - 启动时间减少30%以上
  - 窗口显示无闪烁
  - 启动过程稳定可靠
- **Test Requirements**:
  - `programmatic` TR-1.1: 启动时间 < 3秒
  - `programmatic` TR-1.2: 无启动错误
  - `human-judgement` TR-1.3: 启动过程流畅，无卡顿
- **Notes**:
  - 考虑使用预加载策略
  - 优化服务器启动逻辑

### [ ] 任务2：优化Express服务器配置
- **Priority**: P0
- **Depends On**: 任务1
- **Description**:
  - 优化server.js中的Express服务器配置
  - 减少不必要的中间件和路由
  - 提高服务器启动速度
- **Success Criteria**:
  - 服务器启动时间 < 1秒
  - 响应速度快
  - 内存占用合理
- **Test Requirements**:
  - `programmatic` TR-2.1: 服务器启动时间 < 1秒
  - `programmatic` TR-2.2: API响应时间 < 100ms
  - `human-judgement` TR-2.3: 页面加载流畅
- **Notes**:
  - 考虑使用更轻量级的服务器配置
  - 优化静态文件服务

### [ ] 任务3：优化打包配置
- **Priority**: P0
- **Depends On**: 任务1, 任务2
- **Description**:
  - 优化package.json中的build配置
  - 确保打包为portable版本（无需安装）
  - 优化asar配置和文件结构
- **Success Criteria**:
  - 打包成功，生成可执行文件
  - 可执行文件大小合理
  - 启动速度快
- **Test Requirements**:
  - `programmatic` TR-3.1: 打包过程无错误
  - `programmatic` TR-3.2: 生成的exe文件可正常运行
  - `human-judgement` TR-3.3: 启动速度明显快于脚本启动
- **Notes**:
  - 保持asar: false以提高性能
  - 确保所有必要文件都被包含

### [ ] 任务4：创建优化的启动器
- **Priority**: P1
- **Depends On**: 任务3
- **Description**:
  - 创建优化的启动器脚本或配置
  - 确保1键启动功能
  - 优化启动参数和环境配置
- **Success Criteria**:
  - 双击exe即可启动应用
  - 启动过程无用户交互
  - 启动速度快
- **Test Requirements**:
  - `programmatic` TR-4.1: 双击exe能成功启动
  - `programmatic` TR-4.2: 启动过程无错误
  - `human-judgement` TR-4.3: 启动体验流畅
- **Notes**:
  - 考虑添加启动日志和错误处理

### [ ] 任务5：性能测试与优化
- **Priority**: P1
- **Depends On**: 任务4
- **Description**:
  - 进行启动性能测试
  - 识别并解决性能瓶颈
  - 优化资源加载和初始化过程
- **Success Criteria**:
  - 启动时间 < 3秒
  - 内存占用合理
  - 响应速度快
- **Test Requirements**:
  - `programmatic` TR-5.1: 启动时间 < 3秒
  - `programmatic` TR-5.2: 内存占用 < 500MB
  - `human-judgement` TR-5.3: 整体性能优于脚本启动
- **Notes**:
  - 使用性能分析工具识别瓶颈
  - 考虑延迟加载非关键资源

### [ ] 任务6：最终验证与测试
- **Priority**: P2
- **Depends On**: 任务5
- **Description**:
  - 进行完整的功能测试
  - 验证所有功能正常工作
  - 确保与原始脚本启动的功能一致
- **Success Criteria**:
  - 所有功能正常工作
  - 无错误或异常
  - 性能优于原始启动方式
- **Test Requirements**:
  - `programmatic` TR-6.1: 所有API端点正常响应
  - `programmatic` TR-6.2: 文件读写功能正常
  - `human-judgement` TR-6.3: 整体用户体验良好
- **Notes**:
  - 测试不同场景下的性能
  - 确保稳定性和可靠性

## 技术方案

1. **启动优化**:
   - 使用预加载策略
   - 优化Electron窗口创建和显示时机
   - 减少启动时的同步操作

2. **服务器优化**:
   - 减少Express中间件
   - 优化静态文件服务
   - 提高路由处理效率

3. **打包配置**:
   - 使用portable目标
   - 保持asar: false以提高性能
   - 优化文件结构和资源包含

4. **性能监控**:
   - 添加启动时间监控
   - 识别性能瓶颈
   - 持续优化

## 预期成果

- 生成可直接运行的exe文件
- 1键启动，无需安装
- 启动速度明显快于原始脚本
- 保持所有原有功能
- 性能优化，资源占用合理

## 风险评估

1. **性能风险**:
   - 打包后的应用可能启动较慢
   - 内存占用可能增加

2. **功能风险**:
   - 打包过程可能出现错误
   - 某些功能可能在打包后不正常

3. **解决方案**:
   - 持续性能测试和优化
   - 确保所有依赖正确包含
   - 完善错误处理和日志

## 时间估计

- 任务1-2: 1天
- 任务3-4: 1天
- 任务5-6: 1天
- 总计: 3天

## 结论

通过本计划的实施，我们将成功将当前的MdToHtml系统转换为exe格式，实现1键启动，并通过优化提高启动速度和性能。同时保持所有原有功能，确保用户体验的连续性。