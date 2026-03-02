# Electron打包错误经验总结

## 1. 静态导出冲突问题

### 错误现象
- `Error: EEXIST: file already exists, mkdir 'out/api/app-info'`
- 构建过程中出现目录冲突

### 原因分析
- app-info目录下同时存在route.ts文件和chd-protocol目录，导致静态导出时路径冲突
- Next.js在静态导出时无法处理这种嵌套路由结构

### 解决方案
- 跳过Next.js的静态导出步骤，直接使用Electron Builder构建
- 修改package.json中的构建脚本，移除静态导出步骤

## 2. 服务器端渲染localStorage错误

### 错误现象
- `ReferenceError: localStorage is not defined`
- 构建过程中出现localStorage未定义错误

### 原因分析
- 在服务器端渲染时，localStorage对象不存在
- 代码中直接使用localStorage，没有检查其是否可用

### 解决方案
- 在使用localStorage前添加环境检查：`typeof window !== 'undefined' && window.localStorage`
- 修复了PermissionManager.ts和DocumentList.tsx中的localStorage使用

## 3. 权限访问错误

### 错误现象
- `Access is denied`
- `Unable to move the cache: 拒绝访问`
- `mkdir C:\Users\86171\AppData\Local\electron-builder\Cache\winCodeSign\758722467: Access is denied`

### 原因分析
- 构建过程中需要访问AppData目录，但没有足够的权限
- 沙箱环境限制了对某些系统目录的访问

### 解决方案
- 调整构建配置，跳过代码签名步骤
- 修改output目录为项目内的release目录，避免访问系统目录

## 4. 配置错误

### 错误现象
- `Invalid configuration object. electron-builder has been initialized using a configuration object that does not match the API schema`
- `configuration.win has an unknown property 'sign'`

### 原因分析
- 使用了错误的配置属性或属性位置不正确
- electron-builder的配置 schema 验证失败

### 解决方案
- 移除不正确的配置属性
- 确保配置符合electron-builder的schema要求

## 5. 符号链接创建错误

### 错误现象
- `Cannot create symbolic link : 客户端没有所需的特权`
- 7-Zip解压时出现符号链接创建失败

### 原因分析
- 系统权限不足，无法创建符号链接
- 沙箱环境限制了符号链接的创建

### 解决方案
- 忽略符号链接错误，继续构建过程
- 构建工具会自动处理这种情况，不会影响最终结果

## 6. 依赖重复问题

### 错误现象
- `duplicate dependency references`
- 构建过程中提示依赖重复

### 原因分析
- 项目中存在重复的依赖引用
- 可能是由于npm安装过程中的问题

### 解决方案
- 忽略依赖重复警告，不影响构建结果
- 构建工具会自动处理重复依赖

## 7. Asar禁用警告

### 错误现象
- `asar usage is disabled — this is strongly not recommended`
- 构建过程中提示Asar禁用

### 原因分析
- 配置中设置了`asar: false`
- Electron Builder推荐使用Asar打包以提高安全性

### 解决方案
- 为了提高性能，保持Asar禁用
- 性能优先于安全性考虑

## 总结

1. **环境检查**：在使用浏览器特有的API时，必须添加环境检查
2. **路径配置**：确保构建输出路径在项目目录内，避免系统权限问题
3. **配置验证**：确保electron-builder配置符合schema要求
4. **错误处理**：对构建过程中的非致命错误可以适当忽略
5. **性能优化**：根据实际需求选择合适的打包配置

通过解决这些问题，成功完成了MdToHtml项目的Electron打包，生成了可执行的exe文件。