# 测试体系说明

MdToHtml Pro 的自动化测试分三层：**单元测试（Jest）→ 端到端测试（Playwright）→ 手工验证**。
CI 门禁由前两层 + 类型检查 + 代码规范共同构成。

> 本文档于 2026-09-14 重写。此前的版本描述的是"浏览器测试页 + Python 集成脚本"，
> 与当前实际使用的 Jest/Playwright 体系不符（详见文末「历史遗留」）。

---

## 1. 快速开始

```bash
cd MdToHtml

npm test              # 单元测试
npm run test:ci       # 单元测试 + 覆盖率（CI 使用）
npm run test:e2e      # 端到端测试（自动拉起隔离的开发服务器）
npm run typecheck     # TypeScript 类型检查
npm run lint:strict   # ESLint，零容忍（--max-warnings 0）

npm run verify        # ★ 一条命令跑完 CI 的全部门禁（推荐提交前执行）
npm run test:all      # 单元 + E2E
```

`npm run verify` = `typecheck && lint:strict && test:ci`，即 CI 中 `build` job 的等价命令。
**本地绿 ≈ CI 绿**，这是一个可依赖的约定。

---

## 2. 单元测试（Jest + React Testing Library）

| 项 | 说明 |
|----|------|
| 框架 | Jest 30 + ts-jest，`@testing-library/react` 测组件，环境为 `jest-environment-jsdom` |
| 配置 | `jest.config.js`、`jest.setup.ts` |
| 用例位置 | `src/**/__tests__/**/*.{ts,tsx}`、`src/**/*.test.{ts,tsx}`、`src/**/*.spec.{ts,tsx}` |
| 排除 | `e2e/`（由 Playwright 负责）、`node_modules/`、`.next/` |

### 当前规模（2026-09-14）

- **25 个测试套件 / 213 个用例，全部通过**
- 全量口径覆盖率：Stmts 20.5% / Branch 15.82% / Funcs 14.03% / Lines 21.25%

### 覆盖重点

| 模块 | 测试文件 | 关注点 |
|------|----------|--------|
| CHD 解析器（DFA） | `src/lib/__tests__/chdParser.test.ts`、`chdParser.edge.test.ts` | 状态机边界：代码块内的标题不得被误判、frontmatter、CRLF、未闭合块 |
| 属性解析 | `src/lib/__tests__/attributeParser.test.ts`、`attributeParser.edge.test.ts` | 中文花括号、最后 `{` 规则、引号/无引号写法 |
| 操作引擎 | `src/lib/__tests__/operation.test.ts`、`OperationBuilder.test.ts`、`src/types/__tests__/invertOperation.test.ts` | 13 种操作类型、逆操作计算、撤销/重做的数学基础 |
| 导出 | `src/lib/export/HtmlBundler.test.tsx` | CSS 抽取主路径、降级路径、标题转义 |
| AI 代理 | `src/app/api/ai/generate/__tests__/route.test.ts` | **API Key 不出前端**、模型白名单、超时/限流/错误映射 |
| 文件系统 | `src/services/__tests__/FileService.test.ts`、`src/lib/__tests__/posts.test.ts`、`trash-manager.test.ts` | 增删改查、回收站、持久化 |
| 搜索 | `src/hooks/__tests__/useSearch.test.tsx` | Fuse.js 索引字段与命中 |
| 组件 | `src/components/**/__tests__/` | Card / CHDRenderer / DocumentItem / ExportButton / NavigationHeader 等 |

### 覆盖率门禁

阈值写在 `jest.config.js` 的 `coverageThreshold`，按 **「实测基线向下取整再减 1 个百分点」** 标定，
作用是防止回退，而不是充当目标值。当前：statements 19 / branches 14 / functions 13 / lines 20。

> 注意口径：统计范围为**全量 `src`**（`collectCoverageFrom`，排除测试文件与 `.d.ts`）。
> 早期未配置该项时，分母仅为"测试触达的文件"，会显著抬高数字（曾显示 41%）。

