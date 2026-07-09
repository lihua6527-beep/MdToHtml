// Document to icon mapping
// v2.0 — 规则引擎 + 覆盖表的混合策略
// 优先级：手动覆盖表 > 关键词规则匹配 > 默认降级

// 1. 关键词规则层（自动匹配，基于文档标题）
const KEYWORD_RULES: Array<{ pattern: RegExp; icon: string }> = [
    // 自动化测试
    { pattern: /自动化测试|auto.*test|unit.*test|test.*auto/i, icon: 'test' },
    
    // 区块链
    { pattern: /区块链|bitcoin|分布式账本|共识算法|智能合约/i, icon: 'blockchain' },
    
    // 深度学习 / 神经网络
    { pattern: /卷积神经网络|深度.*学习|transformer|attention|自注意力|神经网络/i, icon: 'brain' },
    
    // IoT / 数据可视化
    { pattern: /IoT|数据可视化|可视化监控|dashboard/i, icon: 'eye' },
    
    // 安全 / 攻击
    { pattern: /安全防护|攻击|脆弱性|resilience|对抗|入侵/i, icon: 'shield' },
    
    // 综述 / 研究进展
    { pattern: /综述|survey|研究进展|研究现状|文献综述/i, icon: 'book-open' },
    
    // 推荐系统
    { pattern: /推荐系统|推荐算法|协同过滤|推荐/i, icon: 'trending-up' },
    
    // 密码学
    { pattern: /密码学|加密|哈希|签名|密钥|密码/i, icon: 'cryptography' },
    
    // 计算机视觉
    { pattern: /视觉|图像.*识别|object.*detection|目标检测|语义分割|cnn/i, icon: 'vision' },
    
    // NLP / 文本处理
    { pattern: /NLP|分词|文本分类|信息抽取|自然语言|nlp/i, icon: 'file-text' },
    
    // 机器学习
    { pattern: /机器学习|ml|强化学习|模型训练|蒸馏|知识蒸馏/i, icon: 'ml' },
    
    // 分布式系统
    { pattern: /分布式|微服务|服务网格|容器|编排/i, icon: 'server' },
    
    // 架构 / 系统设计
    { pattern: /架构|架构设计|系统设计|框架/i, icon: 'layers' },
    
    // 数据 / 数据库
    { pattern: /数据.*库|大数据|数据仓库|数据挖掘/i, icon: 'database' },
    
    // 工具 / 开发
    { pattern: /工具|开发|构建|部署|CI|CD|DevOps/i, icon: 'tool' },
    
    // 通用后备规则
    { pattern: /测试|test|实验/i, icon: 'test' },
    { pattern: /论文|研究|研究综述|学术|survey/i, icon: 'book' },
    { pattern: /项目|管理|规划|计划/i, icon: 'target' },
    { pattern: /指南|教程|文档|手册|README/i, icon: 'book-open' },
];

// 2. 手动覆盖层（优先级高于规则，用于特殊文档名精确匹配）
const OVERRIDE_MAPPING: Record<string, string> = {
    "AutoUnit 基于主动学习的预测引导自动化测试.md": "test",
    "IoT 数据可视化监控平台.md": "eye",
    "数据可视化监控平台核心优势.md": "chart",
    "中文文本分类特征抽取比较研究.md": "file-text",
    "人工智能中文分词技术的多维解读与教学应用.md": "book",
    "信息抽取研究综述.md": "file-text",
    "共振攻击：揭示跨模态模型CLIP的脆弱性.md": "alert-circle",
    "区块链技术架构及进展.md": "blockchain",
    "区块链系统安全防护技术研究进展.md": "shield",
    "轻量级比特币交易溯源机制.md": "bitcoin",
    "适用于区块链的分布式密码技术综述.md": "cryptography",
    "卷积神经网络研究综述.md": "brain",
    "基于深度学习的推荐系统研究综述.md": "trending-up",
    "注意力机制综述.md": "eye",
    "鲁棒的双教师自监督蒸馏哈希学习.md": "ml",
    "基于机器视觉的Web应用页面元素识别及可视化脚本生成.md": "vision",
    "抗密钥暴露的变色龙哈希函数构造方案.md": "hash",
    "测试卡片图标.md": "tag",
};

// 3. 导出函数：覆盖表 > 规则匹配 > 默认
export const getDocumentIcon = (documentTitle: string): string => {
    // 优先级1：手动覆盖（精确匹配文档名）
    if (OVERRIDE_MAPPING[documentTitle]) {
        return OVERRIDE_MAPPING[documentTitle];
    }
    
    // 优先级2：关键词规则匹配
    for (const rule of KEYWORD_RULES) {
        if (rule.pattern.test(documentTitle)) {
            return rule.icon;
        }
    }
    
    // 优先级3：默认降级（用 file-text 替代旧版 file，更语义化）
    return 'file-text';
};

// 保留旧接口以兼容（引用覆盖表）
export const DOCUMENT_ICON_MAPPING: Record<string, string> = {
    ...OVERRIDE_MAPPING,
};

/**
 * 手动添加文档图标映射（用于运行时动态添加）
 * 优先级高于规则匹配但低于覆盖表
 */
export const addDocumentIcon = (documentTitle: string, iconName: string): void => {
    OVERRIDE_MAPPING[documentTitle] = iconName;
};