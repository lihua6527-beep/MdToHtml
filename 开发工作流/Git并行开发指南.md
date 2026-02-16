# Git 并行开发工作流指南

本文档总结了基于 `MdToHtml` 项目实践的高效 Git 并行开发工作流。旨在帮助新项目快速建立规范的版本管理和协作流程。

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
    ```bash
    # 1. 切换回主分支
    git checkout master
    
    # 2. 拉取最新远程代码（防止冲突）
    git pull origin master
    
    # 3. 合并功能分支
    git merge feature/your-feature-name
    
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

### 冲突解决
当合并发生冲突时：
1.  不要惊慌。Git 会标记冲突文件。
2.  打开冲突文件，搜索 `<<<<<<<`。
3.  手动决定保留哪个版本的代码，或合并两者。
4.  保存文件，执行 `git add <file>`。
5.  执行 `git commit` 完成合并。

## 5. 常用命令速查

| 场景 | 命令 |
| :--- | :--- |
| **查看状态** | `git status` |
| **查看日志** | `git log --oneline --graph` |
| **暂存更改** | `git stash` (临时保存工作现场) |
| **恢复暂存** | `git stash pop` |
| **撤销修改** | `git checkout -- <file>` (未暂存前) |
| **重置提交** | `git reset --soft HEAD^` (撤销最近一次 commit 但保留代码) |

---
*本文档由 MdToHtml 开发团队整理，适用于所有基于 Git 的协作项目。*
