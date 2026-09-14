# GitHub 流水线配置指南（Actions：CI + 发布）

> **建立日期**：2026-09-14
> **背景**：仓库已迁移到 GitHub —— `origin = git@github.com:lihua6527-beep/MdToHtml.git`，默认分支 `main`（由本地 `master` 推送而来，本地主线仍叫 `master`）。此前 `.github/workflows/*.yml` 虽已写好，但触发条件是 `branches: [master]` —— **GitHub 上没有该分支，Actions 从未运行过**（远端还在 Gitee 时这些文件更不会被执行）。
> **配套**：`docs/开发工作流/SOP_测试与CI门禁规范.md`（门禁与排查）、`plans/测试工程/01_CI缺口补全计划_2026-09-14.md` §6.2（`release.yml` 设计稿）、`docs/开发工作流/Gitee流水线配置指南.md`（旧平台，保留备查）

---

## 一、三条流水线一览

| 文件 | `name` | 触发 | 内容 | 典型耗时 |
|------|--------|------|------|:--------:|
| `.github/workflows/ci.yml` | CI Pipeline | push 到 `main` / `master`（纯文档改动除外）、手动 | `build` job：typecheck → lint → test:ci → 覆盖率看板 → build；`e2e` job：装 Chromium → `npm run test:e2e`（**硬门禁**） | 6–10 min |
| `.github/workflows/pr-check.yml` | PR Check | 目标分支为 `main` / `master` 的 PR、手动 | typecheck → lint → test:ci → 覆盖率看板 → 上传 `coverage/` | 3–6 min |
| `.github/workflows/release.yml` | Release | 推送 `v*` tag、手动 | Windows runner：`npm ci` → `verify` → `next build` → `electron-builder --win portable` → 上传 exe artifact → 创建 GitHub Release | 8–15 min |

三者都开启了 `workflow_dispatch`：Actions 页面点 **Run workflow** 即可手动跑，并可指定任意分支。

---

## 二、分支约定（最容易踩的坑）

- GitHub 默认分支 = `main`；本地主线 = `master`；两者当前指向同一提交。
- 两个门禁 workflow **同时监听 `main` 与 `master`**：无论从哪一侧推，都不会再出现"推了但 CI 不跑"。
- `paths-ignore: docs/**, **.md` → 纯文档提交不触发门禁（省额度、省等待）。**"改 docs 不跑 CI" 是预期行为，不是漏触发。**

---

## 三、CI 门禁与本地命令的等价关系

| CI 步骤 | 本地等价命令 | 说明 |
|---------|--------------|------|
| Type Check | `npm run typecheck` | 0 错误 |
| Lint | `npm run lint:strict` | `--max-warnings 0` |
| Unit Tests | `npm run test:ci` | 含 `coverageThreshold` 覆盖率门槛 |
| Publish Coverage Summary | `node scripts/coverage-summary.js` | 本地只打印；CI 下写入运行摘要 |
| Build | `npm run build` | 生产构建 |
| E2E Tests | `npx playwright test` | 数据隔离到 `.e2e-tmp/` |

等价命令的"一把梭"版本是 `npm run verify`（前三条），也是 `.githooks/pre-push` 的内容。

---

## 四、落地时的实测验证（2026-09-14）

为避免"写完就推、红了再猜"，本次用**干净检出**逐条复现了 CI 行为：

