---
name: "archiver"
description: "Handles project documentation archiving, development log generation, and git branch merging. Invoke when user says '归档' to archive project artifacts and complete the workflow."
---

# 项目归档工具

## 功能

此技能用于完成项目的归档工作，包括：

1. **文档归档**：将计划文档和验收文档移动到 `c:\Users\86171\Desktop\MdToHmtl\docs\归档` 目录

2. **开发日志生成**：创建独立的开发日志文件并存储到 `c:\Users\86171\Desktop\MdToHmtl\docs\开发记录\历史记录` 目录

3. **代码分支管理**：提交当前分支的更改并合并到master分支

4. **架构文档更新**：如果此次升级涉及系统架构或目标的重大变化，生成额外的文档到以下目录：
   - `c:\Users\86171\Desktop\MdToHmtl\docs\核心规划`
   - `c:\Users\86171\Desktop\MdToHmtl\docs\技术规范与前端规范`

## 使用方法

当用户说出"归档"时，调用此技能，执行以下步骤：

1. **收集文档**：识别并收集当前工作的计划文档和验收文档
2. **移动文档**：将这些文档移动到归档目录
3. **生成日志**：创建详细的开发日志，记录此次工作的内容、成果和遇到的问题
4. **代码合并**：提交当前分支的更改并合并到master分支
5. **架构文档**：根据需要生成或更新架构相关文档

## 工作流程

1. **文档归档**：将计划文档和验收文档重命名并移动到 `docs\归档` 目录，使用日期前缀命名
2. **开发日志**：创建格式为 `YYYY-MM-DD_开发记录.md` 的日志文件，包含工作内容、完成情况和技术细节
3. **Git操作**：执行 `git add .`、`git commit -m "完成工作并归档"`、`git checkout master`、`git merge <current-branch>` 等操作
4. **架构文档**：如果涉及架构变更，生成相应的架构文档并存储到指定目录

## 注意事项

- 确保当前工作目录为项目根目录
- 确保Git工作区干净，无未提交的更改
- 如有架构变更，请在调用技能时说明变更内容