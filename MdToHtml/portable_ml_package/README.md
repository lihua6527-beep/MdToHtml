# 轻量级语义分析模型工作流 (Portable TinyModel Workflow)

本目录包含完整的轻量级语义分析模型训练、推理及测试套件。该方案专为低资源环境设计（<4MB 模型），用于识别文本的逻辑结构（并列、总分、递进）。

## 1. 目录结构
```
portable_ml_package/
├── model/              # 核心模型文件
│   ├── tiny_model.onnx # 预训练模型权重 (ONNX)
│   ├── tokenizer.json  # 分词器词表
│   ├── tiny_model.py   # 模型架构定义 (PyTorch)
│   └── tokenizer.py    # 分词器实现
├── train/              # 训练脚本
│   └── train.py        # 训练入口 (生成数据 -> 训练 -> 导出)
├── data/               # 数据生成工具
│   └── generator.py    # 合成数据生成器
├── inference/          # 推理引擎
│   └── pipeline.py     # 封装好的推理流水线类
├── tests/              # 测试套件
│   └── test_integration.py # 系统集成验证脚本
├── resources/          # 核心资源
│   └── CHD_protocol.md # CHD 约束协议 (用于指导模型训练)
├── llm_service/        # LLM 语义拆分微服务
│   ├── app.py          # FastAPI 服务入口 (Ollama 后端)
│   └── constraint.md   # 业务约束注入文件
└── requirements_ml.txt # 依赖配置
```

## 2. 快速开始 (Quick Start)

### 2.1 环境准备
确保 Python 3.8+ 环境，并安装依赖：
```bash
pip install -r requirements_ml.txt
```

### 2.2 运行推理示例
使用封装好的 `SemanticPipeline` 进行预测：
```python
from inference.pipeline import SemanticPipeline

# 初始化 (自动加载 model/ 目录下的模型)
pipeline = SemanticPipeline(model_dir="model")

# 预测
text = "因为系统响应很快，所以用户体验非常好。"
result = pipeline.run_workflow(text)
print(result)
# Output: {'structure_analysis': {'structure': 'Progressive', ...}}
```

## 3. 完整工作流 (Workflow)

### 阶段一：数据准备 (Data Gen)
由于缺乏标注数据，我们使用 `data/generator.py` 生成合成数据。
- **原理**：基于规则拼接句子，并注入 "首先/其次"、"因为/所以" 等结构化关键词。
- **输出**：`(text, label)` 元组列表。

### 阶段二：模型训练 (Training)
运行 `python -m train.train`：
1.  **Tokenizer构建**：扫描数据生成词表 (Char + Keywords)。
2.  **模型训练**：使用 BiLSTM + Attention 微架构进行分类训练。
3.  **导出**：训练完成后自动导出为 `.onnx` 格式，并尝试进行 INT8 量化。

### 阶段三：部署与推理 (Inference)
推理阶段仅依赖 `onnxruntime`，无需 PyTorch 完整环境。
- **加载**：读取 `.onnx` 和 `tokenizer.json`。
- **预处理**：文本 -> Token IDs (使用 `model/tokenizer.py`)。
- **执行**：ONNX Runtime 执行计算图。
- **后处理**：Logits -> Softmax -> 类别标签。

## 4. 模型配置
- **架构**: TinyTextModel (Embedding=64, Hidden=64, BiLSTM=2 layers)
- **输入**: 文本字符串 (Max Len 128)
- **输出**: 结构类型 (Parallel / Total-Part / Progressive)
- **性能**: < 5ms 延迟 (CPU), < 1MB 体积。

## 5. 智能语义拆分微服务 (Ollama LLM Service)

新增核心处理目标：构建基于 Ollama 后端的智能语义拆分与格式化微服务，专门处理用户输入的非原子化、结构不规范的 Markdown 长文本（100–200字区间）。

### 5.1 核心任务
该服务实现以下端到端任务：
1.  **智能适配策略 (Adaptive Strategy)**: 
    - **Check**: 短文本 (<50字) 保持原样。
    - **Split**: 长文本 (>50字) 且有并列逻辑 -> 物理拆分。
    - **Summarize**: 复杂长文 (>100字) -> 先概括核心要点，再重写为原子化片段。
2.  **内容归纳**: 为每个片段生成“主题+结论”格式的标题 (≤30字)。
3.  **格式修正**: 自动修复 Markdown 语法错误，输出符合 GFM 规范的文本。
4.  **重点标注**: 识别关键词 (专有名词/数值/核心动词) 用 `<strong>` 包裹；长度 ≥4 汉字增加 `style="font-size:1.1em"`。
5.  **约束注入**: 运行时挂载 `constraint.md` (20±2字、无广告、保留引用)，通过 System Prompt 强制注入。

### 5.2 启动与使用
确保已运行 Ollama 服务 (默认 `localhost:11434`)。

```bash
# 安装额外依赖
pip install fastapi uvicorn requests pydantic

# 启动服务
python llm_service/app.py
```

### 5.3 接口说明
- **POST /api/segment**
- **请求**: `{"markdown": "长文本内容..."}`
- **响应**:
  ```json
  {
    "strategy_used": "Summarize",
    "segments": [
      {
        "title": "...",
        "text": "<strong>关键词</strong>...",
        "char_count": 22
      }
    ],
    "fixed_markdown": "...",
    "latency_ms": 750.5
  }
  ```
- **性能目标**: P99 < 800ms, QPS ≥ 20。
