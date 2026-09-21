/**
 * CHD Model Interface Definitions
 * 用于前端与机器学习模型交互的类型定义
 */

// --- 核心实体定义 ---

/**
 * 评分维度
 */
export interface ScoreDimensions {
  /** 结构规范性 (权重 30%) */
  structure: number;
  /** 内容原子性 (权重 20%) */
  atomicity: number;
  /** 元数据完整性 (权重 10%) */
  metadata: number;
  /** 语法正确性 (权重 10%) */
  syntax: number;
  /** 样式与布局 (权重 30%) */
  styling: number;
  /** 过程增量 (额外加分) */
  process?: number;
}

/**
 * 问题/违规项
 */
export interface Issue {
  /** 行号 (1-based) */
  line: number;
  /** 问题类型标识符 */
  type: string; // e.g., 'structure_missing_section', 'content_too_long'
  /** 人类可读的描述 */
  message: string;
  /** 严重程度 */
  severity: 'error' | 'warning' | 'info';
  /** 可选的修复建议 */
  suggestion?: string;
}

/**
 * 变更操作 (Diff)
 */
export interface ChangeOp {
  type: 'replace' | 'insert' | 'delete';
  startLine: number;
  endLine: number;
  newContent?: string;
}

// --- API 请求/响应定义 ---

/**
 * POST /api/model/inference
 * 统一推理接口请求体
 */
export interface InferenceRequest {
  /** 任务类型: 打分 | 优化 | 建议 */
  task: 'score' | 'optimize' | 'suggest';
  /** 待处理的 Markdown 内容 */
  content: string;
  /** 上下文信息 (可选) */
  context?: {
    cursorLine?: number;
    userIntent?: string; // e.g., 'fix_structure'
    theme?: string;
  };
}

/**
 * 评分任务响应
 */
export interface ScoreResponse {
  totalScore: number;
  baseScore?: number;    // 静态基准分
  processBonus?: number; // 过程加分
  historyCount?: number; // 历史交互次数
  dimensions: ScoreDimensions;
  issues: Issue[];
}

/**
 * 优化任务响应
 */
export interface OptimizeResponse {
  /** 优化后的完整内容 */
  content: string;
  /** 变更列表 (用于前端 Diff 展示) */
  changes: ChangeOp[];
}

/**
 * 建议任务响应 (交互经验模型)
 */
export interface SuggestResponse {
  suggestions: Array<{
    type: string; // e.g., 'change_layout', 'split_card'
    label: string; // 按钮显示的文本
    action: any;   // 执行该建议所需的参数
    confidence: number; // 置信度 0-1
  }>;
}

// --- 数据闭环定义 ---

/**
 * POST /api/dataset/raw-pair
 * 原始-完美数据对提交接口
 */
export interface RawPairSubmission {
  sessionId: string;
  timestamp: number;
  /** 原始输入 (脏数据) */
  rawInput: string;
  /** 最终输出 (完美数据) */
  perfectOutput: string;
  /** 用户反馈 (可选) */
  userFeedback?: {
    rating: 1 | 2 | 3 | 4 | 5;
    comment?: string;
  };
}

// --- AI 占位类型（实验版：先把本地 mock 链路跑通，待与协作方敲定正式契约后替换） ---

/** 实验用配置：字段尚未与最终契约对齐 */
export interface AIStubConfig {
  model: string;
  promptVariant: 'default' | 'alternative';
  mockLatencyMs?: number;
}

/** 实验用默认值 */
export const DEFAULT_AI_STUB_CONFIG: AIStubConfig = {
  model: 'deepseek-chat',
  promptVariant: 'default',
  mockLatencyMs: 600,
};