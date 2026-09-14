# Gitee 流水线配置指南（方案 B：Gitee Go）

> **建立日期**：2026-09-14
> **背景**：本项目远端仓库在 **Gitee**（`https://gitee.com/njustzjh/md-to-html`），而仓库内的 `.github/workflows/*.yml` 是 **GitHub Actions** 定义 —— **Gitee 不会执行它们**。因此"远端全绿"必须改用 Gitee 的流水线（Gitee Go）。
> **配套**：`plans/测试工程/01_CI缺口补全计划_2026-09-14.md` §6.0（平台决策）、`docs/开发工作流/SOP_测试与CI门禁规范.md`（门禁与排查）、`docs/自动化测试与CI流水线_完成度分析报告_2026-09-14.md`（现状与缺口）

---

## 一、本方案要做的事（一句话）

把**本地已实测通过**的同一套命令（`npm run verify` + `npx playwright test`）搬进 Gitee 流水线，使"代码推上去 → 远端自动跑门禁 → 红绿可见"。

```
.github/workflows/ci.yml       ← GitHub Actions（Gitee 不执行，保留给 GitHub 镜像/未来迁移）
.github/workflows/pr-check.yml ← 同上
.workflow/ci.yml               ← ★ 本次新增：Gitee Go 流水线（方案 B 的落地文件）
```

---

## 二、启用步骤（Gitee 网页操作，逐步）

### Step 0（前置）：确认"从哪个分支读流水线文件"

Gitee 在 YAML 模式下会**从你选定的分支读取 `.workflow/*.yml`**。当前远端事实（2026-09-14 实测）：

| 分支 | 是否含 `.workflow/ci.yml` | 说明 |
|------|:------------------------:|------|
| `feat/exe-package-ready` | ✅ **有**（提交 `5455562`） | 本次全部成果所在分支 |
| `test/ci-green` | ✅ 有（同一提交） | 与上者同快照 |
| `master` | ❌ **没有** | 只比特性分支多一个 `2f53061 add LICENSE.` 提交 |

因此有两条可行路径：

- **路径 A（推荐先做，5 分钟内能看到运行结果）**：创建流水线时把**代码源分支选为 `feat/exe-package-ready`** → 立即能跑。
  - 注意：此时 `master` 上的推送**不会**触发流水线（因为 master 分支下没有该 YAML 文件）。
- **路径 B（长期正解，让 `master` 的推送也能触发）**：把特性分支合并进 `master`（或只把 `.workflow/ci.yml` 单独 cherry-pick 到 master）并推送，然后用 `master` 创建流水线。
  - 若合并 master：需先处理"master 多了 `LICENSE`"这一处改动，其余均为快进内容。
  - 也可以 A、B 都做：先用 A 验证流水线本身可用，再走 B 把触发面补齐。

> 本文以下步骤以**路径 A** 为例（分支名出现处会标注若走路径 B 应替换为 `master`）。

### Step 1：进入仓库的流水线页面

1. 浏览器打开 `https://gitee.com/njustzjh/md-to-html`
2. 仓库顶部导航找到 **「流水线」** 入口并点击
   - 部分账号/版本显示为 **「Gitee Go」** 或 **「持续交付」**，位置可能在顶部导航右侧或「服务」下拉菜单中
   - 若**完全没有该入口**：说明当前账号/仓库类型未开通流水线能力 → 见 Step 8 与第七节（回退方案）

### Step 2：新建流水线

1. 点击 **「新建流水线」**（或 `+ 新建`）
2. 选择 **「YAML 模式」**（也可能写作「代码库中的流水线文件」/「YAML 配置」）
   - ⚠️ **不要选「可视化模式/图形化编排」** —— 那样不会读取仓库里的 `.workflow/ci.yml`

### Step 3：选择分支与流水线文件

1. **代码源分支**：选择 `feat/exe-package-ready`（走路径 B 则选 `master`）
2. **流水线文件**：从列表中选择 **`.workflow/ci.yml`**
   - 若下拉为空：确认所选分支上确实有该文件（见 Step 0 的表格），或刷新页面重新拉取
3. **流水线名称**：可填 `CI` 或 `ci`（与文件内 `name: ci` 一致更直观）

### Step 4：检查触发方式（保持"随代码推送/PR 触发"）

- 创建页若提供「触发方式」选项，选择 **代码推送（push）/ Pull Request 触发**；一般由 YAML 的 `triggers` 段决定，页面选项无需额外配置
- 保存/确定，进入流水线详情页

### Step 5：手动运行一次（首次务必手动，便于看日志）

1. 在流水线详情页点击 **「运行」**（或「立即构建」）
2. 若要求选择分支/参数：分支选 `feat/exe-package-ready`，参数留空（本流水线只用到 `variables.MDTOHTML_DIR`）
3. 运行开始后进入 **运行详情 / 日志** 页面

### Step 6：看日志，按阶段核对（预期输出）

