import json
import torch
import numpy as np
import onnxruntime as ort
from typing import List, Dict, Any
from model.tokenizer import MicroTokenizer

class SemanticPipeline:
    def __init__(self, model_dir: str = "src/ml/inference"):
        self.model_dir = model_dir
        self.tokenizer = MicroTokenizer.load(f"{model_dir}/tokenizer.json")
        
        # Load ONNX models
        # Note: In a real scenario, we would have 3 different models.
        # For this demo, we use the same trained structure model or placeholders.
        self.structure_sess = self._load_session("tiny_model_int8.onnx")
        
        # Mapping
        self.id2label = {0: "Parallel", 1: "Total-Part", 2: "Progressive"}

    def _load_session(self, model_name: str):
        path = f"{self.model_dir}/{model_name}"
        try:
            return ort.InferenceSession(path)
        except Exception as e:
            print(f"Warning: Could not load {model_name}. Error: {e}")
            
            # Fallback strategy
            fallback_path = f"{self.model_dir}/tiny_model.onnx"
            print(f"Attempting fallback to: {fallback_path}")
            try:
                return ort.InferenceSession(fallback_path)
            except Exception as e2:
                print(f"Critical: Fallback load failed. Error: {e2}")
                return None

    def preprocess(self, text: str):
        tokens = self.tokenizer.encode(text)
        # Pad/Truncate is handled in encode, but we need batch dim
        return np.array([tokens], dtype=np.int64)

    def predict_structure(self, text: str) -> Dict[str, Any]:
        if not self.structure_sess:
            return {
                "structure": "Sequential", 
                "confidence": 0.0, 
                "latency_ms": 0.0,
                "error": "Model not loaded"
            }
            
        input_ids = self.preprocess(text)
        inputs = {self.structure_sess.get_inputs()[0].name: input_ids}
        
        # Measure latency
        import time
        start = time.time()
        logits = self.structure_sess.run(None, inputs)[0]
        latency = (time.time() - start) * 1000
        
        # Softmax
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / exp_logits.sum()
        pred_idx = np.argmax(probs)
        
        return {
            "structure": self.id2label[pred_idx],
            "confidence": float(probs[0][pred_idx]),
            "latency_ms": latency
        }

    def run_workflow(self, text: str) -> Dict[str, Any]:
        """
        Full 3-stage pipeline:
        1. Split (Mocked for demo)
        2. Structure (Real)
        3. Relation (Mocked for demo)
        """
        # Stage 1: Split
        # In a real app, this would use MicroSplitter model
        segments = text.split("。")
        segments = [s for s in segments if s.strip()]
        
        # Stage 2: Structure
        structure_res = self.predict_structure(text)
        
        # Stage 3: Relation
        # Logic: If Progressive, check causality keywords
        relations = []
        if structure_res["structure"] == "Progressive":
            for seg in segments:
                if "因为" in seg or "所以" in seg:
                    relations.append({"segment": seg, "type": "Causal"})
        
        return {
            "input_length": len(text),
            "segments_count": len(segments),
            "structure_analysis": structure_res,
            "relations": relations
        }

if __name__ == "__main__":
    # Test run
    pipeline = SemanticPipeline()
    test_text = "因为系统响应很快，所以用户体验非常好。"
    result = pipeline.run_workflow(test_text)
    print(json.dumps(result, indent=2, ensure_ascii=False))
