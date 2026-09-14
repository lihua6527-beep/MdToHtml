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

## 二、启用步骤（Gitee 网页操作）

1. 打开仓库 `https://gitee.com/njustzjh/md-to-html`
2. 顶部导航进入 **流水线**（部分账号显示为 **Gitee Go / 持续交付**）
3. **新建流水线** → 选择 **YAML 模式**（不要用可视化模式，否则不会读取 `.workflow/ci.yml`）
4. 选择已提交的 `.workflow/ci.yml` 作为流水线定义文件
5. 保存后：
   - 手动点一次 **运行**，观察两个阶段：`gates`（类型+Lint+单测）、`build-and-e2e`（构建+E2E）
   - 之后向 `master` / `feat/**` / `test/**` 推送，或对 `master` 发起 PR，会自动触发
6. 首次运行请逐项核对下表（**这是本方案唯一未在真实流水线验证过的部分**，见第五节）

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

- [ ] `.workflow/ci.yml` 已被推送到远端（本文件由本次提交引入）
- [ ] 流水线页面以 **YAML 模式** 创建，并选中该文件
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
