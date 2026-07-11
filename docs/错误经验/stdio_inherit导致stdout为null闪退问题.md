# Node.js spawn stdio: 'inherit' 导致 server.stdout 为 null 导致闪退

**日期**: 2026-07-11  
**涉及文件**: `MdToHtml/scripts/setup-port.js`  
**严重程度**: ⚠️ 阻塞级（启动闪退）

---

## 问题现象

修改 `setup-port.js` 将 `stdio: 'inherit'` 传入 `spawn()`，同时添加 `server.stdout.on('data', ...)` 监听。启动后脚本立刻闪退，不输出任何错误信息。

## 根因

Node.js `child_process.spawn()` 的 `stdio` 选项决定了子进程标准 I/O 的流向：

```
stdio: 'inherit'      → 子进程 stdout/stderr 直接透传到父进程，server.stdout === null
stdio: ['inherit', 'pipe', 'inherit']  → 子进程 stdout 走 pipe，server.stdout 是 Readable 流
```

当 `server.stdout === null` 时调用 `.on('data', callback)` 抛出 `TypeError`，且该错误未被 `server.on('error')` 捕获（因为 server.stdout 不存在的错误不在 spawn 的 error 事件范围内），导致整个 Node 进程崩溃。

**关键点**：
- `spawn()` 的 error 事件**不捕获** `server.stdout.on('data')` 引发的错误
- `stdio: 'inherit'` 时 `server.stdout` 是 `null`，不是 `undefined`，`if (server.stdout)` 可以检查到
- 错误发生时控制台无任何输出，因为 Error 栈未被打印，进程直接 exit

## 修复

### 方案（已采用）

```js
const server = spawn('npm', ['run', 'dev'], {
    stdio: ['inherit', 'pipe', 'inherit'],  // ← 关键：第二个元素改为 'pipe'
    // ...
});

// 必须加防御性检查
if (server.stdout) {
    server.stdout.on('data', (data) => {
        process.stdout.write(data);     // 透传 stdout 到父进程控制台
        const text = data.toString();
        // ... 监听逻辑
    });
}
```

### 原理

| stdio 配置 | stdin | stdout | stderr | server.stdout |
|-----------|-------|--------|--------|---------------|
| `'inherit'` | 继承父进程 | 继承父进程 | 继承父进程 | `null` |
| `['pipe', 'pipe', 'inherit']` | pipe | pipe | 继承父进程 | `Readable` |
| `['inherit', 'pipe', 'inherit']` | 继承父进程 | pipe | 继承父进程 | `Readable` |

## 教训

1. **`stdio: 'inherit'` 不会创建 pipe**，所有标准流都直接映射到父进程。如果需要监听子进程输出，必须将对应通道设为 `'pipe'`。
2. 监听子进程 stdout/stderr 后，必须手动 `process.stdout.write(data)` 透传到控制台，否则日志会消失。
3. 对 `server.stdout` 始终加 `if (server.stdout)` 防御性检查。
4. `spawn()` 的 error 事件作用域有限——只覆盖 spawn 本身失败的情况，不覆盖管道操作中的异常。

## 相关搜索关键词

- `child_process.spawn stdio inherit server.stdout null`
- `TypeError: Cannot read properties of null (reading 'on')`
- `spawn stdout pipe vs inherit`