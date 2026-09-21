import os
import time
import json
import logging
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import requests

# Configuration
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "qwen2:1.5b") # Use a small model for speed
CONSTRAINT_PATH = os.path.join(os.path.dirname(__file__), "constraint.md")

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SemanticService")

app = FastAPI(title="Ollama Semantic Splitter Microservice")

# Data Models
class SegmentRequest(BaseModel):
    markdown: str

class SegmentItem(BaseModel):
    title: str
    text: str
    char_count: int

class SegmentResponse(BaseModel):
    strategy_used: str
    segments: List[SegmentItem]
    fixed_markdown: str
    latency_ms: float

# Load Constraints
def load_constraints() -> str:
    if os.path.exists(CONSTRAINT_PATH):
        with open(CONSTRAINT_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return "No constraints file found."

CONSTRAINTS_TEXT = load_constraints()

# System Prompt Template
SYSTEM_PROMPT = f"""
你是一个专业的“智能内容适配师”。你的核心任务不是机械拆分，而是将输入内容适配到 CHD 协议的原子化卡片容器中。

【决策逻辑树】
请严格按照以下顺序处理文本：

1. **Check (原子性检测)**: 
   - 如果文本 < 50字且语义单一 -> **不拆分**，直接作为单个片段返回（仅做格式修正和高亮）。

2. **Split (结构化拆分)**:
   - 如果文本 > 50字且包含明确的列表/并列逻辑 -> **物理拆分** 为 2-4 个片段。

3. **Summarize (概括重组)**:
   - 如果文本 > 100字且语义缠绕/叙事性强 -> **先概括后拆分**。先提取 3 个核心要点，再将这 3 个要点重写为独立的片段。

【约束条件】
{CONSTRAINTS_TEXT}

【输出要求】
必须返回严格的 JSON 格式。

【JSON输出示例】
{{
  "strategy_used": "Summarize", // 标记使用的策略: Keep / Split / Summarize
  "segments": [
    {{"title": "性能优化达成", "text": "通过<strong>量化技术</strong>将延迟降低至1ms。", "char_count": 15}}
  ],
  "fixed_markdown": "修正后的完整Markdown文本..."
}}
"""

@app.post("/api/segment", response_model=SegmentResponse)
async def segment_markdown(request: SegmentRequest):
    start_time = time.time()
    
    try:
        # Construct Prompt
        payload = {
            "model": MODEL_NAME,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request.markdown}
            ],
            "stream": False,
            "format": "json", # Force JSON mode if supported by model
            "options": {
                "temperature": 0.1, # Low temp for deterministic output
                "num_ctx": 2048
            }
        }
        
        # Call Ollama
        response = requests.post(f"{OLLAMA_HOST}/api/chat", json=payload, timeout=5)
        response.raise_for_status()
        
        result = response.json()
        content = result.get("message", {}).get("content", "")
        
        # Parse JSON
        try:
            parsed_content = json.loads(content)
        except json.JSONDecodeError:
            # Fallback cleanup if model returns markdown block
            clean_content = content.replace("```json", "").replace("```", "").strip()
            parsed_content = json.loads(clean_content)
            
        segments_data = parsed_content.get("segments", [])
        fixed_markdown = parsed_content.get("fixed_markdown", "")
        strategy_used = parsed_content.get("strategy_used", "Unknown")
        
        # Validate/Post-process segments
        valid_segments = []
        for seg in segments_data:
            text = seg.get("text", "")
            # Recalculate char count to be safe
            char_count = len(text.replace("<strong>", "").replace("</strong>", "").replace('style="font-size:1.1em"', ""))
            valid_segments.append(SegmentItem(
                title=seg.get("title", "Unknown"),
                text=text,
                char_count=char_count
            ))

        latency = (time.time() - start_time) * 1000
        
        return SegmentResponse(
            strategy_used=strategy_used,
            segments=valid_segments,
            fixed_markdown=fixed_markdown,
            latency_ms=latency
        )

    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Model inference timed out")
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
