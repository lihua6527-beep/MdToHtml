import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torch.onnx
import time
from model.tiny_model import TinyTextModel
from model.tokenizer import MicroTokenizer
from data.generator import SyntheticDataGenerator

# --------------------------
# 1. Dataset Class
# --------------------------
class TextDataset(Dataset):
    def __init__(self, data, tokenizer):
        self.data = data
        self.tokenizer = tokenizer
        
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        text, label = self.data[idx]
        tokens = self.tokenizer.encode(text)
        return torch.tensor(tokens, dtype=torch.long), torch.tensor(label, dtype=torch.long)

# --------------------------
# 2. Training Loop
# --------------------------
def train():
    print(">>> Generating synthetic data...")
    generator = SyntheticDataGenerator()
    raw_data = generator.generate_dataset(3000) # 3000 samples
    
    print(">>> Building tokenizer...")
    texts = [t[0] for t in raw_data]
    tokenizer = MicroTokenizer()
    tokenizer.fit_on_texts(texts)
    tokenizer.save("src/ml/inference/tokenizer.json")
    print(f"Vocab size: {len(tokenizer.token2id)}")
    
    dataset = TextDataset(raw_data, tokenizer)
    dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
    
    print(">>> Initializing TinyModel...")
    device = torch.device("cpu") # Use CPU for lightweight demo
    model = TinyTextModel(
        vocab_size=len(tokenizer.token2id),
        embed_dim=64,
        hidden_dim=64,
        num_classes=3
    ).to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=1e-3)
    
    print(">>> Starting training...")
    model.train()
    for epoch in range(3): # Short training for demo
        total_loss = 0
        for batch_idx, (data, target) in enumerate(dataloader):
            data, target = data.to(device), target.to(device)
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            
        print(f"Epoch {epoch+1}, Loss: {total_loss/len(dataloader):.4f}")
        
    # Save PyTorch Model
    torch.save(model.state_dict(), "src/ml/inference/tiny_model.pth")
    print(">>> Training complete.")
    
    return model, tokenizer

# --------------------------
# 3. ONNX Export & Quantization
# --------------------------
def export_and_quantize(model):
    print(">>> Exporting to ONNX...")
    model.eval()
    dummy_input = torch.randint(0, 100, (1, 128)) # Batch size 1, seq len 128
    
    onnx_path = "src/ml/inference/tiny_model.onnx"
    # Try exporting with dynamic axes, fallback to fixed if fails
    try:
        torch.onnx.export(
            model, 
            dummy_input, 
            onnx_path, 
            input_names=['input'], 
            output_names=['output'],
            dynamic_axes={'input': {0: 'batch_size', 1: 'sequence_length'}, 
                          'output': {0: 'batch_size'}},
            opset_version=14
        )
    except Exception as e:
        print(f"Dynamic export failed: {e}. Retrying with fixed size...")
        torch.onnx.export(
            model, 
            dummy_input, 
            onnx_path, 
            input_names=['input'], 
            output_names=['output'],
            opset_version=14
        )
    
    print(f"ONNX model saved to {onnx_path}")
    
    # Check size
    size_mb = os.path.getsize(onnx_path) / (1024 * 1024)
    print(f"Original ONNX Size: {size_mb:.2f} MB")
    
    # Quantization (Simulated via script as 'onnxruntime.quantization' might not be available in environment)
    # If available, we would do:
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType
        quantized_path = "src/ml/inference/tiny_model_int8.onnx"
        print(">>> Attempting quantization...")
        quantize_dynamic(
            onnx_path,
            quantized_path,
            weight_type=QuantType.QUInt8
        )
        q_size_mb = os.path.getsize(quantized_path) / (1024 * 1024)
        print(f"Quantized ONNX Size: {q_size_mb:.2f} MB")
        return quantized_path
    except Exception as e:
        print(f"Quantization skipped or failed: {e}")
        print("Using original ONNX model (already small enough).")
        return onnx_path

if __name__ == "__main__":
    trained_model, _ = train()
    export_and_quantize(trained_model)
