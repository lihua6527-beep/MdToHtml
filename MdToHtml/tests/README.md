# 测试文档

本目录包含双模式编辑系统的测试方案。

## 1. 单元测试 (Unit Tests)
我们采用了一种创新的浏览器端测试方案，直接在 Next.js 环境中运行测试，确保与真实运行环境一致。

- **测试位置**: `src/app/test/page.tsx`
- **运行方式**: 
  1. 确保开发服务器正在运行 (`npm run dev`)
  2. 访问浏览器: [http://localhost:3000/test](http://localhost:3000/test)
  3. 页面将显示所有测试用例的 PASS/FAIL 状态。
- **覆盖范围**: 
  - `src/lib/validator.ts`: 验证核心 Markdown 校验逻辑（头部层级、孤立卡片检测、属性语法等）。

## 2. 集成测试 (Integration Tests)
我们提供了一个 Python 脚本来验证系统的关键路由和服务器状态。

- **脚本位置**: `tests/integration_test.py`
- **前置条件**: Python 3.x
- **运行方式**:
  ```bash
  python tests/integration_test.py
  ```
- **检测内容**:
  - 主页可用性
  - 编辑器页面 (`/editor`) 可访问性
  - 单元测试页面 (`/test`) 可访问性

## 3. 手动验证 (Manual Verification)
请参考 `docs/用户手册/双模式编辑系统用户手册.md` 进行功能验证：
1. **Markdown模式**: 导入 .md 文件，检查实时预览。
2. **Visual模式**: 添加卡片，拖拽排序。
3. **模式切换**: 确认切换时弹出警告框。
