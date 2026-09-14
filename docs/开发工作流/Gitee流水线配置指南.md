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

### Step 0（前置）：当前真实的仓库/分支状态

流水线归属的分支决定它读哪个文件。2026-09-14 现场状态：

| 分支 | `.workflow/` 下的文件 | 说明 |
|------|----------------------|------|
| `master` | `流水线-202609142049.yml`（你创建，**已由我填入完整定义**） | **Gitee 上那条流水线实际使用的文件** |
| `master` | ~~`ci.yml`~~ 不存在 → 合并后已补齐 ✅ | 规范化命名的备用文件 |
| `feat/exe-package-ready` / `test/ci-green` | `ci.yml`（规范命名版） | 本次开发成果所在分支 |

**关键结论**：你已经在 `master` 上建好了流水线，所以**不需要再"导入文件"**——只需让 master 上的文件内容正确 + master 的代码是最新的。这两点我都已处理：

- `master` 上的 `流水线-202609142049.yml` 已填入完整流水线定义（2 阶段 + 7 步骤）
- `master` 已合并本次全部成果（现代码 + 测试体系），因此流水线跑的就是**最新代码**

> 如果当初你选的是别的分支，把上面两处对照到对应分支即可（文件必须在该分支上）。

### Step 1：进入仓库的流水线页面（入口已确认）

1. 浏览器打开 `https://gitee.com/njustzjh/md-to-html`
2. 顶部导航栏依次是：`代码 · Issues · Pull Requests · Wiki · 统计 · **流水线** · 服务 …`
   → 点 **「流水线」**（4 个字，夹在「统计」和「服务」之间）
3. 也可以直接访问：`https://gitee.com/njustzjh/md-to-html/gitee_go`（会要求先登录 Gitee）

> 若导航里没有「流水线」：说明该仓库未开通流水线能力 → 见第七节（回退方案 A/C）。

### Step 2：Gitee 的真实创建流程（与我最初的描述不同，以本节为准）

⚠️ **Gitee 没有"导入/选择仓库里已有 YAML 文件"这个选项。** 平台的设计是：

```
新建流水线 → 你给流水线起名 → Gitee 自动在 .workflow/ 下创建【同名】YAML 文件
                              ↓
                         你再往这个文件里填内容
```

**实锤证据（你刚才的操作，2026-09-14 20:49）**：

| 事实 | 值 |
|------|-----|
| 你在 `master` 上创建了流水线 | 提交 `f9f088f create 流水线-202609142049.yml` |
| Gitee 自动生成的文件 | `.workflow/流水线-202609142049.yml`（**文件名 = 流水线名**） |
| 文件初始内容（官方模板，8 行） | 见下方代码块 |

```yaml
version: "1.0"
name: 流水线-202609142049
displayName: 流水线-202609142049
triggers:
  push:
    branches:
      prefix:
        - ''
```

> 这个模板是本次最有价值的发现：它确认了 ① `version: "1.0"` 是**必填项**；② 分支过滤用 `branches.prefix`（**前缀匹配**，不是 `include`）。我们原有的 `.workflow/ci.yml` 已据此校正。

### Step 3：你要做的只有 3 件事（内容已由我放到仓库里）

因为"往文件里填内容"这一步可以直接用 git 完成，所以不用在网页编辑器里手打：

1. **登录 Gitee**，打开 `https://gitee.com/njustzjh/md-to-html/gitee_go`
2. 在流水线列表里点开你创建的 **`流水线-202609142049`**，点 **「运行」**（若要求选分支，选 `master`）
3. 看日志：按 Step 6 的表核对；**把日志或报错原文贴回来**，我据此校正

> 我已同步的两处（提交见 `docs/开发记录/历史记录/2026-09-14_开发记录.md`）：
> - `master` 上的 **`.workflow/流水线-202609142049.yml`** ← 填入了完整流水线定义（**这条流水线真正生效的文件**）
> - **`.workflow/ci.yml`** ← 同内容的"规范命名"版本，供以后创建名为 `ci` 的流水线使用
>
> 两者内容一致，只是文件名不同（Gitee 要求文件名 = 流水线名）。

### Step 4（可选）：把流水线名规范化成 `ci`

若你希望流水线叫 `ci`（文件即 `.workflow/ci.yml`，更整洁、也便于答辩展示）：

- 方式一：在流水线设置里找 **重命名/编辑** 入口，改名 `ci`；若改名后 Gitee 仍读旧文件，改用方式二
- 方式二：新建一条流水线，名字填 **`ci`**；Gitee 会创建 `.workflow/ci.yml`，而该文件我们已备好 → 创建后直接保存即可
- 改名/新建后，可把 `流水线-202609142049` 这条删除，避免重复触发

### Step 5：手动运行一次（首次务必手动，便于看日志）

