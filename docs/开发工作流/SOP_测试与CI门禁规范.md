# 标准测试与 CI 门禁规范 (Testing & CI Gate SOP)

本文档确立 `MdToHmtl` 项目的自动化测试与 CI 门禁标准，确保每次改动都经过**可复现**的四道门禁验证，并且 E2E 永远不污染真实用户数据。

> **建立日期**: 2026-09-14
> **适用对象**: 本项目全部开发人员（含 AI 助手）
> **配套报告**: [`docs/自动化测试与CI流水线_完成度分析报告_2026-09-14.md`](../自动化测试与CI流水线_完成度分析报告_2026-09-14.md)
> **核心原则**:
> 1. **本地绿 ≈ CI 绿**: 提交前必须跑 `npm run verify`（与 CI `build` job 等价）。
> 2. **测试写在对的层次**: 纯函数写单测，用户流程写 E2E，避免 mock 密集型测试。
> 3. **数据零污染**: E2E 只读写 `.e2e-tmp/`，绝不触碰 `input/`、`posts/`、`.trash/`。
> 4. **门禁只升不降**: 覆盖率阈值随实测提升，禁止为了"好看"放宽口径或降阈值。

---

## 一、命令速查表

所有命令均在 `MdToHtml/` 目录下执行。

| 命令 | 内容 | 典型耗时 | 何时用 |
|------|------|:--------:|--------|
| `npm run verify` | `typecheck && lint:strict && test:ci` | ~30s | ★ **提交前必跑**（等价 CI `build` job） |
| `npx playwright test` | E2E（自动拉起隔离服务器） | ~25s | 改动涉及页面 / 交互 / 导出时 |
| `npm run test:all` | `test:ci && test:e2e` | ~55s | 大改动的完整回归 |
| `npm test` | Jest 单测（无覆盖率） | ~7s | 快速迭代单测 |
| `npm run test:watch` | Jest watch 模式 | — | 写单测时 |
| `npm run test:ci` | `jest --ci --coverage`（含阈值门禁） | ~10s | 需要覆盖率数字时 |
| `npm run typecheck` | `tsc --noEmit` | ~10s | 改类型 / 接口后 |
| `npm run lint:strict` | `next lint --max-warnings 0` | ~15s | 提交前 |
| `npm run test:e2e:report` | 打开上一次 E2E 的 HTML 报告 | — | E2E 失败排查 |
| `npm run build` | 生产构建 | ~40s | 改 `next.config.js` / 路由后 |

> **Windows 提示**：PowerShell 下如需重定向日志，用 `cmd /c "npm run test:ci > %TEMP%\jest.log 2>&1"`，避免 `*>` 在 npm 输出 stderr 时被 PowerShell 判定为 NativeCommandError。

---

## 二、四道门禁

| 顺序 | 门禁 | 命令 | 通过标准 | 失败时做什么 |
|:----:|------|------|----------|--------------|
| ① | 类型检查 | `npm run typecheck` | 0 错误 | 修类型；**禁止**用 `any` / `@ts-ignore` 掩盖 |
| ② | 代码规范 | `npm run lint:strict` | `✔ No ESLint warnings or errors` | 修 warning；不要改成 `--max-warnings` 放宽 |
| ③ | 单元测试 + 覆盖率 | `npm run test:ci` | 25+ 套件全通过；四项覆盖率 ≥ 阈值 | 看失败套件定位；覆盖率不足则补用例（见 §4） |
| ④ | 端到端测试 | `npx playwright test` | 7+ passed | 看 `playwright-report/` 截图与 trace（见 §6.3） |

CI 中的对应关系：

```
ci.yml   build job = ① ② ③ + npm run build          → 必须全绿
ci.yml   e2e   job = ④（needs: build）                → 必须全绿（硬门禁）
pr-check.yml       = ① ② ③ + 上传 coverage/           → PR 必须全绿
```

---

## 三、单元测试规范（Jest + React Testing Library）

### 3.1 文件位置与命名

