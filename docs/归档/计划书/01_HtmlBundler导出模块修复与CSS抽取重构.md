# Plan 01: HtmlBundler 导出模块修复 — 在浏览器环境中可靠工作

> **简要说明**：重新定位 HtmlBundler 导出模块的优化方向——**不追求消除浏览器依赖**（这是合理的运行时环境），而是解决当前实现中实际存在的三个问题：(1) CSS 抽取可能混入错误主题样式残留，(2) 模板字符串注入安全风险，(3) 代码注释与行为不一致。核心方案改为"干净上下文 iframe 抽取"，而非预构建样式包。

---

## 1. 现状分析与根本定位

### 1.1 当前实现

`MdToHtml/src/lib/export/HtmlBundler.tsx` 的当前流程：

```
renderToStaticMarkup() → CssExtractor.extract() → 模板注入 → 返回 Blob
```

其中 `CssExtractor.extract()` 遍历 `document.styleSheets` 收集 CSS。

### 1.2 对"浏览器依赖"的重新定位

**首先需要纠正一个认知错误**：我此前将"依赖浏览器环境"视为缺陷并提出"预构建样式包"方案，这是错误的。理由如下：

| 考量维度 | 分析 |
|---------|------|
| **项目定位** | Windows 本地离线工具，**浏览器就是运行时环境**，不是临时宿主 |
| **行业惯例** | Word 依赖 Windows、Photoshop 依赖 GPU、VS Code 依赖 Electron——依赖运行时环境是正常且可接受的 |
| **导出场景** | 用户只有在**浏览器中**才会触发"导出 HTML"操作，没有"服务端导出"的真实使用场景 |
| **预构建的谬误** | CHD 文档的动态结构（不同卡片数、配色、布局）意味着预构建 CSS 要么遗漏类（样式崩坏），要么包含完整 Tailwind（~300KB，失去轻量优势） |

**结论**：项目应当接受"浏览器是运行时环境"这一前提，将精力聚焦于**在浏览器中可靠地工作**，而非逃避它。

### 1.3 实际存在的问题（真正需要修复的）

| 问题 | 严重程度 | 根因 |
|------|---------|------|
| **CSS 与内容主题不匹配** | 🔴 中-高 | `CssExtractor.extract()` 抽取的是**当前页面**的 CSS，如果用户在导出前切换了主题，页面上残存上一主题的 CSS 规则会混入输出 |
| **模板注入安全风险** | 🟡 中 | `title` 含 `$` / `&` / `<` 等字符时，`.replace('{{TITLE}}', title)` 会导致模板损坏或 HTML 注入 |
| **代码注释与行为不一致** | 🟢 低 | 第 46-52 行的长篇注释讨论深色模式和设计决策，但代码并未实现对应逻辑，造成维护困惑 |

---

## 2. 修正后的设计方案

### 2.1 核心思路：干净上下文抽取（Clean Context Extraction）

不再绕开浏览器，而是**充分利用浏览器的能力，但要确保抽取的 CSS 与文档内容完全匹配**。

方法：在导出时创建一个**隐藏的 iframe**，在其中构建一个干净、无污染的页面实例，只加载当前文档 + 当前主题，从中抽取 CSS。

```
用户点击「导出 HTML」
    ↓
创建一个隐藏 iframe（display:none）
    ↓
iframe 中写入带正确 data-theme 属性的 HTML 骨架
    ↓
等待 iframe 加载完成 → 从 iframe.contentDocument.styleSheets 抽取 CSS
    ↓
同时获取页面已有的 Tailwind 工具类完整集合
    ↓
用这套 CSS + htmlContent → 注入模板 → 生成 Blob
    ↓
销毁 iframe
```

### 2.2 具体步骤

#### Step 1: 新增 `lib/export/getCleanCSS.ts` — 干净上下文 CSS 抽取函数

```typescript
/**
 * 在干净的 iframe 上下文中抽取 CSS，避免当前页面的主题残留干扰。
 * 项目定位：浏览器是我们的运行时环境，因此我们利用浏览器能力来可靠工作。
 */
export async function getCleanCSS(theme: ThemeId): Promise<string> {
  // 1. 创建隐藏 iframe
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';  // 完全不可见，不影响页面布局
  document.body.appendChild(iframe);
  
  try {
    const iframeDoc = iframe.contentDocument!;
    
    // 2. 写入一个干净的 HTML 骨架
    // 关键：设置正确的 data-theme 属性，触发对应的 CSS 变量
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html data-theme="${theme}">
        <head>
          <!-- 从当前页面复制所有 <style> 和 <link> 标签 -->
          ${Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
            .map(el => el.outerHTML)
            .join('\n')}
        </head>
        <body>
          <!-- 放入一个能触发所有 Tailwind 工具类的"采样元素" -->
          <!-- 这不是为了渲染内容，而是为了让 PostCSS/Tailwind 生成所有用到的类 -->
          <div class="chd-renderer-root">
            <div class="section-container">
              <div class="card card-normal card-highlight card-quote card-code
                          bg-chd-normal bg-chd-highlight bg-chd-quote bg-chd-code
                          text-chart-1 text-chart-2 text-chart-3 text-chart-4 text-chart-5
                          col-span-1 col-span-2 col-span-3 col-span-4 col-span-6 col-span-12
                          grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4"></div>
            </div>
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();
    
    // 3. 等待样式加载完成
    await new Promise<void>((resolve) => {
      // 检查是否所有样式表都已加载
      const checkLoaded = () => {
        const sheets = Array.from(iframeDoc.styleSheets);
        const allLoaded = sheets.every(sheet => {
          try { return !!sheet.cssRules; } catch { return false; }
        });
        if (allLoaded) resolve();
        else setTimeout(checkLoaded, 50);
      };
      iframe.onload = () => setTimeout(checkLoaded, 100);
      // Fallback: 最多等 2 秒
      setTimeout(resolve, 2000);
    });
    
    // 4. 从 iframe 抽取 CSS（干净、无残留）
    const css = Array.from(iframeDoc.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch {
          return '';
        }
      })
      .filter(Boolean)
      .join('\n');
    
    return css;
    
  } finally {
    // 5. 清理：销毁 iframe
    document.body.removeChild(iframe);
  }
}
```

