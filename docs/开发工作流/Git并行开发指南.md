# Git 并行开发工作流指南

本文档总结了基于 `MdToHtml` 项目实践的高效 Git 并行开发工作流。旨在帮助新项目快速建立规范的版本管理和协作流程。

## 0. 快速理解：Git 游戏化 (Git as a Game)

如果你觉得 Git 命令晦涩难懂，不妨把它想象成游戏存档：

*   **Git 仓库** = 你的游戏存档文件夹
*   **Commit (提交)** = **存档点 (Save Point)**。每完成一个小任务（打完一个小怪），就存个档。
*   **Branch (分支)** = **开启一条支线任务 (Side Quest)**。你想尝试一种新的打法（开发新功能），又不想影响主线剧情（现有代码），就开个分支。
*   **Merge (合并)** = **任务结算**。支线任务完美通关，把获得的经验和装备（代码）带回主线。
*   **Master/Main** = **通关存档**。永远保持可玩、无 Bug 的状态。

---

## 1. 核心原则 (Core Principles)

*   **分支隔离 (Branch Isolation)**: 所有新功能开发、Bug 修复必须在独立分支进行，严禁直接在 `master` 或 `main` 分支提交代码。
*   **原子提交 (Atomic Commits)**: 每个提交应只包含一个逻辑变更，且必须能通过编译和测试。
*   **Pull Request (PR) 审查**: 代码合并回主分支前，必须经过代码审查（Code Review）或自动化测试验证。
*   **版本语义化**: 遵循 Semantic Versioning (SemVer) 规范管理版本号。

## 2. 分支策略 (Branching Strategy)

推荐采用简化版的 **Git Flow** 或 **GitHub Flow**：

*   `master` / `main`: **主分支**。永远保持可部署状态。仅接受来自 Feature 分支或 Hotfix 分支的合并。
*   `feature/*`: **功能分支**。用于开发新功能。
    *   命名规范: `feature/功能名称` (例如: `feature/user-login`, `feature/markdown-parser`)
    *   来源: `master`
    *   去向: 合并回 `master` 后删除
*   `fix/*` 或 `hotfix/*`: **修复分支**。用于修复 Bug。
    *   命名规范: `fix/bug-description` (例如: `fix/header-rendering-error`)

## 3. 标准开发流程 (Standard Workflow)

### 阶段一：准备与分支创建
1.  **同步主分支**: 确保本地主分支是最新的。
    ```bash
    git checkout master
    git pull origin master
    ```
2.  **创建功能分支**:
    ```bash
    git checkout -b feature/your-feature-name
    ```

### 阶段二：开发与提交
1.  **开发**: 在 `feature` 分支上进行编码、测试。
2.  **提交**: 使用清晰的提交信息。
    ```bash
    git add .
    git commit -m "feat: 添加 Markdown 表格解析功能"
    ```
    *   **Commit Message 规范**: `<type>: <subject>`
        *   `feat`: 新功能
        *   `fix`: 修复 Bug
        *   `docs`: 文档变更
        *   `style`: 代码格式调整（不影响逻辑）
        *   `refactor`: 代码重构
        *   `test`: 测试用例变更
        *   `chore`: 构建过程或辅助工具变更

### 阶段三：合并与发布
1.  **自测与验证**: 确保所有测试通过，无未提交的更改。
2.  **合并回主分支**:
    推荐使用 `--no-ff` (No Fast Forward) 模式，强制生成合并节点，保留分支历史轨迹。
    ```bash
    # 1. 切换回主分支
    git checkout master
    
    # 2. 拉取最新远程代码（防止冲突）
    git pull origin master
    
    # 3. 执行不快进合并
    git merge --no-ff feature/your-feature-name -m "merge: integrate feature <name>"
    
    # 4. 推送更改
    git push origin master
    ```
3.  **清理分支**:
    ```bash
    git branch -d feature/your-feature-name
    ```

## 4. 最佳实践 (Best Practices)