```
src/lib/__tests__/<模块名>.test.ts           # lib 纯函数
src/lib/<模块>.test.ts                       # lib 单文件（如 validator.test.ts）
src/components/**/__tests__/<组件>.test.tsx  # 组件
src/hooks/__tests__/<hook>.test.ts(x)        # hooks
src/app/**/__tests__/<route|page>.test.ts(x) # 页面 / API 路由
```

- Jest 的 `testMatch` 只收 `src/**`，**`e2e/` 由 Playwright 独占**（改 `testMatch` 前先想清楚，历史上曾因缺少 `testPathIgnorePatterns: /e2e/` 导致 3 个 Playwright spec 被误收）。
- 路径别名用 `@/`（映射到 `src/`），不要写 `../../..` 长相对路径。

### 3.2 写什么样的测试（本项目的既有结论）

| 模块性质 | 推荐做法 | 理由 |
|----------|----------|------|
| 纯函数（解析器、校验器、操作引擎） | ✅ 单测，边界优先 | 输入输出稳定，重构只改期望值 |
| React 组件 | ⚠️ 少写单测，优先 E2E | props / DOM 结构一变即失效 |
| Hook（`useXxx`） | ⚠️ 只测对外行为 | 同上 |
| 网络 / FS 依赖 | ✅ 测核心分支，mock 掉 IO | 关注"错误映射""Key 不回显"这类契约 |
| CSS 类名 / 视觉 | ❌ 不写单测 | Tailwind 重构即全灭；用 E2E + 人工比对 |

### 3.3 断言原则

1. **按真实行为断言，不按直觉断言**。发现实现有局限时，写"已知局限"用例把现状**锁定**并加注释，而不是断言"应该怎样"（例：`chdParser.edge.test.ts` 中"文档以代码块开头会被丢弃"的用例）。
2. **mock 打在正确的接缝上**。先读实现再决定 mock 谁（例：`HtmlBundler` 主路径是 `getCleanCSS`，`CssExtractor` 只是降级路径）。
3. 每个用例名说清"输入 → 期望"，避免 `it('works')`。

---

## 四、覆盖率门禁与阈值规则

### 4.1 统计口径（不可擅改）

```js
// jest.config.js
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  '!src/**/*.d.ts',
  '!src/**/__tests__/**',
  '!src/**/*.test.{ts,tsx}',
  '!src/**/*.spec.{ts,tsx}',
]
```

- 口径是 **全量 `src`**。若删掉 `collectCoverageFrom`，分母会退化成"测试触达的文件"，数字会虚高（历史上曾因此显示 41%，误导决策）。
- 覆盖率**只在 `test:ci`（= `jest --ci --coverage`）中统计**，`npm test` 不统计、也不触发阈值。

### 4.2 阈值标定规则

```
新阈值 = floor(全量口径实测值) − 1
```

即阈值只承担"**防回退**"职责，不是目标值。当前值（2026-09-14 基线 20.5 / 15.82 / 14.03 / 21.25）：

| 指标 | 实测 | 阈值 | 目标（计划） |
|------|:----:|:----:|:------------:|
| Statements | 20.5 | 19 | ≥60 |
| Branches | 15.82 | 14 | ≥50 |
| Functions | 14.03 | 13 | ≥70 |
| Lines | 21.25 | 20 | ≥60 |

**抬升流程**：补用例 → 跑 `npm run test:ci` 记录实测 → 按公式改 `coverageThreshold` → 同步更新本表与 `jest.config.js` 注释中的基线 → 单独提交（提交信息注明"覆盖率阈值 x→y"）。

**禁止**：为了过门禁而调低阈值；为了好看而缩小 `collectCoverageFrom`；把阈值改动混在功能提交里。

### 4.3 优先补测的模块（按性价比）

