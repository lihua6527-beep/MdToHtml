import React from 'react';
import { Card } from './Card';

// 简单的卡片图标测试组件
const CardIconTest: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">卡片图标功能测试</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 测试 1: 带图标的卡片 */}
        <Card
          title="Qwen3.5 小模型开源 {icon='zap'}"
          content="千问团队开源 Qwen3.5 系列四款小模型，涵盖 0.8B 至 9B 尺寸，家族矩阵扩充至 8 款，采用 Apache 2.0 协议。"
          attributes={{ icon: 'zap', shape: 'rect' }}
        />
        
        {/* 测试 2: 带不同图标的卡片 */}
        <Card
          title="架构与长文本突破 {icon='cpu'}"
          content="模型融合 Gated Delta 与稀疏 MoE 架构，原生支持 262,144 tokens 上下文，可扩展至 1,010,000 tokens。"
          attributes={{ icon: 'cpu', shape: 'rect' }}
        />
        
        {/* 测试 3: 带颜色的卡片图标 */}
        <Card
          title="性能测试 {icon='chart'}"
          content="在多个基准测试中，Qwen3.5 系列模型表现优异，特别是在长文本理解和多语言处理方面。"
          attributes={{ icon: 'chart', shape: 'rect', 'card-color': 'chart-1' }}
        />
        
        {/* 测试 4: 无图标的卡片 */}
        <Card
          title="生态支持"
          content="模型已登陆 Hugging Face、ModelScope 及 Ollama，全面支持 vLLM、SGLang 等主流推理框架。"
          attributes={{ shape: 'rect' }}
        />
        
        {/* 测试 5: 非矩形卡片（图标应该不显示） */}
        <Card
          title="非矩形卡片 {icon='rocket'}"
          content="这个卡片使用了圆形形状，图标应该不会显示。"
          attributes={{ icon: 'rocket', shape: 'circle' }}
        />
      </div>
    </div>
  );
};

export default CardIconTest;