1. 在流水线详情页点击 **「运行」**（或「立即构建」）
2. 若要求选择分支/参数：分支选 **`master`**（你创建流水线时用的分支），参数留空（本流水线只用到 `variables.MDTOHTML_DIR`）
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
| ② | 保存 YAML 时报 **配置结构错误** | 已处理过一例：`位置: stages[0].steps` → 原因是 `steps` 被嵌在 `stage:` 子键里；现改为 `stages[i].steps` 扁平写法。若仍有报错，多半是 **step 条目写法**或 `stage` 层缺失 `stage:` 键（见 §五） | 按报错位置改对应层级；**步骤内要执行的命令无需改动**。把报错原文贴回即可一次性校正 |
| ③ | `playwright install --with-deps` 失败 | 镜像缺少 apt/sudo 权限 | 改为 `npx playwright install chromium`，并确认镜像已含 Chromium 运行所需系统库；或在镜像中预装依赖 |

### Step 8：绑定后续自动化（可选）

- 若页面提供「**代码源 → 触发设置**」：确认已勾选 **推送触发**，分支范围与 `.workflow/流水线-202609142049.yml`（或规范化后的 `.workflow/ci.yml`）的 `triggers` 一致
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

## 五、Gitee 流水线 schema（2026-09-14 最终确认）

> 唯一权威来源：**Gitee 流水线页面自带的模板**。下表全部结论均由「页面模板 + 页面报错」实测得出，不再是推测。

| 层级 | 结论 | 来源 |
|------|------|------|
| 文件位置 | `.workflow/<流水线名>.yml`，**文件名 = 流水线名**（不含扩展名） | 页面创建流水线时自动生成 |
| 顶层必填 | `version: "1.0"`、`name`、`displayName`、`triggers`、`stages` | 页面模板 |
| 顶层可带 | `notify: []`、`strategy: { blocking: true }` | 页面模板 |
| 触发 | `triggers.push.branches.prefix: [master, feat/, test/]`（**前缀匹配**，不是 `include`） | 页面生成的最小模板 |
| stage 写法 | **扁平**：`name` / `displayName` / `strategy: naturally` / `trigger: auto` / `steps` | 页面模板 + 报错校正 |
| step 写法 | **插件 id 形式 `<动作>@<工具>`**：`ut@maven`、`build@maven`、`publish@general_artifacts`、`publish@release_artifacts`、`deploy@agent` … 本流水线用 **`build@nodejs`** | 页面模板 + 实测 |
| step 字段 | `step` / `name` / `displayName` / `nodeVersion` / **`commands:` 列表** / `checkpoints: {}` / `settings: []` / `caches: []` / `notify: []` / `strategy(resource.cpu/memory)` | 页面模板 |
| ❌ 已验证不存在的写法 | ① `shell@1`（报 `[插件类型不存在] 不支持的插件类型: shell@1`）② `stages[i].stage.steps` 嵌套（报 `[配置结构错误] 位置: stages[0].steps`）③ `inputs: { run: ... }`（Gitee 不用这个键，命令走 `commands`） | 页面报错 |

> 因此：**改动流水线时以页面模板为准**；本仓库的 `.workflow/*.yml` 已与该 schema 对齐。

---

## 六、自检结论（2026-09-14）

| 检查项 | 方法 | 结果 |
|--------|------|------|
| 仓库状态 | `git status` / 三分支 SHA 对比 | ✅ 工作区干净；`master` = `feat/exe-package-ready` = `test/ci-green` = `b7ad2b1` |
| 流水线文件结构 | js-yaml 解析 + 结构断言（version/name/displayName/triggers/stages/steps/commands/无 `inputs`/无 `stage:` 包裹） | ✅ `流水线-202609142049.yml`、`流水线-202609142107.yml` 全部 PASS（2 阶段 / 2 步骤，均 `build@nodejs`） |
| 本地门禁 | `npm run verify` | ✅ EXITCODE=0（typecheck 0 错误 / lint 零警告 / 25 套件 / 213 用例 / 覆盖率 20.5–21.25） |
| E2E | `npx playwright test` | ✅ 7 passed（数据隔离：真实 `input/` 保持 27 篇，写入仅落 `.e2e-tmp/`） |
| 文档一致性 | 全文检索过期表述（`shell@1` / `尚无 git remote` / `待你操作` 等）并修正 | ✅ 已修正（详见 `docs/开发记录/历史记录/2026-09-14_开发记录.md` 第五批） |

> `.workflow/ci.yml` 是"规范命名"的备用副本：其 `displayName` 为描述性文字（与文件名不同），因它未与任何已创建流水线绑定，**不影响运行**；若日后新建名为 `ci` 的流水线，请把它的 `displayName` 改为 `ci` 以与平台约定一致。

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
