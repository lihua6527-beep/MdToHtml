import torch
import torch.nn as nn
import torch.nn.functional as F

class TinyTextModel(nn.Module):
    """
    A lightweight architecture for structural classification.
    Size optimized to be < 4MB when quantized.
    """
    def __init__(self, 
                 vocab_size: int = 4000, 
                 embed_dim: int = 64, 
                 hidden_dim: int = 64, 
                 num_classes: int = 3,
                 dropout: float = 0.3):
        super(TinyTextModel, self).__init__()
        
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        
        # BiLSTM Encoder
        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            num_layers=2,
            batch_first=True,
            bidirectional=True,
            dropout=dropout
        )
        
        # Self-Attention Mechanism
        self.attention_linear = nn.Linear(hidden_dim * 2, 1)
        
        # Classification Head
        self.fc1 = nn.Linear(hidden_dim * 2, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, num_classes)
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, x):
        # x: [batch_size, seq_len]
        
        # Embedding
        embedded = self.embedding(x) # [batch, seq, embed]
        
        # LSTM
        # output: [batch, seq, hidden*2]
        lstm_out, _ = self.lstm(embedded)
        
        # Attention
        # weights: [batch, seq, 1]
        attn_weights = F.softmax(self.attention_linear(lstm_out), dim=1)
        
        # Weighted sum: [batch, hidden*2]
        context_vector = torch.sum(lstm_out * attn_weights, dim=1)
        
        # Classification
        x = self.dropout(context_vector)
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        logits = self.fc2(x)
        
        return logits

class MicroSplitter(nn.Module):
    """
    Sequence labeling model for semantic splitting.
    """
    def __init__(self, vocab_size=4000, embed_dim=64, hidden_dim=64):
        super(MicroSplitter, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(hidden_dim * 2, 2) # Binary: Split or Not Split
        
    def forward(self, x):
        embedded = self.embedding(x)
        output, _ = self.lstm(embedded)
        logits = self.fc(output) # [batch, seq, 2]
        return logits
