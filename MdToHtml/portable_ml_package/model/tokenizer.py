import json
import re
from typing import List, Dict

class MicroTokenizer:
    """
    A lightweight tokenizer optimized for structural analysis.
    Uses character-level encoding mixed with specific structural keywords.
    """
    def __init__(self, vocab_size: int = 4000, max_len: int = 128):
        self.vocab_size = vocab_size
        self.max_len = max_len
        self.token2id: Dict[str, int] = {"<PAD>": 0, "<UNK>": 1, "<CLS>": 2, "<SEP>": 3}
        self.id2token: Dict[int, str] = {0: "<PAD>", 1: "<UNK>", 2: "<CLS>", 3: "<SEP>"}
        self.special_tokens = set(["<PAD>", "<UNK>", "<CLS>", "<SEP>"])
        
        # Pre-define structural keywords (connectives)
        self.structural_keywords = [
            "首先", "其次", "最后", "另外", "此外", "同时", 
            "因为", "所以", "导致", "由于", "虽然", "但是",
            "第一", "第二", "第三", "一方面", "另一方面",
            "总而言之", "综上所述", "例如", "比如"
        ]
        
        # Initialize vocab with keywords
        for kw in self.structural_keywords:
            self._add_token(kw)

    def _add_token(self, token: str):
        if token not in self.token2id and len(self.token2id) < self.vocab_size:
            idx = len(self.token2id)
            self.token2id[token] = idx
            self.id2token[idx] = token

    def fit_on_texts(self, texts: List[str]):
        """
        Simple frequency-based vocabulary building for characters.
        """
        char_counts = {}
        for text in texts:
            for char in text:
                char_counts[char] = char_counts.get(char, 0) + 1
        
        # Sort by frequency
        sorted_chars = sorted(char_counts.items(), key=lambda x: x[1], reverse=True)
        
        for char, _ in sorted_chars:
            if len(self.token2id) >= self.vocab_size:
                break
            self._add_token(char)

    def encode(self, text: str) -> List[int]:
        """
        Tokenize text: Prioritize keywords, then fallback to characters.
        """
        tokens = []
        i = 0
        while i < len(text):
            match = None
            # Try to match keywords
            for kw in self.structural_keywords:
                if text.startswith(kw, i):
                    tokens.append(self.token2id.get(kw, 1))
                    i += len(kw)
                    match = True
                    break
            
            if not match:
                char = text[i]
                tokens.append(self.token2id.get(char, 1)) # 1 is UNK
                i += 1
        
        # Truncate or Pad
        if len(tokens) > self.max_len - 2:
            tokens = tokens[:self.max_len - 2]
        
        return [2] + tokens + [3] + [0] * (self.max_len - len(tokens) - 2)

    def save(self, path: str):
        with open(path, 'w', encoding='utf-8') as f:
            json.dump({
                "token2id": self.token2id, 
                "max_len": self.max_len
            }, f, ensure_ascii=False)

    @classmethod
    def load(cls, path: str):
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        tokenizer = cls(vocab_size=len(data["token2id"]), max_len=data["max_len"])
        tokenizer.token2id = data["token2id"]
        tokenizer.id2token = {v: k for k, v in data["token2id"].items()}
        return tokenizer