| 优先级 | 模块 | 现状 | 建议用例数 |
|:------:|------|------|:----------:|
| P0 | `src/lib/cache-manager.ts` | 23.66%（无专属测试） | 8（get/set/invalidate/warmUp/容量上限/异步扫描） |
| P1 | `src/lib/trash-manager.ts` | 8.17% | 6（删除→列表→恢复→清空） |
| P1 | `src/services/core/ApiClient.ts`、`TransactionManager.ts` | 5.55% / 4.34% | 6（重试、超时、事务回滚） |
| P2 | `src/lib/utils.ts` | 100%（间接） | 2（独立锁定格式化/转换行为） |
| P2 | `src/services/ai/*` | 11.5% | 4（错误映射、Prompt 组装；mock 掉网络） |
| P3 | `src/lib/export/getCleanCSS.ts` | 3.84% | 不写单测（依赖真实 iframe），靠 E2E 导出用例覆盖 |

---

## 五、E2E 规范（Playwright）

### 5.1 数据隔离（最重要，改动前必须读）

```
playwright.config.ts
  webServer.command = 'npm run dev'
  webServer.env     = { MDTOHTML_CONFIG: 'config.e2e.json' }
  webServer.reuseExistingServer = false     ← 绝不可改成 true

config.e2e.json
  paths.input/output/data/trash → .e2e-tmp/*

src/lib/config-manager.ts
  读取 process.env.MDTOHTML_CONFIG（默认 config.json，线上行为不变）
```

**为什么 `reuseExistingServer` 必须是 `false`**：若复用开发者手动启动的服务器，该服务器没有加载 `config.e2e.json`，E2E 会直接操作真实 `input/` 与 `.trash/`（历史上 `file-management.spec.ts` 曾删除真实文档列表第一项）。

**每次改动 E2E 后自检**：

```powershell
(Get-ChildItem MdToHtml\input -Filter *.md).Count      # 前后应一致（当前 27）
(Get-Item MdToHtml\config.json).LastWriteTime          # 前后应一致
git status -- MdToHtml/input MdToHtml/.trash MdToHtml/config.json
```

### 5.2 稳定选择器约定

生产代码中的稳定钩子（**优先使用**）：

| 选择器 | 位置 | 用途 |
|--------|------|------|
| `[data-testid="doc-item"][data-slug="…"]` | `src/components/ui/DocumentItem.tsx` | 左侧文档列表条目 |
| `[data-testid="trash-item"][data-file-name*="…"]` | `src/components/RecycleBin.tsx` | 回收站文件 |
| `[data-testid="trash-restore"]` | `src/components/RecycleBin.tsx` | 回收站工具栏「恢复」 |
| `[data-card-style="normal\|highlight\|quote\|code"]` | `src/components/CHD/Card.tsx` | 渲染出的卡片 |

> ⚠️ `data-testid="edit-button" / "save-button" / "cancel-button" / "export-button"` 等**只存在于测试 mock 中**，生产代码尚未提供，因此在 E2E 里只能用中文按钮名（`getByRole('button', { name: '编辑页面' })`）或 `title` 属性（`button[title="导出为静态网页 (HTML)"]`）。**这属于已知脆弱点（报告 G7）**：UI 文案一改，用例会以"元素找不到"的形式静默失效。新增交互时请顺手补 `data-testid`，并同步更新 `e2e/test-helpers.ts`。

### 5.3 公共工具（`e2e/test-helpers.ts`）

| 函数 | 用途 |
|------|------|
| `seedDoc(slug, content?)` | 向 `.e2e-tmp/input/` 写 fixture（默认 `SAMPLE_CHD_DOC`：1 section + 3 卡片 + 引用 + 代码块） |
| `readDoc(slug)` / `removeDoc(slug)` | 读 / 删隔离目录中的文档（`afterAll` 清理） |
| `resetTrash()` | 清空隔离回收站（文件带时间戳，防止上一轮残留造成同名多命中） |
| `makeImportFixture(name)` | 生成 `.e2e-tmp/upload/` 下的待导入文件 |
| `docItem(page, slug)` | 定位文档条目 |
| `ensureDocListed(page, slug)` | 刷新 + 重试等待列表出现（`/api/files` 走 CacheManager 的最终一致性） |
| `openDoc(page, slug)` | 列表 → 进入 `/editor/<slug>` → 等卡片渲染 |
| `enterEditMode(page)` | 点击「编辑页面」并等待「保存修改」出现 |

