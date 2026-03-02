# MdToHtml - EXE导出与性能优化产品需求文档

## Overview
- **Summary**: 将当前基于脚本启动的MdToHtml系统转换为可直接执行的exe文件，实现1键启动功能，同时优化启动速度和性能。
- **Purpose**: 提供更便捷的启动方式，减少启动时间，提高用户体验，同时保持系统功能完整性。
- **Target Users**: 使用MdToHtml工具的开发者和内容创作者。

## Goals
- 将当前系统状态转换为exe格式，实现1键启动
- 提高启动速度和性能，确保启动时间小于3秒
- 保持所有原有功能，确保与脚本启动的功能一致
- 将产物放置到指定的release目录
- 无需安装，直接运行exe即可使用

## Non-Goals (Out of Scope)
- 不需要安装/卸载功能
- 不需要自动更新机制
- 不需要多平台支持（仅Windows平台）
- 不需要复杂的配置界面

## Background & Context
- 当前系统使用start.bat脚本启动，需要Node.js环境
- 已有Electron配置，支持打包为桌面应用
- 项目基于Next.js，包含Express服务器
- 目标是创建一个便携式的exe文件，提供更便捷的使用体验

## Functional Requirements
- **FR-1**: 生成可直接运行的exe文件
- **FR-2**: 实现1键启动功能，双击exe即可运行
- **FR-3**: 保持所有原有功能，包括文件读写、Markdown编辑、HTML导出等
- **FR-4**: 确保exe文件能在无Node.js环境的情况下运行

## Non-Functional Requirements
- **NFR-1**: 启动时间小于3秒
- **NFR-2**: 内存占用合理，不超过500MB
- **NFR-3**: 打包后的文件大小合理
- **NFR-4**: 启动过程稳定可靠，无错误或异常

## Constraints
- **Technical**: Windows平台，Electron框架
- **Business**: 产物需放置到指定的release目录
- **Dependencies**: 项目现有依赖，包括Next.js、Express等

## Assumptions
- 项目代码结构和功能已完善，无需额外开发
- 打包过程中所有依赖能正确包含
- 目标用户使用Windows操作系统

## Acceptance Criteria

### AC-1: 生成可执行的exe文件
- **Given**: 项目代码已准备就绪
- **When**: 执行打包命令
- **Then**: 生成的exe文件能在release目录中找到
- **Verification**: `programmatic`
- **Notes**: 确保文件存在且大小合理

### AC-2: 1键启动功能
- **Given**: exe文件已生成
- **When**: 双击exe文件
- **Then**: 应用能正常启动，无需额外操作
- **Verification**: `human-judgment`
- **Notes**: 启动过程应流畅，无卡顿

### AC-3: 启动时间优化
- **Given**: 应用已启动
- **When**: 测量启动时间
- **Then**: 启动时间小于3秒
- **Verification**: `programmatic`
- **Notes**: 从双击exe到应用完全加载的时间

### AC-4: 功能完整性
- **Given**: 应用已启动
- **When**: 测试各项功能
- **Then**: 所有功能正常工作，与脚本启动一致
- **Verification**: `human-judgment`
- **Notes**: 包括文件读写、编辑、导出等核心功能

### AC-5: 性能优化
- **Given**: 应用运行中
- **When**: 监控内存占用
- **Then**: 内存占用不超过500MB
- **Verification**: `programmatic`
- **Notes**: 正常使用情况下的内存占用

## Open Questions
- [ ] 是否需要添加启动日志以方便排查问题？
- [ ] 是否需要对打包后的文件大小进行进一步优化？