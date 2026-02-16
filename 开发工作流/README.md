# 开发工作流资源包 (Development Workflow Kit)

本目录包含了一套标准化的开发工作流资源，旨在帮助新项目快速建立高效、规范的版本管理与协作环境。

## 资源清单

1.  **[Git并行开发指南.md](./Git并行开发指南.md)**
    *   详细阐述了分支策略、提交规范和标准开发流程。
    *   适用于团队协作和个人多任务并行开发。

2.  **[.gitignore_template](./.gitignore_template)**
    *   通用的 Git 忽略文件模板。
    *   涵盖了 Node.js, Python, macOS, Windows 和常用 IDE 的排除规则。

## 如何使用 (一键获取体验)

### 1. 初始化 Git 仓库
在你的新项目根目录下运行：
```bash
git init
```

### 2. 应用 .gitignore
将本目录下的 `.gitignore_template` 复制到你的项目根目录，并重命名为 `.gitignore`：
```bash
# Windows PowerShell
cp "path/to/开发工作流/.gitignore_template" .\.gitignore
```

### 3. 遵循开发指南
阅读并遵循 `Git并行开发指南.md` 中的流程进行开发。建议将其中的核心原则（如分支命名、Commit 规范）加入到你项目的 `README.md` 或 `CONTRIBUTING.md` 中。

---
*由 MdToHtml 项目组整理提供。*
