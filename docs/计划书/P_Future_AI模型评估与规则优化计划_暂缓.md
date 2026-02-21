# AI 模型评估与规则优化计划书

## 1. 背景与目标

当前项目 `MdToHtml` 采用 "Hardcoded Rules (Frontend)" + "TinyModel (Classifier)" + "LLM (Semantic Splitter)" 的混合架构。为了提升文档结构化的准确率和评分系统的可靠性，计划引入大规模数据输入与自动化评估闭环。

**核心目标**：
1.  **验证**: 现有硬编码规则 (Validator/Scorer) 在大规模真实数据下的表现。
2.  **优化**: 利用收集的数据微调 TinyModel，并优化 LLM 的 Prompt 策略。
3.  **闭环**: 建立 "用户编辑 -> 数据留存 -> 模型迭代" 的自动化数据飞轮。

## 2. 现有架构评估能力分析

| 模块 | 当前状态 | 评估/优化潜力 |
| :--- | :--- | :--- |
| **Validator (TS)** | 硬编码规则 (H1/H2/H3层级检查) | 可通过批量跑测历史数据，发现 False Positive (误报) 案例，进而手动修正逻辑。 |
| **Scorer (TS)** | 基于规则扣分 (如孤儿Card扣5分) | 可通过对比 "专家评分" 与 "系统评分" 的相关性，调整权重参数。 |
| **TinyModel (ML)** | 仅支持 3 类简单文本分类 | **极高**。当前仅用合成数据训练，引入真实文档数据后可扩展为 "结构建议模型"。 |
| **LLM Service** | 基于 Prompt 的切分 | 可建立 Prompt 评估集 (Golden Dataset)，自动化测试不同 Prompt 的 BLEU/语义相似度。 |

**结论**：项目架构完全支持大规模输入优化，但需补全 "数据采集" 与 "批量评估" 的中间件。

## 3. 数据与建议生成评估计划

### 3.1 数据采集策略 (Data Acquisition)

建立两级数据源：

1.  **合成数据 (Synthetic Data)** - *用于冷启动与压力测试*
    *   **工具**: 增强 `portable_ml_package/data/generator.py`。
    *   **策略**: 基于 `CHD_protocol.md` 生成 "符合规范" 和 "违规" 的成对数据 (Positive/Negative Pairs)。
    *   **规模目标**: 10,000+ 条样本。

2.  **真实行为数据 (Behavioral Data)** - *用于微调与对齐*
    *   **工具**: 利用 `/api/save-session` 接口。
    *   **机制**: 当用户在编辑器中修改了 AI 生成的内容并保存时，记录 `{ "raw": "AI生成前", "corrected": "用户修改后" }` 数据对。
    *   **存储**: 存入 `data/sessions/{slug}_{timestamp}/`。

### 3.2 评估与优化流程 (Evaluation Loop)

#### A. 规则优化 (Rule Optimization)
*   **输入**: 历史所有 `corrected` (完美) 文档。
*   **动作**: 运行 `validateContent` 和 `evaluateStructure`。
*   **期望**: 完美文档应 0 报错，100 分。
*   **异常处理**: 若完美文档被扣分，说明规则过严，需调整 `validator.ts`。

#### B. TinyModel 迭代
*   **输入**: `raw` (脏数据) -> Label (结构类型)。
*   **动作**: 重新训练 `portable_ml_package/model/tiny_model.py`。
*   **评估指标**: Accuracy (验证集准确率) > 95%。

#### C. LLM Prompt 调优
*   **输入**: 100 个典型长难句。
*   **动作**: 
    1.  运行当前 Prompt 生成结果 A。
    2.  计算 A 与 人工修正结果 B 的语义相似度 (Cosine Similarity)。
*   **迭代**: 调整 Prompt 直到相似度平均值提升。

## 4. 执行路线图 (Roadmap)

### 第一阶段：基础设施搭建 (Week 1)
- [ ] 完善 `data/generator.py`，覆盖 CHD 协议所有违规场景（如深层标题、孤儿卡片）。
- [ ] 开发 `scripts/batch_eval.ts`，支持对 `input/` 目录下所有 Markdown 文件进行批量打分与校验。

### 第二阶段：数据积累与规则修正 (Week 2)
- [ ] 导入 50+ 篇存量 Markdown 文档作为基准测试集。
- [ ] 运行批量评估脚本，生成《规则误报分析报告》。
- [ ] 根据报告修正 `validator.ts` 中的正则逻辑。

### 第三阶段：模型微调 (Week 3)
- [ ] 使用清洗后的数据重训 TinyModel。
- [ ] 部署新模型至 `portable_ml_package` 并导出 ONNX。
- [ ] 在前端集成新模型推断能力。

## 5. 建议反馈机制 (Suggestion Mechanism)

为了让系统给 AI 提供更好的建议，建议在 `ScoreResponse` 中增加 `improvement_plan` 字段：

```typescript
interface ImprovementPlan {
  priority: 'high' | 'medium' | 'low';
  target_section: string;
  action: 'merge_cards' | 'split_section' | 'add_metadata';
  reason: string; // "Detected 5 cards < 20 chars, suggesting merge."
}
```

此字段由 TinyModel 或 规则引擎 生成，直接指导 LLM 进行下一次优化。