### 5.4 编写新用例的模板

```ts
import { test, expect } from '@playwright/test';
import { seedDoc, removeDoc, openDoc, enterEditMode } from './test-helpers';

const SLUG = 'e2e-<你的场景名>';

test.describe('<场景分组>', () => {
  test.beforeAll(() => seedDoc(SLUG));
  test.afterAll(() => removeDoc(SLUG));

  test('<输入 → 期望>', async ({ page }) => {
    await openDoc(page, SLUG);
    // 用 data-testid / 语义角色定位，避免 waitForTimeout
    await expect(page.locator('[data-card-style="normal"]').first()).toBeVisible();
  });
});
```

### 5.5 运行策略

| 项 | 本地 | CI |
|----|------|----|
| `fullyParallel` | `false`（共享同一隔离目录，并行会互相干扰） | 同 |
| `workers` | 3（默认） | 1 |
| `retries` | 0 | 2（`trace: on-first-retry`） |
| 失败证据 | `test-results/`（截图 + trace） | 同上，并作为 artifact 上传 |

---

## 六、故障排查决策树

### 6.1 CI 完全没跑（GitHub Actions 页面没有记录）

```
① CI 平台与远端匹配吗？     远端是 Gitee（origin）⇒ .github/workflows/*.yml 不会执行
                              → 要么加 GitHub 远端，要么改用 Gitee Go（.workflow/*.yml）
② 仓库有 remote 吗？         git remote -v            → 空 ⇒ git remote add origin <url> 并 push
③ 推的是 master 吗？         workflow 仅监听分支 master（push / PR）
                              → 在特性分支上 push 不会触发，符合预期
④ 提交只改了文档吗？         paths-ignore: docs/**、**.md ⇒ 纯文档提交不触发
⑤ workflow 文件在仓库根 .github/workflows/ 吗？
                              MdToHtml/.github/workflows/ 是"嵌套位置"，GitHub 永不执行（历史坑，已清理）
⑥ push 被拒（非快进）？      git rev-list --left-right --count origin/<branch>...<branch>
                              → 分叉时先合并，**禁止 force push**（会覆盖远端提交）
⑦ 打开 Actions 页看是否有"workflow disabled"或 YAML 语法错误
```

### 6.2 Jest 失败

| 现象 | 原因 | 处置 |
|------|------|------|
| `Class extends value undefined` | Playwright spec 被 Jest 误收 | 确认 `jest.config.js` 的 `testPathIgnorePatterns` 含 `/e2e/` |
| 找不到被测模块 / Cannot find module `@/...` | 模块未提交（untracked） | `git status` 确认文件已入库（历史上 7 月成果未提交导致 CI 找不到模块） |
| 覆盖率低于阈值导致 EXITCODE≠0 | 新增源码未同步补测 | 补用例；**不要**降阈值（见 §4.2） |
| 断言数字/枚举数量不符 | 测试过期 or 功能回归 | 先读实现定性：是"测试写着旧期望"还是"实现真退化"；前者改期望并把结论写进提交信息 |

### 6.3 Playwright 失败

```
① 先开报告：npm run test:e2e:report
② 看失败点是"定位不到元素"还是"断言不符"
   ├─ 定位不到元素 ⇒ 90% 是 UI 文案/结构变了
   │    ├─ 打开 test-results/ 里的截图确认当前真实 UI
   │    ├─ 优先改用 data-testid；没有就补一个（生产代码里加）
   │    └─ 更新 e2e/test-helpers.ts 的选择器
   └─ 断言不符 ⇒ 看是产物变了还是真实回归
        ├─ 导出用例：确认 <title> / data-card-style / 内联 CSS 是否还在
        └─ 列表用例：CacheManager 最终一致 ⇒ 用 ensureDocListed 而非固定 sleep
③ 本地过、CI 挂：多为时序 / 并行问题
   ├─ 确认 CI workers=1、retries=2 未被改动
   └─ 禁止用长期 waitForTimeout 掩盖（本地会过，CI 会随机挂）
④ 报错"数据被污染" ⇒ 立即检查 reuseExistingServer 是否为 false，
   并核对 config.e2e.json 是否仍指向 .e2e-tmp/
```

