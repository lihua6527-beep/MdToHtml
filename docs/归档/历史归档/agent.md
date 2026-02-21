# MdToHtml 项目智能体指南

## 项目概述

**MdToHtml** 是一个专为Windows平台设计的Markdown转静态HTML工具，采用CHD（Card-based Hierarchical Document）协议规范，实现了从结构化Markdown到智能网格布局HTML的本地转换。

### 核心定位
- **Windows专属**：仅支持Windows 10/11环境
- **本地处理**：所有操作在本地完成，无云端依赖
- **CHD协议**：内置卡片化文档渲染引擎
- **所见即所得**：提供实时双栏编辑器

## 技术架构

### 技术栈
- **前端框架**：Next.js 14 (SSG模式)
- **UI组件**：React 18 + Tailwind CSS + Shadcn UI
- **编辑器**：CodeMirror 6 实时编辑
- **构建工具**：Windows Batch + PowerShell
- **数据处理**：File System → AST解析 → React渲染 → 静态HTML

### 核心模块

#### 1. CHD解析引擎 (`src/lib/chdParser.ts`)
- **功能**：将Markdown解析为CHD结构化数据
- **核心接口**：`CHDBlock`定义文档块结构
- **解析规则**：
  - L0: YAML Frontmatter（元数据）
  - L1: Section节点（## 二级标题）
  - L2: Card节点（### 三级标题）

#### 2. CHD渲染器 (`src/components/CHD/CHDRenderer.tsx`)
- **功能**：将CHD数据渲染为网格布局
- **布局控制**：支持2-column、grid等布局模式
- **卡片样式**：normal、highlight、stat、quote、warning、code、summary
- **响应式设计**：自适应不同屏幕尺寸

#### 3. 编辑器系统
- **双栏编辑**：左侧Markdown源码，右侧实时预览
- **同步滚动**：双向同步滚动定位
- **自动保存**：防抖自动保存机制
- **文件管理**：支持文件列表浏览和切换

## 项目结构

```
MdToHtml/
├── input/              # Markdown源文件目录
├── output/             # 生成的静态HTML
├── MdToHtml/           # 核心项目代码
│   ├── src/
│   │   ├── app/        # Next.js应用路由
│   │   ├── components/ # React组件
│   │   ├── lib/        # 工具函数和解析器
│   │   └── hooks/      # 自定义Hooks
├── start.bat           # Windows启动脚本
└── CHD协议规范_v1.1.md # 协议文档
```

## 核心协议：CHD规范

### 文档结构（三级刚性结构）
- **L0 Document**：YAML Frontmatter定义全局属性
- **L1 Section**：二级标题(##)定义逻辑章节
- **L2 Card**：三级标题(###)定义语义卡片

### 扩展语法DSL
```markdown
## 章节标题 {layout="2-column"}     # 布局控制
### 卡片标题 {card-style="stat"}    # 卡片样式
```

### 禁止规则
- 禁止四级及以上标题(####)
- 禁止孤儿文本（章节下必须包含卡片）
- 禁止混合层级结构
- 禁止隐式结构模拟

## 开发工作流

### 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器
start.bat

# 构建生产版本
npm run build
```

### 部署流程
1. **本地构建**：`npm run build`生成静态文件
2. **输出目录**：结果位于`output/`文件夹
3. **云端部署**：可直接部署到GitHub Pages或Vercel

## 关键经验总结

### Windows平台特化
- **编码处理**：避免GBK编码冲突，使用UTF-8
- **进程管理**：智能端口扫描(3000-9000)，避免冲突
- **脚本设计**：批处理仅作入口，复杂逻辑Python处理

### 部署安全
- **Nginx配置**：强制TLSv1.2+TLSv1.3，禁用QUIC/HTTP3
- **超时设置**：proxy_read_timeout≥60s防止499错误
- **静态部署**：采用中转站机制避免自杀式清理

### 开发规范
- **根目录极简**：仅保留核心入口文件
- **文档规范**：全中文文档，标准Markdown格式
- **版本控制**：自动归档旧版本，确保可追溯

## 使用场景

### 适用场景
- 技术文档编写与发布
- 产品说明文档管理
- 学术论文结构化写作
- 知识库构建

### 不适用场景
- 需要动态内容的网站
- 非Windows环境
- 复杂交互应用

## 扩展指南

### 自定义主题
1. 修改`tailwind.config.js`配色方案
2. 调整`src/app/globals.css`样式变量
3. 更新组件样式定义

### 新增卡片类型
1. 在`CHDRenderer.tsx`添加card-style类型
2. 创建对应React组件
3. 更新解析规则验证

### 部署优化
1. 配置CDN加速静态资源
2. 设置缓存策略
3. 启用Gzip压缩

## 故障排查

### 常见问题
- **端口冲突**：检查3000-9000端口占用情况
- **构建失败**：验证Node.js版本≥18.17.0
- **样式异常**：清除.next缓存重新构建

### 调试工具
- **开发者工具**：F12打开浏览器调试
- **日志查看**：检查控制台输出信息
- **文件验证**：使用CHD验证器检查Markdown格式

---

*本指南基于MdToHtml项目实际代码和CHD协议规范编写，为开发者提供完整的项目理解和使用指导。*