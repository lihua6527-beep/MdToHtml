// Document to icon mapping
// This file maps document titles to appropriate icons

interface DocumentIconMapping {
  [documentTitle: string]: string; // icon name
}

export const DOCUMENT_ICON_MAPPING: DocumentIconMapping = {
  // 自动化测试相关
  "AutoUnit 基于主动学习的预测引导自动化测试.md": "test",
  
  // IoT和数据可视化相关
  "IoT 数据可视化监控平台.md": "eye",
  "数据可视化监控平台核心优势.md": "chart",
  
  // 文本处理和NLP相关
  "中文文本分类特征抽取比较研究.md": "filetext",
  "人工智能中文分词技术的多维解读与教学应用.md": "book",
  "信息抽取研究综述.md": "filetext",
  
  // 安全和攻击相关
  "共振攻击：揭示跨模态模型CLIP的脆弱性.md": "alert",
  
  // 区块链相关
  "区块链技术架构及进展.md": "blockchain",
  "区块链系统安全防护技术研究进展.md": "shield",
  "轻量级比特币交易溯源机制.md": "bitcoin",
  "适用于区块链的分布式密码技术综述.md": "cryptography",
  
  // 深度学习和神经网络相关
  "卷积神经网络研究综述.md": "brain",
  "基于深度学习的推荐系统研究综述.md": "trending",
  "注意力机制综述.md": "eye",
  "鲁棒的双教师自监督蒸馏哈希学习.md": "ml",
  
  // 计算机视觉相关
  "基于机器视觉的Web应用页面元素识别及可视化脚本生成.md": "vision",
  
  // 密码学相关
  "抗密钥暴露的变色龙哈希函数构造方案.md": "hash",
  
  // 其他
  "测试卡片图标.md": "tag"
};

// Get icon for a document
export const getDocumentIcon = (documentTitle: string): string => {
  return DOCUMENT_ICON_MAPPING[documentTitle] || "file";
};
