'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { validateContent, ValidationResult } from '@/lib/validator';
import { useAutoSave, loadFromStorage } from '@/hooks/useAutoSave';
import { 
  LayoutTemplate, 
  Heading1, 
  Heading2, 
  Heading3, 
  Quote, 
  AlertTriangle, 
  Code,
  BarChart3,
  Columns,
  FileText,
  AlertCircle,
  XCircle,
  Wrench,
  ExternalLink,
  BookOpen
} from 'lucide-react';

const EXAMPLE_CONTENT = `---
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

interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  onCursorChange?: (line: number) => void;
  className?: string;
}

export interface MarkdownEditorHandle {
  scrollToLine: (line: number) => void;
}

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(({
  value,
  onChange,
  onScroll,
  onCursorChange,
  className
}, ref) => {
  // Internal state for uncontrolled mode (or initial load)
  const [internalContent, setInternalContent] = useState(() => loadFromStorage('chd_md_content', INITIAL_CONTENT));
  
  // Use controlled value if provided, else internal
  const content = value !== undefined ? value : internalContent;
  
  const [filePath, setFilePath] = useState('output/my-document.md');
  const [status, setStatus] = useState<string>('');
  
  // Auto-save
  const { lastSaved, isSaving } = useAutoSave('chd_md_content', content);

  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationResult[]>([]);

  // Real-time Validation
  useEffect(() => {
    const errors = validateContent(content);
    setValidationErrors(errors);
  }, [content]);

  // Interaction Enhancements State
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    scrollToLine: (line: number) => {
      if (textareaRef.current) {
        const lineHeight = 24; // Approximation for text-sm leading-relaxed
        const targetScroll = (line - 1) * lineHeight;
        
        textareaRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  }));

  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [menuFilter, setMenuFilter] = useState('');
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);

  // Components Definition
  const components = [
    { label: '一级标题 (H1)', id: 'h1', icon: Heading1, text: '# ' },
    { label: '二级标题 (H2)', id: 'h2', icon: Heading2, text: '## ' },
    { label: '三级卡片 (Card)', id: 'card', icon: Heading3, text: '### Card Title\nContent here...' },
    { label: '统计数据 (Stat)', id: 'stat', icon: BarChart3, text: '### Metric {card-style="stat"}\n99.9%' },
    { label: '高亮内容 (Highlight)', id: 'highlight', icon: LayoutTemplate, text: '### Highlight {card-style="highlight"}\nImportant content.' },
    { label: '引用语 (Quote)', id: 'quote', icon: Quote, text: '### Quote {card-style="quote"}\n"This is a quote."' },
    { label: '警告提示 (Warning)', id: 'warning', icon: AlertTriangle, text: '### Warning {card-style="warning"}\nBe careful!' },
    { label: '代码块 (Code)', id: 'code', icon: Code, text: '### Code {card-style="code"}\n```js\nconsole.log("Hello");\n```' },
    { label: '左右分栏 (Split)', id: 'split', icon: Columns, text: '## Split Layout {relation="parallel"}\n' },
  ];

  const filteredComponents = components.filter(c => 
    c.label.toLowerCase().includes(menuFilter.toLowerCase()) || 
    c.id.includes(menuFilter.toLowerCase())
  );

  const setContent = (newVal: string | ((prev: string) => string)) => {
    let nextContent: string;
    if (typeof newVal === 'function') {
      nextContent = newVal(content);
    } else {
      nextContent = newVal;
    }
    
    if (onChange) {
      onChange(nextContent);
    } else {
      setInternalContent(nextContent);
    }
  };

  // Smart Insert: Inserts at cursor position
  const insertText = (textToInsert: string, replaceTrigger = false) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent(prev => prev + '\n' + textToInsert + '\n');
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    let newContent = '';
    let newCursorPos = 0;

    if (replaceTrigger) {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const lineContent = text.substring(lineStart, start);
      const slashIndex = lineContent.lastIndexOf('/');
      
      const beforeSlash = text.substring(0, lineStart + slashIndex);
      const afterCursor = text.substring(end);
      
      newContent = beforeSlash + textToInsert + '\n' + afterCursor;
      newCursorPos = beforeSlash.length + textToInsert.length + 1;
    } else {
      newContent = text.substring(0, start) + textToInsert + text.substring(end);
      newCursorPos = start + textToInsert.length;
    }

    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      // Trigger scroll or update
      updateActiveLine();
    }, 0);
    
    setShowMenu(false);
  };

  // Sync Scroll: Editor -> Preview (Propagated up)
  const handleScroll = () => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = textareaRef.current;
    if (onScroll) {
      onScroll(scrollTop, scrollHeight, clientHeight);
    }
  };

  const updateActiveLine = () => {
    if (!textareaRef.current || !onCursorChange) return;
    const cursor = textareaRef.current.selectionStart;
    const textBefore = textareaRef.current.value.slice(0, cursor);
    const line = textBefore.split('\n').length;
    onCursorChange(line);
  };

  // Input Handler: Detect Slash
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const lastLine = textBefore.split('\n').pop() || '';
    
    // Update active line
    const line = textBefore.split('\n').length;
    if (onCursorChange) onCursorChange(line);

    const slashMatch = lastLine.match(/\/([a-zA-Z0-9]*)$/);
    
    if (slashMatch) {
      const query = slashMatch[1];
      setMenuFilter(query);
      setActiveMenuIndex(0);
      
      if (!showMenu) {
         const lineHeight = 24; 
         const lines = textBefore.split('\n').length;
         const top = (lines * lineHeight) - (e.target.scrollTop || 0) + 10; 
         const left = 40 + (lastLine.length * 8); 
         
         const clampedTop = Math.min(top, 600); 
         
         setMenuPosition({ top: clampedTop, left });
         setShowMenu(true);
      }
    } else {
      setShowMenu(false);
    }
  };

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
      return;
    }

    if (showMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveMenuIndex(prev => (prev + 1) % filteredComponents.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveMenuIndex(prev => (prev - 1 + filteredComponents.length) % filteredComponents.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredComponents[activeMenuIndex]) {
          insertText(filteredComponents[activeMenuIndex].text, true);
        }
      } else if (e.key === 'Escape') {
        setShowMenu(false);
      }
    }
  };

  // Click handler to update cursor
  const handleClick = () => {
    updateActiveLine();
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    
    const validExtensions = ['.md', '.txt', '.markdown'];
    const isMarkdown = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isMarkdown && file.type !== 'text/plain' && file.type !== 'text/markdown') {
      setStatus('Error: Only Markdown/Text files allowed');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    try {
      const text = await file.text();
      if (text.includes('\0')) {
        throw new Error("Binary file detected");
      }
      
      setContent(text);
      setFilePath(prev => {
         const dir = prev.includes('/') ? prev.substring(0, prev.lastIndexOf('/') + 1) : '';
         return dir + file.name;
      });
      setStatus(`Loaded: ${file.name}`);
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      console.error(err);
      setStatus('Error reading file');
    }
  };

  const handleSave = async () => {
    setStatus('Saving...');
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content })
      });
      if (res.ok) {
        setStatus('Saved!');
        setTimeout(() => setStatus(''), 2000);
      } else {
        setStatus('Error saving');
      }
    } catch (e) {
      console.error(e);
      setStatus('Error');
    }
  };

  const handleLoad = async () => {
    setStatus('Loading...');
    try {
      const res = await fetch(`/api/read?path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
        setStatus('Loaded');
        setTimeout(() => setStatus(''), 2000);
      } else {
        setStatus('File not found');
      }
    } catch (e) {
      console.error(e);
      setStatus('Error');
    }
  };

  const handleFix = (fix: NonNullable<ValidationResult['fix']>, lineNum: number) => {
    if (fix.range === 'line') {
      const lines = content.split('\n');
      if (lines[lineNum - 1] !== undefined) {
        lines[lineNum - 1] = fix.newText;
        const newContent = lines.join('\n');
        setContent(newContent);
      }
    }
  };

  return (
    <div 
      className={`flex flex-col h-full bg-gray-50 text-gray-900 font-sans overflow-hidden relative ${className || ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-primary/20 backdrop-blur-sm flex items-center justify-center border-4 border-primary border-dashed m-4 rounded-xl pointer-events-none">
          <div className="bg-white px-8 py-6 rounded-xl shadow-xl flex flex-col items-center animate-bounce">
             <FileText className="w-12 h-12 text-primary mb-2" />
             <span className="text-lg font-bold text-gray-700">Drop Markdown file to edit</span>
          </div>
        </div>
      )}
      
      {/* 1. Top Navigation Bar */}
      <div className="h-14 border-b border-gray-200 bg-white flex items-center px-4 justify-between shrink-0 z-50 relative shadow-sm">
        <div className="flex items-center gap-6 flex-1">
          {/* File Manager */}
          <div className="flex items-center gap-2 flex-1 max-w-2xl">
             <div className="flex items-center bg-gray-100 rounded-md px-3 py-1.5 border border-gray-200 flex-1 transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                <span className="text-gray-400 text-xs mr-2 font-mono">ROOT/</span>
                <input 
                  className="bg-transparent border-none outline-none text-sm text-gray-700 w-full placeholder-gray-400 font-mono"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="path/to/file.md"
                />
             </div>
             <button onClick={handleLoad} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
               Load
             </button>
             <button onClick={handleSave} className="px-4 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-all active:scale-95 flex items-center gap-2">
               Save
             </button>
             <button 
               onClick={() => {
                 if (confirm('This will overwrite current content. Continue?')) {
                   setContent(EXAMPLE_CONTENT);
                 }
               }} 
               className="px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors flex items-center gap-1"
              title="加载系统设计示例文档"
             >
               <BookOpen className="w-3 h-3" />
               Example
             </button>
             {status ? (
                <span className="text-xs text-gray-500 animate-fade-in">{status}</span>
             ) : (
                <span className="text-xs text-gray-400 transition-opacity">
                    {isSaving ? 'Saving...' : lastSaved ? `Autosaved ${lastSaved.toLocaleTimeString()}` : ''}
                </span>
             )}
          </div>
        </div>

        <div className="flex items-center gap-3">
             <button 
               onClick={() => window.open('/preview', '_blank')}
               className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1"
              title="在新标签页中打开预览以测试交互"
             >
               <ExternalLink className="w-3 h-3" />
               Preview
             </button>
             <div className="text-[10px] px-2 py-1 bg-gray-100 rounded text-gray-500">Mode: Markdown</div>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Column 1: Component Palette (Left, ~12.5%) */}
        <div className="w-32 lg:w-[12.5%] flex flex-col border-r border-gray-200 bg-gray-50/50 shrink-0 transition-all">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-bold text-gray-700 text-xs flex items-center justify-center gap-2 uppercase tracking-wider">
              Toolbox
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {components.map((item, idx) => (
              <button
                key={idx}
                onClick={() => insertText(item.text)}
                className="w-full flex flex-col items-center gap-1 p-2 rounded-lg bg-white border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all group active:scale-[0.98]"
              >
                <div className="p-1.5 bg-gray-50 rounded-full group-hover:bg-primary/10 transition-colors">
                  <item.icon className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
                </div>
                <div className="text-[10px] font-medium text-gray-600 group-hover:text-primary text-center w-full truncate">
                  {item.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Column 2: Source Editor (Middle, Flex-1) */}
        <div className="flex-1 flex flex-col bg-white relative min-w-0 border-r border-gray-200 z-10 shadow-[5px_0_15px_-5px_rgba(0,0,0,0.05)]">
          <div className="p-2 border-b border-gray-100 flex justify-between items-center bg-white">
            <span className="text-xs font-medium text-gray-400 px-2">Markdown Source</span>
            <span className="text-[10px] text-green-500 font-mono px-2">Live Sync</span>
          </div>
          <textarea 
            ref={textareaRef}
            className="flex-1 w-full p-8 resize-none focus:outline-none font-mono text-sm leading-relaxed text-gray-800 bg-white selection:bg-primary/20"
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onClick={handleClick}
            onScroll={handleScroll}
            placeholder="Start typing your CHD document... (Type '/' for commands)"
            spellCheck={false}
          />
          
          {/* Slash Command Menu */}
          {showMenu && (
            <div 
              className="absolute z-50 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Insert Component
              </div>
              <div className="max-h-64 overflow-y-auto p-1">
                {filteredComponents.length > 0 ? (
                  filteredComponents.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => insertText(item.text, true)}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors ${
                        idx === activeMenuIndex 
                          ? 'bg-primary/10 text-primary' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-gray-400 text-center">No matches</div>
                )}
              </div>
            </div>
          )}

          {/* Validation Panel */}
          {validationErrors.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border border-red-100 overflow-hidden z-40 max-h-64 flex flex-col animate-in slide-in-from-bottom-2">
              <div className="bg-red-50 px-3 py-2 border-b border-red-100 flex justify-between items-center sticky top-0">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-red-700">CHD Protocol Issues ({validationErrors.length})</span>
                </div>
              </div>
              <div className="overflow-y-auto p-0 divide-y divide-gray-100">
                {validationErrors.map((err, idx) => (
                  <div key={idx} className="group flex flex-col gap-1 p-3 hover:bg-red-50 transition-colors">
                    <div className="flex items-start gap-2">
                       {err.type === 'error' ? (
                         <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                       ) : (
                         <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                       )}
                       <div className="flex-1">
                          <div className="flex items-baseline justify-between">
                            <span className={`text-xs font-semibold ${err.type === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                                {err.message}
                            </span>
                            <span className="font-mono text-[10px] text-gray-400 bg-white border px-1.5 rounded">Ln {err.line}</span>
                          </div>
                          
                          {/* Suggestion & Quick Fix */}
                          {err.suggestion && (
                             <div className="mt-1.5 text-xs text-gray-600 flex items-center gap-2">
                                <span className="font-medium text-gray-500">Suggestion:</span>
                                {err.suggestion}
                             </div>
                          )}
                          
                          {err.fix && (
                             <button 
                               onClick={() => handleFix(err.fix!, err.line)}
                               className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all text-xs font-medium w-fit"
                             >
                                <Wrench className="w-3 h-3" />
                                Auto Fix: Apply Change
                             </button>
                          )}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
MarkdownEditor.displayName = 'MarkdownEditor';