---

## 3. 端到端测试（Playwright）

| 项 | 说明 |
|----|------|
| 框架 | Playwright 1.61（Chromium） |
| 配置 | `playwright.config.ts` |
| 用例位置 | `e2e/*.spec.ts`，公共工具 `e2e/test-helpers.ts` |
| 报告 | `playwright-report/`（HTML）、`test-results/`（失败截图与 trace） |

### 数据隔离（重要）

E2E **不会触碰真实文档**。机制如下：

```
playwright.config.ts  →  webServer.env.MDTOHTML_CONFIG=config.e2e.json
config.e2e.json       →  paths.input/output/data/trash 全部指向 .e2e-tmp/
src/lib/config-manager.ts → 读取 process.env.MDTOHTML_CONFIG（默认仍为 config.json，线上行为不变）
```

- 隔离目录：`.e2e-tmp/{input,output,data,trash}`（已在 `.gitignore` 中）
- `reuseExistingServer: false`：强制 Playwright 自己拉起带隔离配置的服务器，
  避免复用开发者手动启动的服务器（那会直接操作真实文档）
- 用例通过 `seedDoc()` 直接向隔离目录写入 fixture，`afterAll` 清理自己写入的文件

### 当前用例（7 个，全部通过）

| 文件 | 场景 |
|------|------|
| `e2e/editor-workflow.spec.ts` | 文档列表 → 打开文档 → CHD 卡片渲染；进入/退出编辑模式；保存链路 |
| `e2e/file-management.spec.ts` | 导入本地文件 → 出现在列表；右键删除 → 回收站 → 恢复 |
| `e2e/search-and-export.spec.ts` | 全文搜索命中；导出 HTML 并校验产物为自包含单文件 |

### 稳定选择器约定

优先使用以下稳定钩子，避免依赖中文文案（文案改动会让用例静默失效）：

- `[data-testid="doc-item"][data-slug="..."]`：文档列表条目
- `[data-testid="trash-item"][data-file-name*="..."]`：回收站文件
- `[data-testid="trash-restore"]`：回收站「恢复」按钮
- `[data-card-style="normal"|"highlight"|"quote"|"code"]`：渲染出的卡片
- 顶部栏按钮：`编辑页面` / `保存修改` / `取消/预览`，导出 `button[title="导出为静态网页 (HTML)"]`

---

## 4. 手工验证

自动化测试覆盖不到的部分（拖拽排序、AI 真实调用、Electron 打包产物等）请按下表人工确认：

1. **AI 生成**：需配置真实 DeepSeek Key（`.env.local` 或设置页），E2E 不调用外部服务。
2. **拖拽排序 / 批量选择**：涉及指针事件与布局计算，建议人工验证。
3. **Electron 打包**：`npm run build:electron`，确认便携版 EXE 启动与文件读写正常。
4. **主题切换的视觉保真**：导出 HTML 与编辑器预览逐一比对。

---

## 5. 历史遗留（不在 CI 中运行）

以下内容保留在仓库中，但**不属于当前测试体系，CI 不会执行它们**：

| 文件 | 说明 |
|------|------|
| `src/app/test/page.tsx` | 早期的"浏览器内测试页"（访问 `/test` 查看 PASS/FAIL），已被 Jest 取代 |
| `tests/integration_test.py` | Python 集成脚本，依赖 Windows 专用的 `start.bat`，跨平台不可用 |
| `tests/integration/test_workflow.py`、`tests/unit/test_migration.py` | 早期生成的 Python 用例，与 TS 技术栈无关 |

> 是否归档/删除上述文件待定；在清理前请勿把它们当作有效测试依据。
> （此前 `MdToHtml/.github/workflows/ci.yml` 曾误引用 `tests/unit/test_migration.py`，
> 该嵌套路径的 workflow GitHub 永远不会执行，已删除。）