| # | 验证项 | 方法 | 结果 |
|:-:|--------|------|------|
| 0 | workflow 结构与语义 | 用 `js-yaml` 解析 3 个文件，断言 `on` / `jobs` / `runs-on` / `steps` / `uses` 版本固定等 | ✅ 全部通过 |
| 0 | 干净检出 | `git clone` 本地仓库到临时目录（**只有被跟踪文件**：无 `.env.local`、无 `input/`、无 `data/`、无 `.next`），`node_modules` 用 junction 复用 | ✅ 与 CI checkout 等价 |
| 1 | 门禁 | 干净检出中 `npm run verify` | ✅ 25 套件 / 213 用例 |
| 2 | 构建 | 干净检出中 `npm run build` | ✅ `Compiled successfully` |
| 3 | E2E | 干净检出中 `CI=true npx playwright test`（= GitHub 的 `workers=1`、`retries=2`） | ✅ **7/7（28.1s）** |
| 4 | 覆盖率看板 | `node scripts/coverage-summary.js`（本地模式 + 带 `GITHUB_STEP_SUMMARY` 模式） | ✅ 20.5 / 15.82 / 14.03 / 21.25 |
| 5 | **GitHub 真实运行** | push 到 `main` 后查 Actions API：run #1（2026-09-14 21:54:31 – 21:58:02） | ✅ **`completed / success`**，`Build & Test` 9 步全 success、`E2E Tests` success，总耗时 3 分 31 秒 |

> run #1 地址：`https://github.com/lihua6527-beep/MdToHtml/actions/runs/34852173860`
> 该轮还暴露了一个只在真实运行中可见的问题：`Upload Build Artifact` 步骤 success，但 artifacts 里**没有** `next-build` —— 原因是 `upload-artifact@v4` 默认跳过隐藏目录（`.next`）。已修（`include-hidden-files: true`），见 §九排错表。
> 尚未被真实触发过的两条：`pr-check.yml`（需要 PR）、`release.yml`（需要 `v*` tag 或手动运行）。

---

## 五、这次修掉的"CI 必红"隐患

### 5.1 `.gitignore` 裸写 `data/` 把源码一起屏蔽了（已修，必看）

现象：干净检出后 `npm run typecheck` 直接报

```
src/components/Editor/MarkdownEditor.tsx(18,50): error TS2307:
Cannot find module '@/data/editor-defaults' or its corresponding type declarations.
```

根因：根 `.gitignore` 写的是裸 `data/`。**裸模式匹配任意层级**的同名目录，于是源码目录 `MdToHtml/src/data/` 被一并屏蔽 —— `editor-defaults.ts`（8.7 KB，被 `MarkdownEditor.tsx` 引用）**从未入库**，只存在于作者本机。同类受害者还有 `MdToHtml/portable_ml_package/data/`（Python 源码，当初靠 `git add -f` 才入库）。

修法：裸 `data/` 改成显式路径 `MdToHtml/data/`（用户文档库仍被忽略），并把 `src/data/editor-defaults.ts` 正式入库。

> **教训**：`.gitignore` 里**不要写裸目录名**（`data/`、`build/`、`out/`、`temp/`…），除非确认全仓库没有同名源码目录。"本地一直能跑" ≠ "CI 能跑"，只有干净检出能暴露漏入库。

### 5.2 本地 E2E 多 worker 并行会互相干扰（已记录，暂未改行为）

`playwright.config.ts` 中 `workers: process.env.CI ? 1 : undefined`：本地按 CPU 开多 worker，而 `fullyParallel: false` **只禁止同一文件内并行**，不同 spec 文件仍并行。多个 spec 同时读写同一份隔离目录 `.e2e-tmp/` 时，"导入本地文件 → 出现在文档列表"会偶发失败（本次以 3 worker 复现：6 passed / 1 failed；改 `CI=true`（1 worker）后 **7/7 通过**）。

- GitHub 上 `CI=true` → 1 worker + 2 次重试，**远端不受影响**。
- 想让本地也稳定：跑 E2E 前临时 `set CI=true`，或把 `workers` 固定为 1（属行为变更，需单独决策）。

---

## 六、CI 环境的三处专门处理（为什么）

