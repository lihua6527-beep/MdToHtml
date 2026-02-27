---
name: "git-windows-move-merge"
description: "处理 Windows 下 Git 中文路径/多层目录/文档迁移与分支合并的常见坑与标准流程。遇到文件移动很乱、git mv 报 not under version control、路径乱码、合并前清理未跟踪文件时调用。"
---

# Git Windows 文件迁移与合并（避坑流程）

本 Skill 解决一类高频“看似简单但过程很复杂”的问题：在 Windows 环境中把文件从 A 目录移动到 B 目录，同时要保证 Git 能正确追踪移动、提交干净、并最终合并到 master。

## 为什么会变复杂（根因清单）

### 1) 仓库根目录与子项目目录混用
- 现象：你以为自己在项目根目录，实际在 `MdToHtml/` 子目录；命令相对路径全错，导致移动目标跑偏、或者 git 命令看不到你想操作的文件。
- 解决：任何文件移动/提交/合并前，先确认 Git 根目录：
  - `git rev-parse --show-toplevel`
  - 后续所有 Git 操作在根目录执行（必要时显式设置工作目录）。

### 2) `git mv` 只能移动“已被 Git 跟踪”的文件
- 现象：`fatal: not under version control`。
- 原因：源文件是未跟踪文件（untracked），或目标路径在仓库外。
- 解决策略：
  - **已跟踪文件**：优先使用 `git mv source dest`（保留 rename 历史）。
  - **未跟踪文件**：先用系统移动（资源管理器/PowerShell Move-Item）把文件放到正确位置，再 `git add <new-path>`。

### 3) 中文路径导致输出乱码/转义，难以核对
- 现象：`git status`/`git diff` 显示一堆 `\345\274\200...`。
- 解决：临时关闭转义显示，便于核对：
  - `git -c core.quotepath=false status -sb`
  - `git -c core.quotepath=false diff --name-only`

### 4) “工具包装器”与 PowerShell 引号冲突
- 现象：执行多行脚本时出现莫名参数解析错误（例如 `unexpected argument ...`），或者 `$ErrorActionPreference` 被当成命令。
- 解决：
  - 尽量避免把**复杂多行 PowerShell**塞进单行字符串。
  - 优先使用 Git 原生命令完成“可追踪的移动/重命名”（`git mv`）。
  - 需要 PowerShell 时，用最短命令、严格双引号包裹路径：
    - `Move-Item -LiteralPath "C:\a\b" -Destination "C:\c\d"`

### 5) “两个 docs 目录”并存造成认知混乱
- 现象：`MdToHtml/docs` 与 `<repo-root>/docs` 同时存在，内容迁移后很难确认哪里才是“正确版本”。
- 解决：先明确单一事实源（Source of Truth），然后做一次性迁移：
  - 目标确定后：把另一个目录清空/移除，避免后续继续写错位置。

## 标准闭环流程（推荐操作顺序）

### Step 0：确认根目录 + 当前分支
1. `git rev-parse --show-toplevel`
2. `git -c core.quotepath=false status -sb`

### Step 1：分类“要移动的文件”
把每个文件分成两类：
- **Tracked**：`git ls-files -- <path>` 有输出
- **Untracked**：`git status` 里是 `??`

### Step 2：执行迁移
- Tracked：用 `git mv`
- Untracked：用系统移动（或直接在目标目录创建/保存），然后 `git add`

### Step 3：清理“非项目产物”的未跟踪文件
典型需要忽略的内容：
- 工具生成缓存：`**/.metadata_cache.json`
- IDE/助手目录：`.trae/`

做法：
1. 在 `.gitignore` 写入忽略规则
2. 若之前误提交过，需 `git rm -r --cached <path>`（仅当已被跟踪时）

### Step 4：验证（合并前必须做）
- `npx tsc --noEmit`
- `npm run lint`（允许存在历史告警，但要确认不是本次引入的）

### Step 5：提交与合并
1. `git add -A`
2. `git commit -m "<清晰的提交信息>"`
3. `git checkout master`
4. `git merge <feature-branch>`（优先 fast-forward；否则解决冲突）
5. `git -c core.quotepath=false status -sb` 确保工作区干净

## 快速排障清单（看到这些就按对应方案）
- `fatal: not under version control` -> 源文件未跟踪，改为系统移动 + `git add`
- 路径全是 `\345\274...` -> 用 `-c core.quotepath=false`
- 移动后文件“消失” -> 你可能在子目录执行命令，先 `git rev-parse --show-toplevel`
- 合并后工作区还有一堆 `??` -> 先判断“该提交还是该忽略”，不要带着脏工作区继续开发
