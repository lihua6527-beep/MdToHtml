# 项目结构索引

## 项目根目录 (c:\Users\86171\Desktop\MdToHmtl)

### 主要文件
- **start.bat**: 项目启动脚本，用于启动开发环境
- **PROJECT_STRUCTURE.md**: 项目结构索引文件，记录目录结构和作用

### 核心目录
- **MdToHtml/**: 主项目目录，包含所有源代码和配置文件

## MdToHtml 目录结构

### 配置文件
- **package.json**: 项目依赖和脚本配置
- **package-lock.json**: 依赖版本锁定文件
- **tsconfig.json**: TypeScript 配置
- **next.config.js**: Next.js 配置
- **tailwind.config.js**: Tailwind CSS 配置
- **postcss.config.js**: PostCSS 配置
- **jest.config.js**: Jest 测试配置
- **jest.setup.js**: Jest 测试设置
- **jest.setup.ts**: Jest TypeScript 测试设置
- **components.json**: 组件配置
- **config.json**: 项目配置
- **project.config.json**: 项目特定配置
- **CHD协议.md**: CHD 协议规范文档
- **README.md**: 项目说明文档

### 源代码目录
- **src/**: 主源代码目录
  - **app/**: Next.js 应用目录
    - **api/**: API 路由
    - **editor/**: 编辑器页面
    - **preview/**: 预览页面
    - **tag-showcase/**: 标签展示页面
    - **test/**: 测试页面
    - **layout.tsx**: 应用布局
    - **page.tsx**: 首页
  - **components/**: 组件目录
    - **CHD/**: CHD 相关组件
    - **Editor/**: 编辑器组件
    - **ui/**: UI 组件
  - **hooks/**: 自定义 hooks
  - **lib/**: 工具库
  - **services/**: 服务层
  - **types/**: TypeScript 类型定义
  - **config/**: 配置文件
  - **constants/**: 常量定义

### 资源目录
- **public/**: 静态资源目录
  - **tag-styles.html**: 标签样式展示
- **posts/**: 示例文档
- **recycle/**: 回收站
- **.trash/**: 回收站目录

### 脚本目录
- **scripts/**: 脚本文件
  - **archive_project.py**: 项目归档脚本
  - **batch_eval.ts**: 批量评估脚本
  - **classifyDocuments.js**: 文档分类脚本
  - **generate_portable_output.js**: 生成可移植输出脚本
  - **migrate_data_v2.js**: 数据迁移脚本
  - **post-build.js**: 构建后脚本
  - **process_single_file.js**: 处理单个文件脚本
  - **setup-port.js**: 端口设置脚本
  - **start_editor.bat**: 启动编辑器脚本
  - **validate_root.ps1**: 根目录验证脚本
  - **verify-static-build.js**: 静态构建验证脚本
  - **verify_data_loop.js**: 数据循环验证脚本

### 测试目录
- **tests/**: 测试文件
  - **integration/**: 集成测试
  - **unit/**: 单元测试

### 机器学习包
- **portable_ml_package/**: 可移植机器学习包
  - **inference/**: 推理相关代码
  - **llm_service/**: LLM 服务
  - **model/**: 模型文件
  - **resources/**: 资源文件
  - **train/**: 训练相关代码

### 归档目录
- **archive/**: 归档文件
  - **debug/**: 调试文件
  - **configs/**: 配置文件

### 其他目录
- **.github/**: GitHub 配置
- **.trae/**: Trae IDE 配置
- **electron/**: Electron 相关文件

## 目录作用说明

### 核心目录
- **src/**: 包含所有应用代码，是项目的主要源代码目录
- **public/**: 存放静态资源，如图片、CSS、HTML 文件等
- **scripts/**: 存放各种脚本文件，用于构建、测试、数据处理等
- **tests/**: 存放测试文件，确保代码质量

### 功能目录
- **src/app/api/**: 存放 API 路由，处理后端请求
- **src/app/editor/**: 存放编辑器页面，提供文档编辑功能
- **src/components/CHD/**: 存放 CHD 相关组件，实现卡片式文档渲染
- **src/components/Editor/**: 存放编辑器组件，提供编辑功能
- **src/hooks/**: 存放自定义 hooks，提供状态管理和逻辑复用
- **src/lib/**: 存放工具库，提供通用功能
- **src/services/**: 存放服务层，处理数据请求和业务逻辑

### 配置和资源
- **根目录配置文件**: 存放项目级配置，如依赖、构建配置等
- **posts/**: 存放示例文档，用于测试和展示
- **recycle/**: 存放已删除的文档，提供回收站功能
- **portable_ml_package/**: 存放机器学习相关代码和模型，用于文档生成和处理

### 辅助目录
- **archive/**: 存放不需要的文件，保持项目整洁
- **.github/**: 存放 GitHub 工作流配置，用于 CI/CD
- **.trae/**: 存放 Trae IDE 配置，用于开发环境
- **electron/**: 存放 Electron 相关文件，用于桌面应用构建

## 维护说明

- 当添加、删除或修改文件时，应更新此索引文件
- 确保每个目录的作用描述清晰准确
- 定期检查并清理不需要的文件，保持项目结构整洁