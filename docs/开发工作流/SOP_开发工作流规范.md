# 标准开发工作流规范 (Standard Development Workflow)

本文档旨在确立 `MdToHmtl` 项目的标准化开发流程，确保每一次功能迭代都经过严谨的计划、执行、验证和归档。

> **核心原则**:
> 1.  **计划先行**: 无计划，不编码。
> 2.  **分支隔离**: 所有新功能必须在独立分支开发。
> 3.  **验收闭环**: 必须经过 AI 自测和用户确认。
> 4.  **文档归档**: 开发过程必须留痕。

---

## 阶段一：准备工作 (Preparation)

### 1.1 生成项目计划书 & 交付指标
*   **触发条件**: 用户提出新功能需求。
*   **AI 动作**: 基于 `docs/templates/` 下的模板，生成本次任务的：
    *   `docs/plans/Feature_Name_Plan.md` (项目计划书)
    *   `docs/plans/Feature_Name_Metrics.md` (交付指标)
*   **用户动作**: 审查并确认计划和指标。

### 1.2 创建 Git 分支
*   **触发条件**: 计划书确认通过。
*   **指令**:
    ```bash
    git checkout master
    git pull origin master
    git checkout -b feature/your-feature-name
    ```
*   **说明**: 此时正式进入“开发模式”。

### 1.3 UI/UX 原型验证 (UI/UX Prototype)
*   **触发条件**: 涉及前端界面变更或新页面开发。
*   **AI 动作**: 
    *   生成临时 HTML/CSS 预览文件或组件原型。
    *   使用 `OpenPreview` 工具展示效果。
*   **用户动作**: 
    *   查看视觉效果和交互流程。
    *   确认设计风格是否符合预期，避免后期返工。

---

## 阶段二：开发与测试 (Development & Testing)

### 2.1 编码实现
*   **AI 动作**: 根据计划书进行编码，遵循项目代码规范。
*   **用户动作**: 监督进度，提供必要反馈。

### 2.2 单元/集成测试 (AI 自测)
*   **AI 动作**:
    *   编写并运行测试用例。
    *   确保通过所有自动化测试。
    *   自我审查代码质量。

### 2.3 用户验收测试 (UAT)
*   **触发条件**: AI 自测通过，功能开发完成。
*   **用户动作**:
    *   实际运行程序，验证功能是否符合《交付指标》。
    *   提出修改意见或确认通过。

---

## 阶段三：收尾与归档 (Conclusion & Archiving)

### 3.1 生成开发记录
*   **触发条件**: 用户验收通过。
*   **AI 动作**: 基于 `docs/templates/03_开发记录模板.md` 生成总结文档：
    *   `docs/logs/Feature_Name_Log.md`
    *   记录关键决策、测试结果和遗留问题。

### 3.2 文档归档
*   **动作**: 将计划书、指标书、开发记录整理归档到 `docs/archive/` 或指定目录。

### 3.3 提交与合并
*   **指令**:
    ```bash
    # 1. 提交所有更改 (包括文档)
    git add .
    git commit -m "feat: 完成 feature/xxx 功能开发并归档文档"

    # 2. 切回主分支
    git checkout master

    # 3. 合并分支
    git merge feature/your-feature-name

    # 4. (可选) 删除分支
    git branch -d feature/your-feature-name
    ```

---

## 附录：文档模板位置
*   项目计划书: `docs/templates/01_项目计划书模板.md`
*   交付指标: `docs/templates/02_交付指标模板.md`
*   开发记录: `docs/templates/03_开发记录模板.md`
