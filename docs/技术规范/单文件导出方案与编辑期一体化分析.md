# 单文件导出方案与编辑期一体化分析

## 1. 背景与目标

当前 Markdown 转 HTML 的输出结果是一个包含 `index.html` 以及 `css/`、`js/` 等资源文件夹的目录结构。这种结构虽然清晰，但在分享、部署和归档时存在诸多不便（如依赖路径丢失、文件遗漏等）。

本方案旨在实现 **"单文件导出" (Single File Export)**，即将所有静态资源（HTML结构、CSS样式、JS脚本、字体、图片等）内聚为一个独立的 HTML 文件。用户点击下载后，浏览器直接生成并下载该文件，无需服务端参与，也无需解压。

核心价值：
*   **极致便携**：像 PDF 一样，一个文件即完整内容。
*   **零依赖**：双击即用，无需关心文件夹结构。
*   **用户体验**：符合"下载即所得"的用户心智。

## 2. 核心理念 (Core Philosophy)

为了确保系统的可维护性与产物的稳定性，我们将遵循以下两大核心原则：

### 2.1 编辑期分离性 (Editing Phase Separation)
在开发与编辑阶段，必须严格保持各模块的独立性，禁止为了方便而进行的交叉引用或硬编码耦合。
*   **源码 (Source)**：Markdown原始内容保持纯文本格式，不包含任何样式或脚本标签。
*   **配置 (Config)**：项目配置（如主题色、布局模式）存储于独立的 JSON/YAML 配置文件或 React Context 中。
*   **资源 (Assets)**：图片、字体、图标等静态资源保持独立文件存储，通过 URL 引用。
*   **元数据 (Metadata)**：文章属性（标题、日期、作者）与正文分离，通过 Frontmatter 管理。

### 2.2 导出期单一性 (Export Phase Singularity)
在构建与导出阶段，流水线必须将上述四者通过标准化的构建过程，合并为唯一的、自包含的 HTML 文件。
*   **零外部依赖 (Zero External Dependencies)**：产出的 HTML 文件不得包含任何指向外部服务器（CDN）或本地文件系统（相对路径）的引用。所有资源必须内联（Inline）。
*   **自包含 (Self-Contained)**：CSS 通过 `<style>` 注入，JS 通过 `<script>` 注入，图片/字体通过 Base64 编码注入。

### 2.3 性能约束：即时上下文 (Performance Constraint: Immediate Context)
为了避免性能浪费，导出操作必须且仅作用于 **当前正在查看/编辑的文档 (Active Document)**。
*   **按需触发 (On-Demand)**：仅在用户点击"导出"按钮时，针对当前上下文触发构建流水线。
*   **上下文隔离 (Context Isolation)**：构建过程不得扫描或处理非当前文档的数据，禁止全量构建整个项目或文件夹。
*   **资源精准提取 (Precise Resource Extraction)**：CssExtractor 仅提取当前页面渲染所需的样式规则，避免打包冗余的全局未用样式。

## 3. 原子化执行流水线 (Atomic Execution Pipeline)

导出过程被拆解为以下原子化步骤。每个步骤必须独立执行，具备明确的输入输出，并支持预检与回滚。

### Step 1: 资源提取 (Resource Extraction)
从运行时环境提取当前的 CSS 样式表与核心 JS 脚本。
*   **Action**: 遍历 DOM 或 StyleSheets，提取所有生效的 CSS 规则；读取预置的 `kernel.js` 内容。
*   **Output**: `memory://css_string` (Hash: SHA256), `memory://js_string` (Hash: SHA256)
*   **Pre-check**: 
    *   检查 `document.styleSheets` 是否非空。
    *   检查 `kernel.js` 是否存在于构建上下文中。
*   **Rollback**: 释放内存中的临时字符串变量。
*   **Errors**:
    *   `ERR_CSS_EMPTY`: 样式表为空 (Solution: 检查样式加载器配置)
    *   `ERR_JS_MISSING`: 核心脚本丢失 (Solution: 重新构建项目依赖)

### Step 2: 模板注入 (Template Injection)
将 Markdown 渲染后的 HTML 片段注入标准 HTML5 模板。
*   **Action**: 读取 `template.html`，替换 `{{CONTENT}}`, `{{TITLE}}`, `{{METADATA}}` 占位符。
*   **Output**: `memory://html_fragment` (Hash: SHA256)
*   **Pre-check**: 
    *   验证 Markdown 渲染结果不为空。
    *   验证模板文件包含必要占位符。
*   **Rollback**: 丢弃生成的 HTML 片段。
*   **Errors**:
    *   `ERR_TEMPLATE_INVALID`: 模板占位符缺失 (Solution: 恢复默认模板)
    *   `ERR_RENDER_FAILED`: Markdown 渲染失败 (Solution: 检查 Markdown 语法)

