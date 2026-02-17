# Git 工作流与故障修复手册

## 1. 分支合并与历史修复 (Unrelated Histories)

### 场景描述
当尝试合并两个历史不相关的分支（例如：在无父节点的孤儿分支上开发后尝试合并回主分支）时，Git 会报错 `refusing to merge unrelated histories`。

### 解决方案：Soft Reset 嫁接法
此方法通过将当前分支的更改“嫁接”到主分支的最新提交上，避免了复杂的冲突解决，并保持了线性的提交历史。

#### 核心步骤
1.  **切换分支**: 切换到包含最新代码（待合并）的分支。
    ```bash
    git checkout <feature-branch>
    ```
2.  **重置指针 (Soft Reset)**: 将分支指针重置到目标分支（通常是 master），但**保留**工作区和暂存区的所有更改。
    ```bash
    git reset --soft master
    ```
    *原理*: 这告诉 Git "把这些文件当作是基于 master 最新版修改的"，从而欺骗 Git 忽略之前的断裂历史。
3.  **提交更改**: 生成一个新的提交，此时它的父节点已经是 master。
    ```bash
    git commit -m "feat: integrate feature <name>"
    ```
4.  **快进合并**: 切换回主分支并合并。
    ```bash
    git checkout master
    git merge <feature-branch>
    ```
5.  **清理分支**: 删除临时分支。
    ```bash
    git branch -d <feature-branch>
    ```

## 2. 复杂合并与故障复盘 (2026-02-17)

### 问题现象
1.  **文件占用**: 切换分支时报错 `Deletion of directory failed`。
2.  **幽灵提交**: 提交成功但分支无记录，或者分支看似空。
3.  **拒绝合并**: `refusing to merge unrelated histories`。
4.  **版本混淆**: 系统因大文件差异误判为不同版本内容。

### 原因分析
1.  **进程锁定**: `python -m http.server` 等预览服务在后台运行，占用了目录文件句柄，导致 Git 无法执行删除/重命名操作。
2.  **孤儿分支**: 使用 `git checkout --orphan` 或非标准方式创建的分支，拥有独立的提交历史根节点，导致 Git 无法找到共同祖先。
3.  **缓存污染**: `.gitignore` 配置滞后，导致 `__pycache__`、`.next` 及大型文档 (`.zip`, `.rar`) 被误纳入版本控制，造成仓库体积膨胀和合并冲突。

### 最佳实践 (SOP)
1.  **操作前检查**: 
    - 执行 Git 操作前，**必须停止**所有预览服务和占用文件的进程。
    - 使用 `git status` 确认工作区状态。
2.  **配置文件先行**: 
    - 在引入新文件类型或目录前，**优先更新 `.gitignore`**。
    - 这里的规则必须覆盖所有生成的二进制、缓存及非代码的大型资源。
3.  **规范分支创建**:
    - 基于当前主分支创建：`git checkout master && git pull && git checkout -b feature/xxx`。
    - 避免使用 `--orphan` 除非明确知道自己在做什么。
4.  **定期清理**:
    - 若发现误提交了大文件，使用 `git rm --cached <file>` 移除跟踪但保留本地文件。

## 3. 常用开发流程
（此处可扩展其他 Git 最佳实践）