| 阶段 | 步骤 | 期望日志 |
|------|------|----------|
| `gates` | `环境自检` | `v20.x`（Node 20）。若为 `command not found` → 见 Step 7-① |
| `gates` | `安装依赖` | `npm ci` 正常结束（约 1–3 分钟） |
| `gates` | `类型检查 + Lint + 单测` | `✔ No ESLint warnings or errors`、`Test Suites: 25 passed`、`Tests: 213 passed`、`All files | 20.5 | 15.82 | 14.03 | 21.25` |
| `build-and-e2e` | `生产构建` | `✓ Compiled successfully` |
| `build-and-e2e` | `E2E 测试` | `7 passed`（首次需先下载 Chromium） |
| `build-and-e2e` | `保留失败证据` | 打印 `playwright-report/`、`test-results/` 路径 |

全部通过 → **流水线变绿，远端验收完成**。
任一阶段失败 → 见 Step 7 与 `SOP_测试与CI门禁规范.md` §6。

### Step 7：首次运行最可能的 3 个问题与处置

| # | 现象 | 原因 | 处置 |
|:-:|------|------|------|
| ① | `node: command not found` / Node 版本过低 | 执行镜像未预装 Node 20 | 在流水线里把 `install` 步骤替换为页面步骤库中的 **Node/npm 步骤**（选择 Node 20），或在流水线设置中指定带 Node 20 的镜像；`环境自检` 步骤保留用于确认 |
| ② | 保存 YAML 时报 **字段名/结构错误** | 文件顶部字段（`name` / `displayName` / `triggers` / `variables` / `stages[].stage.steps[].step`）与页面模板有差异（该结构未在真实流水线验证过，见 §五） | 按页面模板改**顶部结构**；**步骤内的 `shell@1` + `npm` 命令无需改动**。把报错原文贴回即可一次性校正 |
| ③ | `playwright install --with-deps` 失败 | 镜像缺少 apt/sudo 权限 | 改为 `npx playwright install chromium`，并确认镜像已含 Chromium 运行所需系统库；或在镜像中预装依赖 |

### Step 8：绑定后续自动化（可选）

- 若页面提供「**代码源 → 触发设置**」：确认已勾选 **推送触发** 与 **PR 触发**，分支范围与 `.workflow/ci.yml` 的 `triggers` 一致
- 「**通知**」：可开启流水线结果通知（邮件/Webhook），对应总计划的"失败通知"目标（见 `plans/测试工程/01_CI缺口补全计划_2026-09-14.md` §8.1.3）
- 「**权限/成员**」：确认仅有需要的成员可编辑流水线

### 2.1 与既有定义的等价关系（命令完全一致，不能各写各的）

| 目标 | 本地命令 | GitHub Actions | Gitee Go（`.workflow/ci.yml`） |
|------|----------|----------------|-------------------------------|
| 类型检查 | `npm run typecheck` | `ci.yml` build job | `gates` 阶段 `verify` 步骤 |
| 代码规范 | `npm run lint:strict` | 同上 | 同上 |
| 单测+覆盖率 | `npm run test:ci` | 同上 | 同上 |
| 生产构建 | `npm run build` | 同上 | `build-and-e2e` 阶段 `build` 步骤 |
| E2E | `npx playwright test` | `ci.yml` e2e job | `build-and-e2e` 阶段 `e2e` 步骤 |

> 约定：**命令集只允许在 `package.json` 里定义一次**，三套编排（本地 / GitHub / Gitee）都只做"调用"。新增门禁时先加 `package.json` 脚本，再同步三处。

---

## 三、开通前提与限制（务必先确认）

| 项 | 说明 | 若不满足怎么办 |
|----|------|----------------|
| 流水线功能是否可开通 | Gitee 帮助中心设有「**无法开通流水线怎么办？**」条目，说明该能力对账号/仓库类型有前置条件（如企业版、或开源仓库需申请） | 先按帮助中心指引申请；仍不可用则回退 **方案 A（GitHub 镜像跑 Actions）** 或 **方案 C（仅本地门禁 + Gitee 备份）** |
| 构建时长/并发额度 | 个人版/开源仓库可能存在时长或并发限制 | 失败或排队过久时，把 E2E 阶段改为手动触发（去掉 `e2e` 步骤的自动触发分支，只保留门禁阶段） |
| 执行镜像是否自带 Node 20 | `.workflow/ci.yml` 的第一步会打印 `node -v` 便于判断 | 镜像未自带时：用流水线页面的 **Node 步骤**替换 `install` 步骤，或在流水线设置里指定带 Node 20 的镜像 |
| E2E 需要 Chromium | 步骤内已含 `npx playwright install --with-deps chromium`（需要 apt/sudo） | 无 apt 权限时改为 `npx playwright install chromium`，并在镜像中预装依赖；或先在远端只跑门禁阶段，E2E 保持本地执行 |

---

## 四、首次启用的核对清单