### .gitignore 配置
所有项目根目录必须包含 `.gitignore` 文件，排除系统文件、IDE 配置、依赖包和构建产物。
*   **推荐排除**:
    *   `node_modules/` (Node.js)
    *   `__pycache__/`, `*.pyc`, `venv/` (Python)
    *   `.DS_Store` (macOS)
    *   `.vscode/`, `.idea/` (IDE 配置)
    *   `dist/`, `build/` (构建产物)
    *   `.env` (环境变量，包含敏感信息)
    *   **.next/**, **output/** (Next.js 等框架的缓存目录)

### 冲突解决
当合并发生冲突时：
1.  不要惊慌。Git 会标记冲突文件。
2.  打开冲突文件，搜索 `<<<<<<<`。
3.  手动决定保留哪个版本的代码，或合并两者。
4.  保存文件，执行 `git add <file>`。
5.  执行 `git commit` 完成合并。

## 5. 故障修复与实战复盘 (Troubleshooting)

### 5.1 幽灵提交与历史断裂 (Ghost Commits & Unrelated Histories)
*   **现象**: `git commit` 提示成功但无记录，或合并时报错 `refusing to merge unrelated histories`。
*   **原因**:
    1.  **缓存过大**: 未忽略大量构建文件（如 `.next/`, `output/`），导致 Git 索引阻塞或操作超时。
    2.  **孤儿分支**: 在没有初始提交的分支上操作，导致两条完全独立的历史线。
*   **解决方案 (Soft Reset 嫁接法)**:
    ```bash
    # 1. 切换到包含最新代码的分支
    git checkout feat/cleanup 
    
    # 2. 【关键一步】将当前分支的"指针"重置到 master，但保留工作区和暂存区的所有新文件 
    git reset --soft master 
    
    # 3. 提交更改 (现在这个提交就有了正确的父节点 master) 
    git commit -m "feat: integrate ai support and cleanup" 
    
    # 4. 切换回 master 并进行快进合并
    git checkout master 
    git merge feat/cleanup 
    
    # 5. 删除临时分支
    git branch -d feat/cleanup
    ```

### 5.2 进程锁定导致的文件操作失败
*   **现象**: 切换分支或删除文件时报错 `Deletion of directory failed`。
*   **原因**: `python -m http.server` 或其他预览服务在后台占用了文件句柄。
*   **解决方案**:
    *   操作前务必关闭所有运行中的服务（Web Server, Watcher）。
    *   使用任务管理器或 `Stop-Process` 结束占用进程。

### 5.3 缓存污染与 .gitignore 失效
*   **现象**: 修改了 `.gitignore` 但 `__pycache__` 或 `.next` 文件夹依然出现在 `git status` 中。
*   **原因**: 这些文件已经被 Git 追踪，`.gitignore` 仅对未追踪文件有效。
*   **解决方案 (清空缓存重构索引)**:
    ```bash
    # 1. 移除所有文件的索引（不删除本地文件），让 Git 重新扫描
    git rm -r --cached .

    # 2. 重新添加所有文件（此时 .gitignore 会生效）
    git add .
    
    # 3. 提交变更
    git commit -m "chore: refresh gitignore rules and clear cache"
    ```

## 6. 大规模重构策略 (Advanced)

针对涉及大量网页内容重写、UI 换肤或核心引擎升级的场景，为避免“合并地狱” (Merge Hell)，建议遵循以下策略。

### 6.1 增量替换 (Strangler Fig Pattern)
*   **做法**: 不直接修改旧文件（如 `OldComponent.tsx`），而是新建 `NewComponent.tsx`。
*   **流程**: 逐步在页面中替换引用 -> 确认旧文件无引用 -> 删除旧文件。
*   **优势**: 极大降低 Git 冲突概率，因为本质上是“新增文件”而非“修改文件”。

### 6.2 文件锁定 (File Locking)
*   **做法**: 团队协作时，明确通知“今天我要重写 UserPage，请大家暂时别动”。

## 7. 常用命令速查

| 场景 | 命令 | 说明 |
| :--- | :--- | :--- |
| **初始化** | `git init` | 开新局 |
| **查看状态** | `git status` | 红色=未暂存，绿色=已暂存 |
| **查看日志** | `git log --oneline --graph` | 查看通关记录 |
| **暂存更改** | `git add .` | 放入背包 |
| **暂存现场** | `git stash` | 临时保存当前进度去处理别的事 |
| **恢复现场** | `git stash pop` | 恢复之前的进度 |
| **撤销修改** | `git checkout -- <file>` | 放弃未提交的修改（慎用） |
| **后悔药** | `git reset --soft HEAD^` | 撤销最近一次 commit 但保留代码 |
| **强行删除** | `git branch -D <branch>` | 仅当不需要该分支代码时使用 |

---
*本文档由 MdToHtml 开发团队整理，适用于所有基于 Git 的协作项目。*