### Step 3: 资源内联 (Asset Inlining)
将提取的 CSS/JS 及图片资源内联到 HTML 片段中。
*   **Action**: 
    *   `<link rel="stylesheet">` -> `<style>...</style>`
    *   `<script src="...">` -> `<script>...</script>`
    *   `<img src="...">` -> `<img src="data:image/...">`
*   **Output**: `memory://final_html_string` (Hash: SHA256, Size: < 5MB)
*   **Pre-check**: 
    *   检查生成的文件大小是否超过浏览器 Blob 限制 (50MB)。
    *   检查所有外部链接是否已替换。
*   **Rollback**: 无需操作（内存自动回收）。
*   **Errors**:
    *   `ERR_ASSET_TOO_LARGE`: 单个资源超过 5MB (Solution: 压缩图片或使用外部链接)
    *   `ERR_CORS_BLOCK`: 跨域资源无法读取 (Solution: 配置 CORS 或使用本地资源)

### Step 4: 文件打包与下载 (Packaging & Download)
生成 Blob 对象并触发浏览器下载。
*   **Action**: `new Blob([html], {type: 'text/html'})` -> `URL.createObjectURL` -> `a.click()`.
*   **Output**: `filesystem://Download/YYYY-MM-DD-Title.html`
*   **Pre-check**: 
    *   检查浏览器是否支持 Blob API (`window.Blob`).
*   **Rollback**: `URL.revokeObjectURL(url)` 立即释放内存 URL。
*   **Errors**:
    *   `ERR_BLOB_NOT_SUPPORTED`: 浏览器不支持 (Solution: 升级浏览器)
    *   `ERR_DOWNLOAD_BLOCKED`: 浏览器拦截弹窗 (Solution: 允许弹窗或手动点击)

## 4. 编辑期一体化分析 (Editing Phase Integration)

**需求**：是否需要在编辑阶段就实时维护这个"单文件"结构？

**分析：**
*   **可行性 (Feasibility)**：高。可以使用 `<iframe>` 的 `srcdoc` 属性。
*   **必要性 (Necessity)**：低 (建议分离)。
    *   **性能考量**：实时编辑（Hot Reload）需要毫秒级响应。全量构建 Blob 会带来巨大开销。
    *   **调试考量**：分离的文件结构更利于 Source Maps 定位问题。

**结论**：采用 **"逻辑复用，物理分离"** 策略。
*   **预览**：保持 React 组件渲染，高性能。
*   **导出**：复用渲染逻辑，额外执行 Step 3 (资源内联)。

## 5. 实施计划 (Roadmap)

### Phase 1: 渲染引擎重构 (Renderer Refactor)
- [ ] **样式收集器**：实现 `CssExtractor` 类。
- [ ] **脚本封装**：将交互逻辑封装为无依赖模块。
- [ ] **HTML 模板化**：创建标准 `template.html`。

### Phase 2: 导出逻辑实现 (Export Logic)
- [ ] **转换管道**：实现上述 "原子化执行流水线"。
- [ ] **资源内联处理**：集成 Base64 转换工具。
- [ ] **文件名生成策略**：实现命名规范逻辑。

### Phase 3: UI 集成与验证 (UI Integration)
- [ ] **UI 组件**：添加导出按钮。
- [ ] **交互反馈**：实现 Loading 与 Toast 提示。

## 6. 待办清单 (Todo List)
- [ ] **[Core]** 编写 `HtmlBundler` 类
- [ ] **[Core]** 编写 `CssExtractor` 工具
- [ ] **[UI]** 实现 `DownloadButton` 组件
- [ ] **[Test]** 创建导出功能单元测试

## 7. 风险评估
- **文件体积**：内联图片可能导致体积过大 -> 增加体积警告。
- **样式丢失**：动态样式可能丢失 -> 确保使用 Class 管理样式。

## 8. 可重复执行验证 (Reproducibility Verification)

为了保证导出功能的稳定性，必须定期执行以下验证流程。

### 验证命令
在项目根目录执行：
```bash
make reproduce
```
*(注：该命令将自动执行以下操作)*
1.  **环境准备**：`git clone` (如有必要) -> `npm install`
2.  **构建测试**：`npm run build:export-test` (模拟导出流程)
3.  **产物比对**：`diff <(md5sum output.html) <(cat snapshot.md5)`

### 成功准则 (Success Criteria)
1.  **Hash 一致性**：导出的 HTML 文件 MD5 哈希值与预存的快照哈希值完全一致。
2.  **零错误 (Zero Errors)**：
    *   浏览器打开文件，控制台（Console）无任何红色错误。
    *   网络面板（Network）无 404 Not Found 请求。
    *   无跨域（CORS）警告。
3.  **功能完整**：
    *   样式渲染正确，无错位。
    *   交互功能（如折叠、切换）正常工作。
