const fs = require('fs');
const path = require('path');

// 手动定义映射，因为我们不能直接require TypeScript文件
const DOCUMENT_ICON_MAPPING = {
  "AutoUnit 基于主动学习的预测引导自动化测试.md": "test",
  "IoT 数据可视化监控平台.md": "eye",
  "数据可视化监控平台核心优势.md": "chart",
  "中文文本分类特征抽取比较研究.md": "filetext",
  "人工智能中文分词技术的多维解读与教学应用.md": "book",
  "信息抽取研究综述.md": "filetext",
  "共振攻击：揭示跨模态模型CLIP的脆弱性.md": "alert",
  "区块链技术架构及进展.md": "blockchain",
  "区块链系统安全防护技术研究进展.md": "shield",
  "轻量级比特币交易溯源机制.md": "bitcoin",
  "适用于区块链的分布式密码技术综述.md": "cryptography",
  "卷积神经网络研究综述.md": "brain",
  "基于深度学习的推荐系统研究综述.md": "trending",
  "注意力机制综述.md": "eye",
  "鲁棒的双教师自监督蒸馏哈希学习.md": "ml",
  "基于机器视觉的Web应用页面元素识别及可视化脚本生成.md": "vision",
  "抗密钥暴露的变色龙哈希函数构造方案.md": "hash",
  "测试卡片图标.md": "tag"
};

const inputDir = 'input';
const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.md'));

console.log('文档数量:', files.length);
console.log('已配置图标数量:', Object.keys(DOCUMENT_ICON_MAPPING).length);

const missing = files.filter(file => !DOCUMENT_ICON_MAPPING[file]);
console.log('未配置图标文档:', missing);
console.log('所有文档均已配置图标:', missing.length === 0);

// 验证每个文档都有图标
files.forEach(file => {
  const icon = DOCUMENT_ICON_MAPPING[file] || 'file';
  console.log(`${file}: ${icon}`);
});