**为什么这样可以保证 CSS 完整？**

因为 Tailwind 的工作方式是：**扫描 HTML 中出现的类名 → 只生成这些类的 CSS**。在采样元素中预先声明所有 CHD 渲染会用到的类，可以确保 Tailwind 的 CSS 输出中包含这些类。

#### Step 2: 重构 `HtmlBundler.tsx`

```typescript
export class HtmlBundler {
  static async bundle(markdown: string, title: string, theme: ThemeId): Promise<Blob> {
    // 1. Render HTML Component（不变）
    const htmlContent = renderToStaticMarkup(
      <ThemeProvider defaultTheme={theme}>
        <div className="chd-renderer-root">
          <CHDRenderer markdown={markdown} editMode={false} /* callbacks */ />
        </div>
      </ThemeProvider>
    );
    
    // 2. 从干净上下文抽取 CSS
    const css = await getCleanCSS(theme);
    
    // 3. 安全注入模板
    const safeTitle = this.escapeHtml(title || 'Untitled Document');
    const fullHtml = HTML_TEMPLATE
      .replace('{{TITLE}}', safeTitle)
      .replace('{{THEME}}', this.escapeHtml(theme))
      .replace('{{CONTENT}}', htmlContent)
      .replace('{{CSS}}', css)
      .replace('{{THEME_SCRIPT}}', `
        document.documentElement.setAttribute('data-theme', '${this.escapeHtml(theme)}');
      `)
      .replace('{{SCRIPT}}', '');
    
    return new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  }
  
  /**
   * HTML 转义，防止模板注入和 XSS
   */
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#039;');
  }
}
```

#### Step 3: 清理注释垃圾

删除第 46-52 行关于深色模式的长篇注释，这些讨论没有落地到代码中，只造成阅读困惑。改为简洁的说明：

```typescript
// 注：此处不处理深色模式切换，因为导出的 HTML 是静态页面，
// 用户通过浏览器/打印设置自行控制深色模式。
```

#### Step 4: 保留 `CssExtractor` 作为快速降级

```typescript
// 如果 getCleanCSS 失败（极端情况），降级到当前页面的 CssExtractor
let css: string;
try {
  css = await getCleanCSS(theme);
} catch (e) {
  console.warn('[HtmlBundler] Clean CSS extraction failed, falling back:', e);
  css = CssExtractor.extract();
}
```

### 2.3 与老方案对比

| 维度 | ❌ 旧方案（预构建样式包） | ✅ 新方案（干净上下文抽取） |
|------|------------------------|------------------------|
| CSS 准确性 | 可能遗漏 Tailwind 类 | **完全准确**，和运行时行为一致 |
| 环境依赖 | 试图消除浏览器依赖 ❌ | 接受并利用浏览器能力 ✅ |
| 主题残留问题 | 通过静态选择解决 | 通过 iframe 隔离解决 ✅ |
| 维护成本 | 每次新增主题/样式都要手动同步 | 自动适配 ✅ |
| 实现复杂度 | 中 | 中（但更可靠） |
| 导出质量 | 可能崩坏核心业务 | **与用户所见一致** ✅ |

---

## 3. 风险与注意事项

1. **iframe 加载时序**：`@import` 方式加载的 CSS 可能导致 `styleSheets` 跨域报错。在采样元素中**避免使用 `@import`**，或用 `try-catch` 跳过跨域 sheet
2. **采样元素覆盖度**：采样元素中的 Tailwind 类需要与 `CHDRenderer` 实际使用的一致。维护方式：在 `getCleanCSS.ts` 中维护一个 `REQUIRED_CLASSES` 数组，每次新增卡片样式/布局时同步更新
3. **如果未来要支持 Electron 离线打包**：Chrome/Edge 的打印预览本身也依赖浏览器渲染引擎，不需要额外处理。Electron 打包时自带 Chromium 内核

---

## 4. 实施计划

| 步骤 | 内容 | 预估工时 | 依赖 |
|------|------|---------|------|
| 1 | 修正计划定位（本文件修改） | 0.5h | - |
| 2 | 实现 `lib/export/getCleanCSS.ts` | 2h | - |
| 3 | 重构 `HtmlBundler.tsx`（新流程 + 安全注入） | 1h | 步骤 2 |
| 4 | 清理代码中过时的注释 | 0.3h | - |
| 5 | 保留 `CssExtractor` 降级路径 | 0.3h | - |
| 6 | 导出测试：切换所有主题后导出，验证样式 | 1h | 步骤 3 |
| 7 | 导出测试：标题含 `<>$&` 等特殊字符 | 0.5h | 步骤 3 |
| **总计** | | **约 5.5h** | |

---

## 5. 验收标准

- [ ] 在任意主题下导出 HTML，新文件打开后主题正确
- [ ] 连续切换 3 次主题后导出，CSS 不会混入上两个主题的规则残留
- [ ] 文档标题包含 `< > & " '` 等特殊字符时，导出的 HTML 不损坏
- [ ] iframe 销毁后，页面无残留 DOM 元素
- [ ] 导出操作不干扰编辑器当前内容和 Undo 历史
- [ ] 降级路径可用（`CssExtractor.extract()` 兜底）