export const EXAMPLE_CONTENT = `---
title: "系统整体设计汇报总结"
subtitle: "基于前端、后端、管理员三部分技术分析报告汇总"
highlights:
  - "多语言混合架构：原生小程序 + Java Spring Boot + Python FastAPI"
  - "60fps 自研图表引擎：双缓存机制与环形缓冲区，包体积减少90%"
  - "百万级数据降维传输：基于时间槽算法的V2聚合接口，带宽降低80%"
  - "本地网络降级策略：智能HTTP客户端保障极端环境下业务连续性"
  - "双重加密安全体系：RC4传输层加密 + Bcrypt存储层哈希"
version: "1.1"
---

## 1. 系统总体架构概览 {layout="grid", columns="3"}

### 项目基本信息 {card-style="summary", col-span="3"}

本项目构建了一个高性能、高可用、安全的分布式 IoT 监测系统，由三个核心子系统组成，分别采用最适合该领域的编程语言与框架，形成多语言混合架构的技术生态。

**汇报时长**: 约 10 分钟  
**核心目标**: 突出各子系统的架构选型理由、核心技术创新与关键实现细节

### 前端子系统 {card-style="normal"}

基于 **微信小程序原生框架**，专注于极致的启动速度与高性能实时图表渲染，采用 MVVM 架构模式。

### 后端子系统 {card-style="normal"}

基于 **Java Spring Boot 3 + Java 21**，作为高并发数据中台，负责海量传感器数据的接收与清洗。

### 管理员子系统 {card-style="normal"}

基于 **Python FastAPI**，提供异步非阻塞的身份认证、权限管理与系统配置服务。

---

## 2. 核心亮点 {layout="grid", columns="3"}

### 性能突破 {card-style="summary", col-span="3"}

本系统采用多语言混合架构，各子系统在技术选型上充分发挥语言特性优势，实现性能、稳定性与开发效率的最优平衡。

### 60 FPS {card-style="stat", col-span="1"}

自研图表引擎，采用双缓存机制与环形缓冲区，包体积减少 90%，低端设备流畅运行。

### 80% 降带宽 {card-style="stat", col-span="1"}

V2 聚合接口基于时间槽算法，根据屏幕分辨率动态计算返回点数，显著降低带宽消耗。

### 0 业务中断 {card-style="stat", col-span="1"}

智能 HTTP 客户端自动检测云端状态，故障时无缝切换至局域网边缘节点，保障业务连续性。

### 100万+ 连接 {card-style="stat", col-span="1"}

后端基于 Java 21 架构预留 Virtual Threads 兼容性，为未来大规模 IoT 设备连接做好技术储备。

### 2 层加密 {card-style="stat", col-span="1"}

传输层自研 RC4 应用层加密，存储层使用 Bcrypt 加盐哈希，构建端到端数据安全屏障。

### 3000+ 并发 {card-style="stat", col-span="1"}

基于 JWT 的分布式认证体系，集成 Slowapi 限流防御，单进程支撑数千并发。

---

## 3. 前端子系统：原生极致性能 {layout="grid", columns="2"}

### 综述 {card-style="summary", col-span="2"}

前端子系统采用微信小程序原生开发方案，通过自研渲染引擎与边缘计算能力，在低端设备上实现流畅的实时数据可视化体验。

### 技术选型决策 {card-style="highlight", col-span="2"}

- **原生框架优势**: 相比 UniApp/Taro 等跨端方案，原生开发无运行时桥接损耗，能直接调用底层 \`OffscreenCanvas\` 与 \`ArrayBuffer\` API。
- **MVVM 架构**: 基于微信小程序原生框架 (Glass-Easel) 的响应式数据绑定机制，实现视图与逻辑的清晰分离。

### 原生框架优势 {card-style="highlight", col-span="1"}

相比 UniApp/Taro 等跨端方案，原生开发无运行时桥接损耗，能直接调用底层 \`OffscreenCanvas\` 与 \`ArrayBuffer\` API，确保在低端设备上也能实现 **60fps** 的流畅体验。

### MVVM 架构 {card-style="highlight", col-span="1"}

基于微信小程序原生框架 (Glass-Easel) 的响应式数据绑定机制，实现视图与逻辑的清晰分离。

### 双缓存机制 {card-style="highlight", col-span="1"}

利用离屏 Canvas 预渲染网格背景，每帧仅重绘动态折线，大幅降低 GPU 负载，实现流畅的实时曲线渲染。

### 环形缓冲区 {card-style="highlight", col-span="1"}

自研基于 \`Float32Array\` 的环形缓冲区数据结构：
- **零 GC**: 内存一次分配，循环复用
- **O(1) 复杂度**: 写入与读取操作复杂度恒定

### 包体积优化 {card-style="highlight", col-span="1"}

放弃庞大的 ECharts 库，采用 **Canvas 2D** 手写轻量级渲染引擎，包体积减少 **90%**。

### 智能 HTTP 客户端 {card-style="highlight", col-span="1"}

实现了 **本地网络降级** 策略。当云端服务不可用时，自动扫描并切换至局域网内的边缘节点，确保极端环境下业务不中断。

---

## 4. 后端子系统：高并发 IoT 中台 {layout="grid", columns="2"}

### 综述 {card-style="summary", col-span="2"}

后端子系统作为 IoT 数据中心，承担海量传感器数据的实时接收、清洗与存储任务，采用企业级 Java 技术栈确保稳定性与扩展性。

### 技术栈选型 {card-style="normal", col-span="1"}

采用 **Spring Boot 3.5.9** + **Java 21 (LTS)**，利用 Java 21 的成熟生态优势，为高并发 IoT 数据处理提供底层支撑。

### 虚拟线程预留 {card-style="normal", col-span="1"}

预留 **Virtual Threads** 兼容性设计，为未来百万级设备连接挑战做好技术储备。

### 全双工长连接 {card-style="normal", col-span="1"}

通过 \`qpid-jms\` 维护与阿里云 IoT 平台的 TCP 长连接，基于 **AMQP 1.0** 协议通信，延迟低至毫秒级，网络开销相比 HTTP 轮询减少 **80%**。

### 异步削峰机制 {card-style="normal", col-span="1"}

接收到消息后立即放入内部缓冲池，解耦数据接收与业务处理，有效应对数据流量峰值。

### V2 聚合接口 {card-style="normal", col-span="1"}

后端新增 V2 版本接口，实现基于时间槽的数据聚合 (Time Slot Aggregation)。根据前端屏幕分辨率动态计算返回点数，将百万级数据降维传输，显著降低带宽消耗。

### 批量写入优化 {card-style="normal", col-span="1"}

利用 MyBatis-Plus 的 \`saveBatch\` 结合 MySQL JDBC 的 \`rewriteBatchedStatements=true\`，将单条插入优化为批量合并插入，显著提升吞吐量。

---

## 5. 管理员子系统：安全认证中心 {layout="grid", columns="2"}

### 综述 {card-style="summary", col-span="2"}

管理员子系统作为系统的安全门户，负责身份认证、权限管理与系统配置，采用 Python 异步框架实现高性能与开发效率的平衡。

### FastAPI 框架 {card-style="warning", col-span="1"}

基于 ASGI 标准，原生支持 \`async/await\` 异步 I/O，在处理数据库读写与网络请求时释放 CPU，单进程即可支撑数千并发，性能媲美 Go/Node.js。

### 敏捷开发优势 {card-style="warning", col-span="1"}

Python 语言的简洁语法与 FastAPI 的自动文档生成能力，大幅提升开发效率与接口维护便利性。

### OAuth2 + JWT 认证 {card-style="warning", col-span="1"}

实现了基于 **OAuth2 + JWT** 的无状态认证体系，支持 Token 自动刷新与过期失效机制。

### 双重加密策略 {card-style="warning", col-span="1"}

- **传输层**: 针对非 HTTPS 环境，自研 **RC4** 应用层加密协议
- **存储层**: 强制使用 **Bcrypt** 算法自动加盐哈希，抗 GPU 彩虹表攻击

### 防御机制 {card-style="warning", col-span="1"}

集成 \`Slowapi\` 对敏感接口实施限流，防御暴力破解攻击，保障系统安全性。

---

## 6. 项目总结 {layout="grid", columns="4"}

### 综述 {card-style="summary", col-span="4"}

本项目充分发挥了 **多语言混合架构** 的技术优势，各子系统各司其职，协同构建工业级 IoT 监测平台。

### 60 FPS {card-style="stat", col-span="1"}

前端极致渲染

### 99.9% {card-style="stat", col-span="1"}

后端企业级稳定

### 50% 提效 {card-style="stat", col-span="1"}

Python 敏捷开发

### 100万+ {card-style="stat", col-span="1"}

工业级扩展潜力
`;

export const INITIAL_CONTENT = `# Welcome to CHD Editor

## 快速开始 (Quick Start)

这是一个 **实时所见即所得** 的 CHD 文档编辑器。
你可以在左侧编写 Markdown，右侧实时查看渲染效果。

### 核心特性 {card-style="stat"}
Real-time

### 组件库
点击左侧栏的按钮，快速插入标准的 CHD 组件。

---

## 示例章节 (Example)

### 普通卡片
这是一个最基础的卡片。

### 高亮卡片 {card-style="highlight"}
这是用于强调的高亮卡片。
`;
