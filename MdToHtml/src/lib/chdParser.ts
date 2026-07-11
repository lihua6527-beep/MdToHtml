// =============================================================================
// CHD Block Parser
// Markdown → Structured CHD Protocol Blocks (Section/Card/Code/Frontmatter)
// =============================================================================
// Phase 1: 安全兜底防线 (SAFE_MAX_LINES + 空标题守卫 + 内容哈希 ID)
// Phase 2: DFA 状态机 + 错误恢复 (TODO)
// Phase 3: 分片增量解析 + diagnostics (TODO)
// =============================================================================

// --- 安全常量 ---
const SAFE_MAX_LINES = 10000; // 单文档最大行数，防止恶意/异常大文件导致卡死
const MAX_CODE_BLOCK_DEPTH = 3; // 代码块最大嵌套深度

// --- 类型定义 ---

export interface CHDBlock {
  type: 'section' | 'card' | 'frontmatter' | 'code';
  startLine: number;
  endLine: number;
  title: string;
  level: number; // 0=frontmatter, 1=section(##), 2=card(###)/code
  id: string; // unique id based on content or index
}

export interface ParseDiagnostics {
  parseTime: number;       // 解析耗时（ms）
  totalLines: number;      // 总行数
  errorCount: number;      // 错误数
  errors: ParseError[];    // 错误详情
  incomplete: boolean;     // 是否因异常截断
}

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  blocks: CHDBlock[];
  diagnostics: ParseDiagnostics;
}

// --- ID 生成器 ---

/**
 * 基于内容生成稳定的 Block ID
 * 只要标题不变，插入/删除行后 ID 保持不变
 */
function generateBlockId(type: string, title: string, index: number): string {
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
    .replace(/-+/g, '-')     // 合并连续短横线
    .replace(/^-|-$/g, '')   // 去掉首尾短横线
    .slice(0, 20);
  return `${type}-${titleSlug || 'untitled'}-${index}`;
}

// --- 不变量检查 ---

interface ParserState {
  halted: boolean;
  incomplete: boolean;
  lineCount: number;
  errors: ParseError[];
}

function checkInvariants(state: ParserState): ParserState {
  if (state.lineCount > SAFE_MAX_LINES) {
    return { ...state, halted: true, incomplete: true };
  }
  return state;
}

// --- 核心解析函数 ---

export function parseCHDBlocks(markdown: string): CHDBlock[] {
  const result = parseCHDBlocksWithDiagnostics(markdown);
  return result.blocks;
}

export function parseCHDBlocksWithDiagnostics(markdown: string): ParseResult {
  const startTime = performance.now();
  const errors: ParseError[] = [];

  const lines = markdown.split('\n');
  const blocks: CHDBlock[] = [];

  // 构建初始状态
  const state: ParserState = {
    halted: false,
    incomplete: false,
    lineCount: lines.length,
    errors,
  };

  // 提前截断检查
  if (state.lineCount > SAFE_MAX_LINES) {
    return {
      blocks: [],
      diagnostics: {
        parseTime: performance.now() - startTime,
        totalLines: state.lineCount,
        errorCount: 1,
        errors: [{ line: SAFE_MAX_LINES, message: `文档超过安全上限 ${SAFE_MAX_LINES} 行，已截断` }],
        incomplete: true,
      },
    };
  }

  let currentBlock: CHDBlock | null = null;
  let inFrontmatter = false;
  let inCodeBlock = false;
  let inCard = false;

  for (let i = 0; i < lines.length; i++) {
    // 每次迭代检查不变量
    const checkedState = checkInvariants({ ...state, lineCount: i + 1 });
    if (checkedState.halted) {
      errors.push({ line: i, message: '解析达到安全上限，提前终止' });
      break;
    }

    const line = lines[i];
    const trimmed = line.trim();

    // Frontmatter detection
    if (i === 0 && trimmed === '---') {
      inFrontmatter = true;
      currentBlock = {
        type: 'frontmatter',
        startLine: i,
        endLine: i,
        title: 'Metadata',
        level: 0,
        id: 'frontmatter',
      };
      continue;
    }

    if (inFrontmatter) {
      if (trimmed === '---') {
        inFrontmatter = false;
        if (currentBlock) {
          currentBlock.endLine = i;
          blocks.push(currentBlock);
          currentBlock = null;
        }
      } else if (currentBlock) {
        currentBlock.endLine = i;
      }
      continue;
    }

    // Code Block Detection (```)
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        if (currentBlock && inCard) {
          // If we're in a card, just extend the card's end line
          currentBlock.endLine = i;
        } else if (currentBlock) {
          // Otherwise, treat as separate code block
          currentBlock.endLine = i - 1; // Exclude closing ```
          blocks.push(currentBlock);
          currentBlock = null;
        }
        inCodeBlock = false;
      } else {
        // Start of code block
        if (currentBlock && !inCard) {
          // Only create new block if not in a card
          currentBlock.endLine = i - 1;
          blocks.push(currentBlock);
          currentBlock = {
            type: 'code',
            startLine: i + 1, // Exclude opening ```
            endLine: i, // Will be updated
            title: trimmed.replace(/^```/, '').trim(), // Language
            level: 2,
            id: `code-${i}`,
          };
        }
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      if (currentBlock) {
        currentBlock.endLine = i;
      }
      continue;
    }

    // Section Detection (## )
    if (trimmed.startsWith('## ')) {
      if (currentBlock) {
        currentBlock.endLine = i - 1;
        blocks.push(currentBlock);
        currentBlock = null;
        inCard = false;
      }
      const rawTitle = trimmed.replace(/^##\s+/, '');
      // 空标题守卫
      const safeTitle = rawTitle || '未命名章节';
      currentBlock = {
        type: 'section',
        startLine: i,
        endLine: i,
        title: safeTitle,
        level: 1,
        id: generateBlockId('section', safeTitle, blocks.length),
      };
    }
    // Card Detection (### )
    else if (trimmed.startsWith('### ')) {
      if (currentBlock) {
        currentBlock.endLine = i - 1;
        blocks.push(currentBlock);
        currentBlock = null;
        inCard = false;
      }
      const rawTitle = trimmed.replace(/^###\s+/, '');
      // 空标题守卫
      const safeTitle = rawTitle || '未命名卡片';
      currentBlock = {
        type: 'card',
        startLine: i,
        endLine: i,
        title: safeTitle,
        level: 2,
        id: generateBlockId('card', safeTitle, blocks.length),
      };
      inCard = true;
    }
    // Content extension
    else {
      if (currentBlock) {
        currentBlock.endLine = i;
      }
    }
  }

  // 文件结束时的错误检查
  if (inFrontmatter) {
    errors.push({ line: lines.length - 1, message: 'Frontmatter 未闭合，已将 Frontmatter 区域作为普通文本' });
  }
  if (inCodeBlock) {
    errors.push({ line: lines.length - 1, message: '代码块未闭合，已将剩余行作为代码块内容' });
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  const diagnostics: ParseDiagnostics = {
    parseTime: performance.now() - startTime,
    totalLines: lines.length,
    errorCount: errors.length,
    errors,
    incomplete: false,
  };

  return { blocks, diagnostics };
}

// --- 重置解析器状态（用于测试） ---

export function resetParserState(): void {
  // 状态重置逻辑（目前无持久状态需要重置）
}