- [ ] `.workflow/ci.yml` 已被推送到远端（本文件由本次提交引入）—— 已确认：`feat/exe-package-ready` / `test/ci-green` 上存在；`master` 上**尚未**存在
- [ ] **代码源分支选择正确**：走路径 A 选 `feat/exe-package-ready`；走路径 B 先把该文件带入 `master` 再选 `master`（否则页面下拉里找不到流水线文件）
- [ ] 流水线页面以 **YAML 模式** 创建（非可视化模式），并选中该文件
- [ ] 页面语法校验无报错（若报字段名错误，按页面模板调整顶部结构 —— 步骤内命令不需要改）
- [ ] 首次运行的 `环境自检` 步骤输出 `v20.x`（否则按第三节处理 Node 版本）
- [ ] `gates` 阶段输出 `Test Suites: 25 passed`、`Tests: 213 passed`、`All files 20.5 ...`
- [ ] `build-and-e2e` 阶段输出 `Compiled successfully`、`7 passed`
- [ ] 流水线触发条件符合预期：`master` / `feat/**` / `test/**` 的 push 与面向 `master` 的 PR
- [ ] **数据隔离自检**：远端流水线跑完后，仓库内 `MdToHtml/input/`、`MdToHtml/.trash/`、`MdToHtml/config.json` 无新增 diff（E2E 写入的是 `.e2e-tmp/`，且该目录已被 `.gitignore` 忽略）

---

## 五、本方案的已知不确定点（如实声明）

| 项 | 状态 |
|----|------|
| `.workflow/ci.yml` 顶部结构（`name` / `displayName` / `triggers` / `variables` / `stages[].stage.steps[].step`） | 按 Gitee Go 的 Azure-Pipelines 风格 DSL 编写，**尚未在真实流水线中验证**；原因是 2026-09-14 在本环境访问 Gitee 帮助中心的流水线语法文档全部返回 404，无法比对权威语法 |
| 已做的校验 | ① 用 js-yaml 解析通过（`name=ci`、2 个阶段、`gates` 3 步 / `build-and-e2e` 4 步、`triggers` 与 `variables` 结构正确）；② 步骤内命令与本地实测命令逐条一致；—— 这两点保证的是"文件不是坏 YAML、命令是对的"，**不等于"Gitee 一定接受该 DSL"** |
| 规避手段 | 文件中**只使用最通用的 `shell@1` 步骤**（不依赖版本相关的内置步骤名），因此即便顶部字段名需要微调，**步骤内的命令与业务逻辑无需改动** |
| 建议动作 | 首次在页面 YAML 模式保存时如报错，请把报错信息贴回，即可按模板一次性校正 |

> **不要**为了让流水线"看起来绿"而删除门禁步骤或加 `continue-on-error` —— 这与 `plans/测试工程/00_CI全绿计划书_2026-09-14.md` §8.1 的既定原则（E2E 为硬门禁）冲突。

---

## 六、失败排查

常规排查见 `SOP_测试与CI门禁规范.md` §6（Jest 失败 / Playwright 失败 / Windows 本地特有的三类）。Gitee 特有补充：

| 现象 | 处置 |
|------|------|
| 流水线根本没触发 | ① 是否为纯文档提交（Gitee 侧若沿用 `paths-ignore` 思路，`.md` 变更不触发；本文件的 `triggers` 未做 paths 过滤，全部触发）② 分支是否在 `include` 列表内 ③ 流水线是否被停用 |
| 卡在 `npm ci` | 确认 `MdToHtml/package-lock.json` 与 `package.json` 同步（本地 `npm ci` 先自测） |
| `node: command not found` | 镜像无 Node → 按第三节处理 |
| `playwright install` 失败 | 无 apt/sudo → 改为 `npx playwright install chromium` 并预装依赖 |
| E2E 随机失败 | 确认未改动 `playwright.config.ts` 的 `retries`/`workers`（CI 环境 `workers: 1`、`retries: 2`）；先看 `test-results/` 证据再改断言 |

---

## 七、若流水线无法开通：回退方案

| 方案 | 操作要点 | 代价 |
|------|----------|------|
| **A（GitHub 镜像）** | 在 GitHub 新建同名仓库 → `git remote add github <url>` → 推 `master` → 现有 `ci.yml` / `pr-check.yml` 零改造生效 | 代码存在两处远端 |
| **C（仅本地门禁）** | 保持 `npm run verify` + `npx playwright test` 为提交前置动作；可再配 `.git/hooks/pre-push` 自动执行 | 拿不到"远端全绿"这一可展示证据 |

---

> **变更记录**
> | 日期 | 变更 |
> |------|------|
> | 2026-09-14 | 首次建立：方案 B 落地文件 `.workflow/ci.yml` + 启用步骤 + 前提与不确定点声明 |
> | 2026-09-14 | §二 扩充为逐步操作（Step 0–8）：补"从哪个分支读 YAML"的前置判断（`master` 上尚无该文件）、页面点击路径、预期日志、首次运行的 3 类问题处置 |
