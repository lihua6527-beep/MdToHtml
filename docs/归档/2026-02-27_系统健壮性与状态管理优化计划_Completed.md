# 系统健壮性与状态管理优化计划书 (2026-02-27)

## 1. 背景与目标
当前系统在架构迁移过程中，虽然引入了 Service 层与 SWR，但仍存在以下痛点：
1.  **Service 层迁移不彻底**: 核心组件（如 `DocumentList`）仍保留大量直接的 `fetch` 调用，导致错误处理逻辑分散且不一致。
2.  **状态同步依赖手动刷新**: 大量操作（删除、重命名等）后依赖手动调用 `refresh()` 或 `router.refresh()`，未能充分利用 SWR 的自动重验证机制。
3.  **魔法字符串泛滥**: SWR 的 Key（如 `'/api/files'`）散落在各处，维护风险高。
4.  **错误反馈原始**: 仅依赖 `alert()` 和控制台日志，缺乏用户友好的 Toast 通知或 UI 降级处理。

**目标**: 
- 完成 Service 层迁移闭环，移除所有组件内的直接 API 调用。
- 建立全局状态自动同步机制，消除手动刷新代码。
- 规范化 Key 管理，提升代码可维护性。
- 引入统一的 Toast 反馈机制，提升用户体验。

## 2. 核心实施步骤

### 2.1 阶段一：基础设施建设 (Infrastructure)
1.  **统一 Key 管理**:
    - 创建 `src/constants/query-keys.ts`。
    - 定义 `QUERY_KEYS` 常量对象（FILES, TRASH, CAPACITY, etc.）。
    - 替换 `useFileSystem.ts` 及 Service 层中的所有硬编码字符串。
2.  **引入 Toast 通知系统**:
    - 安装或集成轻量级 Toast 组件（如 `sonner` 或自研简易版）。
    - 封装 `useToast` Hook，替代 `alert`。

### 2.2 阶段二：Service 层增强与自动变异 (Smart Services)
1.  **Service 方法标准化**:
    - 改造 `FileService`、`TrashService` 等，使其方法返回标准化的 `Result<T>` 或抛出业务异常，而非仅仅返回 `boolean`。
2.  **实现 Auto Mutation**:
    - 在 Service 层引入 `mutate`（来自 `swr`）。
    - 在 CUD（Create/Update/Delete）操作成功后，自动触发关联 Key 的 `mutate`。
    - **示例**: `FileService.deleteFile` 成功后 -> 自动 `mutate(QUERY_KEYS.FILES)` 和 `mutate(QUERY_KEYS.CAPACITY)`。

### 2.3 阶段三：组件层重构 (Component Refactoring)
1.  **重构 `DocumentList.tsx`**:
    - 移除 `performDelete`、`performBatchDelete` 中的 `fetch` 调用。
    - 替换为 `FileService.deleteFile` / `FileService.deleteFiles`。
    - 移除手动 `refresh()` 调用，依赖 Service 层的自动变异。
    - 接入 Toast 系统处理成功/失败反馈。
2.  **重构 `InteractivePost.tsx`** (如适用):
    - 检查并替换内部的保存/更新逻辑。
3.  **重构 `RecycleBin.tsx`**:
    - 确保还原/清空操作调用 `TrashService` 并自动触发列表刷新。

### 2.4 阶段四：健壮性加固 (Robustness)
1.  **全局错误边界**:
    - 检查 `GlobalErrorBoundary` 的覆盖范围。
    - 确保 API 请求失败时有优雅的 UI 降级（如“网络连接失败，请重试”）。
2.  **类型安全强化**:
    - 确保所有 Service 方法的入参和出参都有严格的 TypeScript 定义。

## 3. 验证策略
1.  **状态同步测试**:
    - 删除文件 -> 列表自动减少，容量条自动更新（无手动刷新）。
    - 回收站还原 -> 列表自动出现文件。
    - 编辑器保存 -> 列表“最后修改时间”自动更新。
2.  **错误处理测试**:
    - 模拟网络断开 -> 操作触发 Toast 报错，页面不崩溃。
    - 模拟后端返回 500 -> Service 层捕获并反馈。

## 4. 回滚计划
- 若重构导致严重 Bug，可回退至 `feature/robustness-upgrade` 分支前的状态。
- 保留旧版 `useFileSystem` 逻辑作为备份，直到新版验证通过。