### 6.4 Windows 本地特有

| 现象 | 处置 |
|------|------|
| 终端中文乱码 | `chcp 65001`；或用 `cmd /c` 执行并重定向日志后读取文件 |
| `npm run xxx *> log` 被 PowerShell 判为 NativeCommandError | 改用 `cmd /c "npm run xxx > %TEMP%\log 2>&1"` |
| `nginx`/端口占用导致 webServer 起不来 | 确认 3000 端口空闲（`npx playwright test` 要求自建服务器） |
| `npm warn Unknown project config "electron_mirror"` | 无害提示（来自 `.npmrc`），不影响门禁 |

---

## 七、一次改动的门禁动作清单（Checklist）

**写代码前**
- [ ] 确认改动属于哪一层 → 决定写单测还是补 E2E（§3.2）

**写代码时**
- [ ] 新增交互元素时补 `data-testid`（避免后续 E2E 依赖中文文案）
- [ ] 新增纯函数模块时同步在 `src/**/__tests__/` 建测试文件

**提交前**
- [ ] `cd MdToHtml && npm run verify` → EXITCODE=0
- [ ] 若动了 UI / 交互 / 导出：`npx playwright test` → 全通过
- [ ] 若动了 E2E：按 §5.1 做隔离自检（`input/` 计数、`config.json` mtime、`git status`）
- [ ] 覆盖率有提升 → 按 §4.2 抬阈值并单独记录

**收尾（按 `.cursorrules` 第 6 条）**
- [ ] 归档计划书到 `docs/归档/计划书/`（`scripts\archive_and_record.bat --plan <文件名>`）
- [ ] 写 `docs/开发记录/历史记录/[日期]_开发记录.md` 并更新 `docs/开发记录/开发记录索引.md`
- [ ] 若测试体系/CI 有变化：更新本手册 + `docs/自动化测试与CI流水线_完成度分析报告_2026-09-14.md` + `MdToHtml/tests/README.md`

---

## 八、相关文档

| 文档 | 说明 |
|------|------|
| [`docs/自动化测试与CI流水线_完成度分析报告_2026-09-14.md`](../自动化测试与CI流水线_完成度分析报告_2026-09-14.md) | 完成度、缺口与后续路线（数据来源） |
| [`MdToHtml/tests/README.md`](../../MdToHtml/tests/README.md) | 测试体系说明（三层结构 + 命令 + 历史遗留清单） |
| [`plans/测试工程/00_CI全绿计划书_2026-09-14.md`](../../plans/测试工程/00_CI全绿计划书_2026-09-14.md) | P0–P5 执行记录（含 E2E 稳定化的根因分析） |
| [`plans/测试工程/01_CI缺口补全计划_2026-09-14.md`](../../plans/测试工程/01_CI缺口补全计划_2026-09-14.md) | 后续 P6–P8 任务分解 |
| [`docs/归档/计划书/CI_CD流水线/00_CI_CD流水线总体计划书_2026-07-12.md`](../归档/计划书/CI_CD流水线/00_CI_CD流水线总体计划书_2026-07-12.md) | 原始四阶段设计（含 release.yml / Codecov 设计稿）· 已于 2026-09-14 归档 |
| [`docs/工程目录与版本规范.md`](../工程目录与版本规范.md) | 产物目录与"禁止提交可再生产物"铁律 |

---

> **变更记录**
> | 日期 | 变更 |
> |------|------|
> | 2026-09-14 | 首次建立：命令速查、四道门禁、单测与 E2E 规范、覆盖率阈值规则、故障排查决策树 |
