# Git 操作总结：结构重构与文档治理

> **创建时间**: 2026-02-17
> **背景**: 本次操作旨在优化项目目录结构、清理 `.gitignore` 未生效导致的缓存文件，并对文档进行分类归档。为了保证主分支 (`master`) 的稳定性，采用了“特性分支”开发模式。

## 1. 完整操作流程回顾

### 第一步：创建并切换到临时分支
为了隔离对文件结构的修改，避免直接在 `master` 上操作出错。

```bash
# 创建并切换到名为 refactor/structure-optimization 的新分支
git checkout -b refactor/structure-optimization
```

### 第二步：优化 .gitignore 与清理缓存
这是解决“每次产生四五百个缓存文件”的关键步骤。

1. **修改 `.gitignore`**: 添加了 `data/`, `**/__pycache__/` 等规则。
2. **清理 Git 缓存**: 让 Git 重新读取 `.gitignore` 规则。

```bash
# 移除所有文件的索引（不删除本地文件），让 Git 重新扫描
git rm -r --cached .

# 重新添加所有文件（此时 .gitignore 会生效，忽略掉不需要的文件）
git add .
```

### 第三步：提交更改
将文件结构的调整（归档日志、拆分项目管理文件夹等）保存到当前分支。

```bash
# 提交更改
git commit -m "refactor: organize docs structure and archive dev logs"
```

### 第四步：合并回主分支
确认修改无误后，将临时分支的成果合并回 `master`。

```bash
# 切换回主分支
git checkout master

# 将 refactor/structure-optimization 分支合并到当前分支 (master)
git merge refactor/structure-optimization
```

### 第五步：清理临时分支
合并完成后，临时分支的使命结束，予以删除。

```bash
# 删除已合并的分支
git branch -d refactor/structure-optimization

# (如果分支未合并需要强制删除，使用 -D)
# git branch -D refactor/structure-optimization
```

---

## 2. 常用命令速查

| 场景 | 命令 | 说明 |
| :--- | :--- | :--- |
| **创建分支** | `git checkout -b <分支名>` | 创建并立即切换 |
| **查看状态** | `git status` | 查看当前修改和暂存区状态 |
| **清理缓存** | `git rm -r --cached .` | 当修改了 .gitignore 但不起作用时使用 |
| **合并分支** | `git merge <分支名>` | 将指定分支合并到当前所在分支 |
| **删除分支** | `git branch -d <分支名>` | 删除本地分支 |

## 3. 注意事项

- **PowerShell 兼容性**: 在 Windows PowerShell 中，多条命令连接建议使用 `;` 而非 `&&` (例如 `git add . ; git commit`)。
- **分支切换前**: 切换分支前最好确保当前工作区是干净的（已提交或已暂存），否则可能会导致文件冲突或丢失未保存的进度。