| 处理 | 值 | 理由 |
|------|----|------|
| Electron 二进制 | `ELECTRON_SKIP_BINARY_DOWNLOAD: '1'`（仅 `ci.yml` / `pr-check.yml`） | 门禁只需 next build / jest / playwright；跳过可少下载约 90 MB，也避免 electron 镜像不可达拖垮门禁。`release.yml` **不设**（打包必需） |
| Next 遥测 | `NEXT_TELEMETRY_DISABLED: '1'` | 减少无关网络请求与日志噪声 |
| Playwright webServer 超时 | `process.env.CI ? 120000 : 30000` | 2 核 runner 首次 `next dev` 编译明显慢于本机，30s 会以与代码无关的原因超时 |

依赖走 `MdToHtml/.npmrc` 固定的 `registry.npmmirror.com`，`package-lock.json` 中 1427 条 `resolved` 也全部指向该镜像，故 CI 与本地 `npm ci` 结果一致。

---

## 七、发布：一次打 tag 产出便携 exe

```bash
cd MdToHtml
npm version patch                            # 抬版本号（唯一来源 = package.json 的 version）+ 自动 commit + 打 tag
git push origin master:main --follow-tags    # 按你的分支策略推送（tag 推送即触发 release.yml）
```

推送 `v*` tag 后自动：`npm ci` → `npm run verify`（防红灯打版）→ `next build` → `electron-builder --win portable` → 上传 `portable-exe` artifact → **创建 GitHub Release 并挂载 exe**（Release Notes 自动生成）。

手动运行（`workflow_dispatch`）只打包并上传 artifact，**不会**创建 Release（没有 tag 可挂）。

---

## 八、怎么看结果

| 入口 | 地址 |
|------|------|
| Actions 列表 | `https://github.com/lihua6527-beep/MdToHtml/actions` |
| CI 徽章 | `https://github.com/lihua6527-beep/MdToHtml/actions/workflows/ci.yml/badge.svg?branch=main`（已加到 README 顶部） |
| 失败证据 | 每次运行的 **Artifacts**：`playwright-report`、`e2e-failure-screenshots`、`next-build`、`coverage-report` |
| 覆盖率 | 每次运行的 **Summary** 页（`Publish Coverage Summary` 步骤写入，无需 Codecov 账号） |

---

## 九、排错速查

| 症状 | 常见原因 | 处理 |
|------|----------|------|
| `TS2307: Cannot find module '@/...'` | 源码文件被 `.gitignore` 屏蔽 / 忘记入库 | `git check-ignore -v <文件>` 定位；`git ls-files --others --ignored --exclude-standard` 列出被忽略文件 |
| 推送后 Actions 完全不跑 | 触发分支不匹配，或属于 `paths-ignore`（纯文档） | 确认分支名；改源码文件后重推；或手动 Run workflow |
| `npm ci` 失败 | lock 与 package.json 不一致 | 本地 `npm install` 后提交更新后的 `package-lock.json` |
| e2e 超时等 webServer | runner 首次编译慢 | 已放宽到 120s（CI）；仍超时看 `playwright-report` |
| Release 步骤报错 | 手动运行没有 tag | 手动运行只出 artifact；要建 Release 必须推 `v*` tag |
| 覆盖率看板缺失 | `coverageReporters` 丢了 `json-summary` | 恢复 `jest.config.js` 的 `coverageReporters: ['text','json-summary','lcov']` |
| 步骤 success 但 artifacts 里没有该产物 | `upload-artifact@v4` 默认**跳过隐藏文件/目录**（如 `.next/`） | 该步骤加 `include-hidden-files: true`（本轮已修 `next-build`） |

---

## 十、与 Gitee 流水线的关系

`.workflow/ci.yml` 是 **Gitee Go** 的定义，只在 Gitee 生效；GitHub 只读 `.github/workflows/`，两者互不影响。迁移后 GitHub 为唯一推送目标（`origin`），Gitee 地址保留为备份远端（`gitee`，可随时 `git remote remove gitee`）。若不再使用 Gitee 流水线，可删除 `.workflow/ci.yml` 与《Gitee流水线配置指南》，但**不要**动 `.github/workflows/` —— 那才是现在真正跑的那套。
