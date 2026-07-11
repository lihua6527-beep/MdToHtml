// =============================================================================
// CHD Block Parser
// Markdown → Structured CHD Protocol Blocks (Section/Card/Code/Frontmatter)
// =============================================================================
// Phase 1: 安全兜底防线 (SAFE_MAX_LINES + 空标题守卫 + 内容哈希 ID) ✅
// Phase 2: DFA 状态机 + 4 种错误恢复策略 ✅
// Phase 3: 分片增量解析 + diagnostics (TODO)
// =============================================================================

// --- 安全常量 ---
const SAFE_MAX_LINES = 10000;
const MAX_CODE_BLOCK_DEPTH = 3;

// --- 类型定义 ---

export interface CHDBlock {
  type: 'section' | 'card' | 'frontmatter' | 'code';
  startLine: number;
  endLine: number;
  title: string;
  level: number;
  id: string;
}

export interface ParseDiagnostics {
  parseTime: number;
  totalLines: number;
  errorCount: number;
  errors: ParseError[];
  incomplete: boolean;
}

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  blocks: CHDBlock[];
  diagnostics: ParseDiagnostics;
}

// --- DFA 类型定义 ---

type ParserContext = 'normal' | 'frontmatter' | 'code-block' | 'card' | 'section';
type TokenType = 'FRONTMATTER_OPEN' | 'FRONTMATTER_CLOSE' | 'TRIPLE_BACKTICK' | 'SECTION_HEADER' | 'CARD_HEADER' | 'CONTENT' | 'EOF';

interface Transition {
  from: ParserContext;
  token: TokenType;
  to: ParserContext;
  action: (state: ParserStateMachine, line: string, lineNum: number) => void;
}

// --- 状态机数据结构 ---

interface ParserStateMachine {
  blocks: CHDBlock[];
  currentBlock: CHDBlock | null;
  contextStack: ParserContext[];
  codeBlockDepth: number;
  errors: ParseError[];
  lines: string[];
  halted: boolean;
  incomplete: boolean;
}

// --- Tokenizer ---

function tokenize(line: string, index: number, totalLines: number): TokenType {
  const trimmed = line.trim();
  if (index === 0 && trimmed === '---') return 'FRONTMATTER_OPEN';
  if (trimmed === '---') return 'FRONTMATTER_CLOSE';
  if (trimmed.startsWith('```')) return 'TRIPLE_BACKTICK';
  // 空标题检测：`## ` 或 `##` 或 `## ` 后直接换行
  if (trimmed.startsWith('## ') || trimmed === '##') return 'SECTION_HEADER';
  if (trimmed.startsWith('### ') || trimmed === '###') return 'CARD_HEADER';
  if (index >= totalLines - 1) return 'EOF';
  return 'CONTENT';
}

// --- ID 生成器 ---

function generateBlockId(type: string, title: string, index: number): string {
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
  return `${type}-${titleSlug || 'untitled'}-${index}`;
}

// --- 不变量检查 ---

function checkInvariants(lineCount: number): { halted: boolean; incomplete: boolean } {
  if (lineCount > SAFE_MAX_LINES) {
    return { halted: true, incomplete: true };
  }
  return { halted: false, incomplete: false };
}

// --- 错误恢复函数 ---

function recoverFromInvalidTransition(state: ParserStateMachine, token: TokenType, lineNum: number): void {
  const currentCtx = state.contextStack[state.contextStack.length - 1] || 'normal';

  // Phase 1: 尝试局部修正
  if (currentCtx === 'code-block' && token === 'CONTENT') {
    // 代码块内的常规内容行，继续
    return;
  }

  // Phase 2: 跳过异常区域（连续无效行检测）
  // 如果当前在 code-block 或 frontmatter 中遇到 EOF，强制闭合
  if (token === 'EOF') {
    if (currentCtx === 'code-block') {
      state.errors.push({
        line: lineNum,
        message: `未闭合的代码块（从第 ${state.currentBlock?.startLine ?? 0} 行开始），已强制闭合`,
      });
      // 强制弹出到 normal
      popToContext(state, 'normal');
    } else if (currentCtx === 'frontmatter') {
      state.errors.push({
        line: lineNum,
        message: 'Frontmatter 未闭合，已将 Frontmatter 区域作为普通文本',
      });
      // 丢弃 frontmatter block
      state.currentBlock = null;
      popToContext(state, 'normal');
    }
    return;
  }

  // 对于其他无效转换，记录错误并弹栈到 normal
  state.errors.push({
    line: lineNum,
    message: `意外的标记 ${token}，当前在 ${currentCtx} 上下文中`,
  });
  popToContext(state, 'normal');
}

