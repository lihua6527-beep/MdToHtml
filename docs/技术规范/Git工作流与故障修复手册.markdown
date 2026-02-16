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

## 2. 常用开发流程
（此处可扩展其他 Git 最佳实践）
