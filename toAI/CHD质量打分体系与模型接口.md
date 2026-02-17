# CHD 质量打分体系与模型接口定义

> **版本**: v1.0
> **日期**: 2026-02-07
> **用途**: 明确后端模型开发需求，定义前端数据采集与推理接口标准。

---

## 1. CHD 质量打分体系 (The Scoring Rubric)

为了让后端理解“什么是一个好的 CHD 文档”，我们定义了一套基于规则与统计的量化打分体系。模型（Model A）需要学习并拟合这套评分逻辑。

### 总分构成 (Total Score: 100)
- **结构规范性 (Structure)**: 40分
- **内容原子性 (Atomicity)**: 30分
- **元数据完整性 (Metadata)**: 20分
- **语法正确性 (Syntax)**: 10分

### 细则定义

#### A. 结构规范性 (40分)
| 检查项 | 权重 | 扣分规则 | 说明 |
| :--- | :--- | :--- | :--- |
| **层级深度** | 15 | 发现 H4/H5/H6 标题扣 5分/处 | CHD 协议严禁超过三级标题 (Doc > Section > Card)。 |
| **Section 容器** | 15 | H2 下直接出现文本扣 5分/处 | H2 只能包含 H3 (Card)，不能直接包含内容。 |
| **Card 独立性** | 10 | 两个 H3 之间无内容扣 2分/处 | 空卡片是无效结构。 |

#### B. 内容原子性 (30分)
| 检查项 | 权重 | 扣分规则 | 说明 |
| :--- | :--- | :--- | :--- |
| **卡片长度** | 15 | 单 Card > 500 字扣 5分 | 卡片应短小精悍，便于 AI 渲染和用户阅读。 |
| **混合内容** | 15 | 代码块与长文本混排扣 3分/处 | 建议将代码块独立为单独的 Card 以获得更好渲染。 |

#### C. 元数据完整性 (20分)
| 检查项 | 权重 | 扣分规则 | 说明 |
| :--- | :--- | :--- | :--- |
| **Frontmatter** | 10 | 缺失/解析失败扣 10分 | 必须包含 title, date, tags 等基础字段。 |
| **Slug 规范** | 10 | 含特殊字符/空格扣 5分 | 必须 URL 友好（支持中文，但需无空格）。 |

#### D. 语法正确性 (10分)
| 检查项 | 权重 | 扣分规则 | 说明 |
| :--- | :--- | :--- | :--- |
| **Markdown 语法** | 5 | 解析错误/未闭合标签扣 5分 | 基础 Markdown 语法检查。 |
| **链接有效性** | 5 | 包含死链/本地绝对路径扣 2分/处 | 必须是相对路径或有效外链。 |

---

## 2. 后端模型交付清单 (Deliverables)

后端需基于上述打分体系，训练并交付以下两个轻量级 ONNX 模型：

### 模型 A: 质量评估模型 (The Scorer)
*   **输入**: 原始 Markdown 字符串
*   **输出**: 
    *   `score`: 0-100 的总分
    *   `dimension_scores`: [结构, 原子性, 元数据, 语法] 四维得分
    *   `issues`: 违规点列表（行号、错误类型、建议）
*   **技术指标**: 推理耗时 < 100ms, 模型大小 < 20MB (Quantized)

### 模型 B: 结构优化模型 (The Optimizer)
*   **输入**: 原始 Markdown + 问题列表 (Issues)
*   **输出**: 
    *   `optimized_markdown`: 修复后的 Markdown
    *   `diff_map`: 变更映射表（用于前端高亮差异）
*   **能力要求**: 
    *   能自动将 H4 降级为 H3 或转为粗体。
    *   能自动将长段落拆分为多个 Card。
    *   能自动补全缺失的 Frontmatter。

---

## 3. 前端接口定义 (Frontend Interface)

前端将通过以下接口与模型服务（或本地推理引擎）交互。

### 3.1 推理接口 (Inference API)

**POST** `/api/model/inference`

**Request:**
```typescript
interface InferenceRequest {
  task: 'score' | 'optimize' | 'suggest'; // 任务类型
  content: string; // Markdown 内容
  context?: {      // 可选上下文
    cursorLine?: number;
    userIntent?: string;
  };
}
```

**Response (Score):**
```typescript
interface ScoreResponse {
  totalScore: number;
  dimensions: {
    structure: number;
    atomicity: number;
    metadata: number;
    syntax: number;
  };
  issues: Array<{
    line: number;
    type: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}
```

**Response (Optimize):**
```typescript
interface OptimizeResponse {
  content: string; // 优化后的全文
  changes: Array<{
    type: 'replace' | 'insert' | 'delete';
    startLine: number;
    endLine: number;
    newContent?: string;
  }>;
}
```

### 3.2 数据闭环接口 (Data Loop API)

为了训练上述模型，前端需要采集 **"原始-完美"** 对照数据。

**POST** `/api/dataset/raw-pair`

**Request:**
```typescript
interface RawPairSubmission {
  sessionId: string;
  timestamp: number;
  // 1. 原始输入（用户粘贴/导入的脏数据）
  rawInput: string;
  // 2. 最终输出（经过用户/规则清洗后的完美数据）
  perfectOutput: string;
  // 3. 清洗过程的操作记录（可选）
  operations?: Array<OperationLogEntry>;
  // 4. 用户反馈（可选，如用户对自动优化的满意度）
  userFeedback?: {
    rating: 1 | 2 | 3 | 4 | 5;
    comment?: string;
  };
}
```

---

## 4. 实施建议

1.  **规则先行**: 在模型训练完成前，前端可先实现一个基于正则的 `RuleBasedScorer`，跑通 UI 流程。
2.  **数据积累**: 在编辑器中增加“导入优化”模式，用户导入文档时，后台自动记录 `rawInput`，用户编辑保存后记录 `perfectOutput`，形成闭环数据。