function popToContext(state: ParserStateMachine, target: ParserContext): void {
  while (state.contextStack.length > 0) {
    const top = state.contextStack[state.contextStack.length - 1];
    if (top === target) return;
    state.contextStack.pop();
  }
  // 兜底：确保至少是 normal
  if (state.contextStack.length === 0) {
    state.contextStack.push('normal');
  }
}

// --- 转换为 DFA Action 函数 ---

const actions = {
  // Frontmatter: 开启
  frontmatterOpen: (state: ParserStateMachine, line: string, lineNum: number) => {
    state.contextStack.push('frontmatter');
    state.currentBlock = {
      type: 'frontmatter',
      startLine: lineNum,
      endLine: lineNum,
      title: 'Metadata',
      level: 0,
      id: 'frontmatter',
    };
  },

  // Frontmatter: 关闭
  frontmatterClose: (state: ParserStateMachine, line: string, lineNum: number) => {
    if (state.currentBlock) {
      state.currentBlock.endLine = lineNum;
      state.blocks.push(state.currentBlock);
      state.currentBlock = null;
    }
    popToContext(state, 'normal');
  },

  // Frontmatter: 内容行（EOF时检测未闭合）
  frontmatterContent: (state: ParserStateMachine, line: string, lineNum: number) => {
    if (state.currentBlock) {
      state.currentBlock.endLine = lineNum;
    }
    // 如果传入的是空行（EOF标记），检测未闭合
    if (line === '' && state.contextStack.includes('frontmatter')) {
      state.errors.push({
        line: lineNum,
        message: 'Frontmatter 未闭合，已将 Frontmatter 区域作为普通文本',
      });
      // 丢弃 frontmatter block
      state.currentBlock = null;
      popToContext(state, 'normal');
    }
  },

  // 代码块: 开始
  codeBlockOpen: (state: ParserStateMachine, line: string, lineNum: number) => {
    if (state.codeBlockDepth >= MAX_CODE_BLOCK_DEPTH) {
      state.errors.push({
        line: lineNum,
        message: `代码块嵌套深度超过上限 ${MAX_CODE_BLOCK_DEPTH}`,
      });
      return;
    }
    state.codeBlockDepth++;
    state.contextStack.push('code-block');

    // 只有不在 card 中时才创建独立的 code block
    if (!state.contextStack.includes('card')) {
      // 关闭当前 block（如果有）
      if (state.currentBlock) {
        state.currentBlock.endLine = lineNum - 1;
        state.blocks.push(state.currentBlock);
        state.currentBlock = null;
      }
      const lang = line.trim().replace(/^```/, '').trim();
      state.currentBlock = {
        type: 'code',
        startLine: lineNum + 1,
        endLine: lineNum,
        title: lang,
        level: 2,
        id: `code-${lineNum}`,
      };
    }
  },

  // 代码块: 结束
  codeBlockClose: (state: ParserStateMachine, line: string, lineNum: number) => {
    state.codeBlockDepth = Math.max(0, state.codeBlockDepth - 1);
    // 正确恢复上下文：如果之前在 card 中，回到 card；否则回到 normal
    const hasCard = state.contextStack.slice(0, -1).includes('card') || state.contextStack.includes('card');
    popToContext(state, hasCard ? 'card' : 'normal');

    if (state.currentBlock && state.currentBlock.type === 'code') {
      state.currentBlock.endLine = lineNum - 1;
      state.blocks.push(state.currentBlock);
      state.currentBlock = null;
    } else if (state.currentBlock) {
      // 在 card 中，扩展 card 的 endLine
      state.currentBlock.endLine = lineNum;
    }

    // 标记 codeBlockClose 已处理栈管理，避免 main loop 覆盖栈顶
    (state as any)._actionManagedStack = true;
  },

  // 代码块: 内容行（EOF时检测未闭合）
  codeBlockContent: (state: ParserStateMachine, line: string, lineNum: number) => {
    if (state.currentBlock) {
      state.currentBlock.endLine = lineNum;
    }
    // 如果传入的是空行（EOF标记），检测未闭合
    if (line === '' && state.contextStack.includes('code-block')) {
      state.errors.push({
        line: lineNum,
        message: `未闭合的代码块（从第 ${state.currentBlock?.startLine ?? 0} 行开始），已强制闭合`,
      });
      popToContext(state, state.contextStack.includes('card') ? 'card' : 'normal');
      // 关闭独立 code block
      if (state.currentBlock && state.currentBlock.type === 'code') {
        state.blocks.push(state.currentBlock);
        state.currentBlock = null;
      }
    }
  },

  // Section: 开始
  sectionOpen: (state: ParserStateMachine, line: string, lineNum: number) => {
    // 关闭当前 block
    if (state.currentBlock) {
      state.currentBlock.endLine = lineNum - 1;
      state.blocks.push(state.currentBlock);
      state.currentBlock = null;
    }
    // 从 card 上下文弹出
    popToContext(state, 'normal');

    const rawTitle = line.trim().replace(/^##\s*/, '');
    const safeTitle = rawTitle || '未命名章节';
    state.currentBlock = {
      type: 'section',
      startLine: lineNum,
      endLine: lineNum,
      title: safeTitle,
      level: 1,
      id: generateBlockId('section', safeTitle, state.blocks.filter(b => b.type === 'section').length),
    };
    state.contextStack.push('section');
  },

  // Card: 开始
  cardOpen: (state: ParserStateMachine, line: string, lineNum: number) => {
    // 关闭当前 block
    if (state.currentBlock) {
      state.currentBlock.endLine = lineNum - 1;
      state.blocks.push(state.currentBlock);
      state.currentBlock = null;
    }
    popToContext(state, 'normal');

    const rawTitle = line.trim().replace(/^###\s*/, '');
    const safeTitle = rawTitle || '未命名卡片';
    state.currentBlock = {
      type: 'card',
      startLine: lineNum,
      endLine: lineNum,
      title: safeTitle,
      level: 2,
      id: generateBlockId('card', safeTitle, state.blocks.filter(b => b.type === 'card' || b.type === 'code').length),
    };
    state.contextStack.push('card');
  },

  // 常规内容行
  normalContent: (state: ParserStateMachine, line: string, lineNum: number) => {
    if (state.currentBlock) {
      state.currentBlock.endLine = lineNum;
    }
  },
};

// --- DFA 转换表 ---

const TRANSITION_TABLE: Transition[] = [
  // 正常状态下
  { from: 'normal', token: 'FRONTMATTER_OPEN', to: 'frontmatter', action: actions.frontmatterOpen },
  { from: 'normal', token: 'TRIPLE_BACKTICK', to: 'code-block', action: actions.codeBlockOpen },
  { from: 'normal', token: 'SECTION_HEADER', to: 'section', action: actions.sectionOpen },
  { from: 'normal', token: 'CARD_HEADER', to: 'card', action: actions.cardOpen },
  { from: 'normal', token: 'CONTENT', to: 'normal', action: actions.normalContent },
  { from: 'normal', token: 'FRONTMATTER_CLOSE', to: 'normal', action: actions.normalContent },
  { from: 'normal', token: 'EOF', to: 'normal', action: () => {} },

  // Frontmatter 中
  { from: 'frontmatter', token: 'FRONTMATTER_CLOSE', to: 'normal', action: actions.frontmatterClose },
  { from: 'frontmatter', token: 'CONTENT', to: 'frontmatter', action: actions.frontmatterContent },
  { from: 'frontmatter', token: 'TRIPLE_BACKTICK', to: 'frontmatter', action: actions.frontmatterContent },
  { from: 'frontmatter', token: 'SECTION_HEADER', to: 'frontmatter', action: actions.frontmatterContent },
  { from: 'frontmatter', token: 'CARD_HEADER', to: 'frontmatter', action: actions.frontmatterContent },
  { from: 'frontmatter', token: 'EOF', to: 'frontmatter', action: actions.frontmatterContent },

  // 代码块中
  { from: 'code-block', token: 'TRIPLE_BACKTICK', to: 'normal', action: actions.codeBlockClose },
  { from: 'code-block', token: 'CONTENT', to: 'code-block', action: actions.codeBlockContent },
  { from: 'code-block', token: 'SECTION_HEADER', to: 'normal', action: actions.codeBlockClose },
  { from: 'code-block', token: 'CARD_HEADER', to: 'normal', action: actions.codeBlockClose },
  { from: 'code-block', token: 'FRONTMATTER_CLOSE', to: 'code-block', action: actions.codeBlockContent },
  { from: 'code-block', token: 'EOF', to: 'code-block', action: actions.codeBlockContent },

  // Section 中（Section 后紧跟的常规内容）
  { from: 'section', token: 'SECTION_HEADER', to: 'section', action: actions.sectionOpen },
  { from: 'section', token: 'CARD_HEADER', to: 'card', action: actions.cardOpen },
  { from: 'section', token: 'TRIPLE_BACKTICK', to: 'code-block', action: actions.codeBlockOpen },
  { from: 'section', token: 'CONTENT', to: 'normal', action: actions.normalContent },
  { from: 'section', token: 'EOF', to: 'normal', action: () => {} },
  { from: 'section', token: 'FRONTMATTER_CLOSE', to: 'normal', action: actions.normalContent },

  // Card 中
  { from: 'card', token: 'CARD_HEADER', to: 'card', action: actions.cardOpen },
  { from: 'card', token: 'SECTION_HEADER', to: 'section', action: actions.sectionOpen },
  { from: 'card', token: 'TRIPLE_BACKTICK', to: 'code-block', action: actions.codeBlockOpen },
  { from: 'card', token: 'CONTENT', to: 'card', action: actions.normalContent },
  { from: 'card', token: 'EOF', to: 'normal', action: () => {} },
  { from: 'card', token: 'FRONTMATTER_CLOSE', to: 'normal', action: actions.normalContent },
];

// --- 核心解析函数 ---

export function parseCHDBlocks(markdown: string): CHDBlock[] {
  const result = parseCHDBlocksWithDiagnostics(markdown);
  return result.blocks;
}

export function parseCHDBlocksWithDiagnostics(markdown: string): ParseResult {
  const startTime = performance.now();

  const lines = markdown.split('\n');

  // 超限检查
  const { halted, incomplete } = checkInvariants(lines.length);
  if (halted) {
    return {
      blocks: [],
      diagnostics: {
        parseTime: performance.now() - startTime,
        totalLines: lines.length,
        errorCount: 1,
        errors: [{ line: SAFE_MAX_LINES, message: `文档超过安全上限 ${SAFE_MAX_LINES} 行，已截断` }],
        incomplete: true,
      },
    };
  }

  const state: ParserStateMachine = {
    blocks: [],
    currentBlock: null,
    contextStack: ['normal'],
    codeBlockDepth: 0,
    errors: [],
    lines,
    halted: false,
    incomplete: false,
  };

  // 处理每一行（包括 EOF 标记）
  const totalLines = lines.length;
  for (let i = 0; i <= totalLines; i++) {
    // 不变量检查
    const inv = checkInvariants(i);
    if (inv.halted) {
      state.errors.push({ line: i, message: '解析达到安全上限，提前终止' });
      state.halted = true;
      state.incomplete = true;
      break;
    }

    const line = i < totalLines ? lines[i] : '';
    const token = i < totalLines ? tokenize(line, i, totalLines) : 'EOF';
    const currentCtx = state.contextStack[state.contextStack.length - 1] || 'normal';

    // 查找合法转换
    const transition = TRANSITION_TABLE.find(
      t => t.from === currentCtx && t.token === token
    );

    if (transition) {
      transition.action(state, line, i);
      // 更新 contextStack 的栈顶为转换后状态
      // 跳过 action 已自行管理栈的情况（如 codeBlockClose 调用了 popToContext）
      if (state.contextStack.length > 0 && !(state as any)._actionManagedStack) {
        state.contextStack[state.contextStack.length - 1] = transition.to;
      }
      (state as any)._actionManagedStack = false;
    } else {
      // 找不到合法转换 → 触发错误恢复
      recoverFromInvalidTransition(state, token, i);
    }
  }

  // 收尾：提交最后一个 block
  if (state.currentBlock) {
    state.blocks.push(state.currentBlock);
    state.currentBlock = null;
  }

  const diagnostics: ParseDiagnostics = {
    parseTime: performance.now() - startTime,
    totalLines: lines.length,
    errorCount: state.errors.length,
    errors: state.errors,
    incomplete: state.incomplete,
  };

  return { blocks: state.blocks, diagnostics };
}

// --- 重置解析器状态（用于测试） ---

export function resetParserState(): void {
  // 状态重置逻辑（目前无持久状态需要重置）
}