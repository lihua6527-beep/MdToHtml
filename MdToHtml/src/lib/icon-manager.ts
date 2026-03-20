// Icon Manager for CHD Protocol
// 动态图标加载和管理系统

import React from 'react';

// 图标配置类型
export interface IconConfig {
  name: string;           // 图标名称（用户使用的名称）
  component: string;      // Lucide组件名称
  category?: string;      // 图标分类
  description?: string;   // 图标描述
}

// 图标配置列表
export const ICON_CONFIG: IconConfig[] = [
  // 基础图标
  { name: 'zap', component: 'Zap', category: 'basic', description: '创新、能量、快速、高效' },
  { name: 'cpu', component: 'Cpu', category: 'tech', description: '技术、性能、计算、架构' },
  { name: 'chart', component: 'BarChart2', category: 'data', description: '数据、分析、统计、趋势' },
  { name: 'chart3', component: 'BarChart3', category: 'data', description: '高级数据、复杂分析、多维度统计' },
  { name: 'award', component: 'Award', category: 'achievement', description: '成就、奖项、荣誉、认可' },
  { name: 'rocket', component: 'Rocket', category: 'growth', description: '增长、启动、推进、突破' },
  { name: 'clock', component: 'Clock', category: 'time', description: '时间、计划、进度、截止日期' },
  { name: 'alert', component: 'AlertTriangle', category: 'warning', description: '警告、注意、提示、安全' },
  { name: 'check', component: 'CheckCircle', category: 'success', description: '成功、完成、验证、确认' },
  { name: 'checksquare', component: 'CheckSquare', category: 'success', description: '任务完成、清单、确认' },
  { name: 'network', component: 'Network', category: 'connection', description: '连接、网络、关系、协作' },
  { name: 'eye', component: 'Eye', category: 'view', description: '观察、监控、查看、洞察' },
  { name: 'tag', component: 'Tag', category: 'organization', description: '标签、分类、标记、关键词' },
  { name: 'layers', component: 'Layers', category: 'structure', description: '层次、结构、组织、组件' },
  { name: 'box', component: 'Box', category: 'storage', description: '容器、包装、存储、内容' },
  { name: 'globe', component: 'Globe', category: 'global', description: '全球、国际化、地球、多元文化' },
  { name: 'trending', component: 'TrendingUp', category: 'growth', description: '趋势、增长、上升、进步' },
  { name: 'book', component: 'Book', category: 'knowledge', description: '知识、学习、文档、教育' },
  { name: 'message', component: 'MessageSquare', category: 'communication', description: '沟通、对话、消息、交流' },
  { name: 'settings', component: 'Settings', category: 'configuration', description: '设置、配置、选项、偏好' },
  { name: 'user', component: 'User', category: 'people', description: '用户、个人、账号、个人资料' },
  { name: 'users', component: 'Users', category: 'people', description: '团队、用户群、社区、合作' },
  { name: 'userplus', component: 'UserPlus', category: 'people', description: '添加用户、邀请、注册、新成员' },
  { name: 'shield', component: 'Shield', category: 'security', description: '安全、保护、防御、隐私' },
  { name: 'lightbulb', component: 'Lightbulb', category: 'idea', description: '创意、想法、灵感、创新' },
  { name: 'calendar', component: 'Calendar', category: 'time', description: '日期、计划、安排、日程' },
  { name: 'dollar', component: 'DollarSign', category: 'finance', description: '财务、金钱、价值、投资' },
  { name: 'target', component: 'Target', category: 'goal', description: '目标、目的、焦点、方向' },
  { name: 'star', component: 'Star', category: 'rating', description: '星级、评分、优秀、突出' },
  { name: 'heart', component: 'Heart', category: 'emotion', description: '喜欢、爱、情感、关注' },
  { name: 'bookmark', component: 'Bookmark', category: 'organization', description: '收藏、保存、标记、重要' },
  { name: 'camera', component: 'Camera', category: 'media', description: '图片、摄影、视觉、媒体' },
  { name: 'cloud', component: 'Cloud', category: 'storage', description: '云存储、云端、在线、备份' },
  { name: 'database', component: 'Database', category: 'data', description: '数据、存储、数据库、信息' },
  { name: 'download', component: 'Download', category: 'action', description: '下载、获取、保存、离线' },
  { name: 'file', component: 'File', category: 'document', description: '文件、文档、资料、内容' },
  { name: 'filetext', component: 'FileText', category: 'document', description: '文本文件、文档、文章、报告' },
  { name: 'filecode', component: 'FileCode', category: 'document', description: '代码文件、编程、开发、脚本' },
  { name: 'fileimage', component: 'FileImage', category: 'document', description: '图片文件、图像、视觉、设计' },
  { name: 'filevideo', component: 'FileVideo', category: 'document', description: '视频文件、影片、媒体、演示' },
  { name: 'fileaudio', component: 'FileAudio', category: 'document', description: '音频文件、音乐、声音、播客' },
  { name: 'filespreadsheet', component: 'FileSpreadsheet', category: 'document', description: '电子表格、数据、表格、计算' },
  { name: 'filearchive', component: 'FileArchive', category: 'document', description: '压缩文件、归档、存储、备份' },
  { name: 'filter', component: 'Filter', category: 'action', description: '筛选、过滤、分类、排序' },
  { name: 'flag', component: 'Flag', category: 'organization', description: '标记、旗帜、国家、地区' },
  { name: 'folder', component: 'Folder', category: 'storage', description: '文件夹、目录、组织、存储' },
  { name: 'gift', component: 'Gift', category: 'achievement', description: '礼物、奖励、优惠、惊喜' },
  { name: 'github', component: 'Github', category: 'development', description: '代码托管、版本控制、开发、协作' },
  { name: 'home', component: 'Home', category: 'navigation', description: '首页、主页、开始、返回' },
  { name: 'image', component: 'Image', category: 'media', description: '图片、图像、视觉、设计' },
  { name: 'key', component: 'Key', category: 'security', description: '密钥、权限、访问、安全' },
  { name: 'link', component: 'Link', category: 'connection', description: '链接、连接、关联、引用' },
  { name: 'lock', component: 'Lock', category: 'security', description: '锁定、安全、保护、隐私' },
  { name: 'mail', component: 'Mail', category: 'communication', description: '邮件、通信、消息、联系' },
  { name: 'map', component: 'Map', category: 'navigation', description: '地图、位置、导航、方向' },
  { name: 'menu', component: 'Menu', category: 'navigation', description: '菜单、选项、导航、列表' },
  { name: 'moon', component: 'Moon', category: 'theme', description: '夜晚、暗色模式、睡眠、宁静' },
  { name: 'music', component: 'Music', category: 'media', description: '音乐、音频、声音、娱乐' },
  { name: 'pentool', component: 'PenTool', category: 'creation', description: '编辑、设计、绘画、创作' },
  { name: 'piechart', component: 'PieChart', category: 'data', description: '饼图、数据、比例、分布' },
  { name: 'search', component: 'Search', category: 'action', description: '搜索、查找、探索、发现' },
  { name: 'share2', component: 'Share2', category: 'action', description: '分享、传播、合作、社交' },
  { name: 'sun', component: 'Sun', category: 'theme', description: '白天、亮色模式、能量、活力' },
  { name: 'upload', component: 'Upload', category: 'action', description: '上传、提交、分享、同步' },
  { name: 'video', component: 'Video', category: 'media', description: '视频、影片、媒体、演示' },
  { name: 'wifi', component: 'Wifi', category: 'connection', description: '网络、连接、无线、信号' },
  { name: 'code', component: 'Code', category: 'development', description: '代码、编程、开发、脚本' },
  { name: 'clipboard', component: 'Clipboard', category: 'action', description: '剪贴板、复制、粘贴、内容' },
  { name: 'gitbranch', component: 'GitBranch', category: 'development', description: '分支、版本控制、开发、协作' },
  { name: 'grid', component: 'Grid', category: 'layout', description: '网格、布局、组织、结构' },
  { name: 'layout', component: 'Layout', category: 'layout', description: '布局、设计、安排、组织' },
  { name: 'list', component: 'List', category: 'organization', description: '列表、项目、清单、组织' },
  { name: 'monitor', component: 'Monitor', category: 'device', description: '显示器、屏幕、设备、显示' },
  { name: 'package', component: 'Package', category: 'development', description: '包、软件、部署、分发' },
  { name: 'server', component: 'Server', category: 'infrastructure', description: '服务器、后端、主机、服务' },
  { name: 'smartphone', component: 'Smartphone', category: 'device', description: '手机、移动设备、便携、通讯' },
  { name: 'tablet', component: 'Tablet', category: 'device', description: '平板、设备、便携、显示' },
  { name: 'terminal', component: 'Terminal', category: 'development', description: '终端、命令行、开发、系统' },
  { name: 'chevronright', component: 'ChevronRight', category: 'navigation', description: '向右、前进、下一步、展开' },
  { name: 'chevrondown', component: 'ChevronDown', category: 'navigation', description: '向下、展开、显示、下拉' },
  { name: 'chevronup', component: 'ChevronUp', category: 'navigation', description: '向上、收起、隐藏、上拉' },
  { name: 'chevronleft', component: 'ChevronLeft', category: 'navigation', description: '向左、后退、上一步、收起' },
  // 新增图标
  { name: 'signal', component: 'WifiOff', category: 'connection', description: '信号、网络、连接、通信' },
  { name: 'refresh', component: 'RefreshCw', category: 'action', description: '刷新、更新、重试、循环' },
  { name: 'timer', component: 'Clock4', category: 'time', description: '时间、定时器、倒计时、准时' },
  { name: 'history', component: 'History', category: 'time', description: '历史、记录、过去、回顾' },
  { name: 'phone', component: 'Smartphone', category: 'device', description: '手机、移动设备、通信、联系' },
  { name: 'index', component: 'Hash', category: 'action', description: '索引、搜索、查找、定位' },
  { name: 'memory', component: 'Database', category: 'storage', description: '内存、存储、缓存、数据' },
  { name: 'tree', component: 'TreePine', category: 'nature', description: '树、自然、环境、生态' },
  { name: 'controller', component: 'Cpu', category: 'tech', description: '控制器、控制、管理、指挥' },
  { name: 'service', component: 'Server', category: 'infrastructure', description: '服务、服务层、后端、支持' },
  { name: 'data', component: 'Database', category: 'data', description: '数据、信息、资料、内容' },
  { name: 'spring', component: 'Leaf', category: 'nature', description: '弹簧、弹性、Spring框架、复苏' },
  { name: 'storage', component: 'HardDrive', category: 'storage', description: '存储、硬盘、保存、备份' },
  { name: 'mobile', component: 'Smartphone', category: 'device', description: '移动、手机、便携、无线' },
  { name: 'expand', component: 'Maximize2', category: 'action', description: '扩展、放大、增长、发展' },
  { name: 'edge', component: 'Wifi', category: 'connection', description: '边缘、边界、边缘计算、前沿' },
  // 区块链相关图标
  { name: 'blockchain', component: 'GitBranch', category: 'blockchain', description: '区块链、分布式账本、加密货币、智能合约' },
  { name: 'bitcoin', component: 'DollarSign', category: 'blockchain', description: '比特币、加密货币、数字资产、金融' },
  // 机器学习相关图标
  { name: 'brain', component: 'Brain', category: 'ai', description: '人工智能、机器学习、神经网络、认知' },
  { name: 'ml', component: 'Brain', category: 'ai', description: '机器学习、数据科学、模型训练、预测' },
  // 密码学相关图标
  { name: 'cryptography', component: 'Lock', category: 'security', description: '密码学、加密、安全、隐私' },
  { name: 'hash', component: 'Hash', category: 'security', description: '哈希、加密、数据完整性、验证' },
  // 视觉相关图标
  { name: 'vision', component: 'Eye', category: 'media', description: '视觉、计算机视觉、图像识别、视觉处理' },
  { name: 'camera', component: 'Camera', category: 'media', description: '相机、摄影、图像捕获、视觉输入' },
  // 测试相关图标
  { name: 'test', component: 'CheckSquare', category: 'development', description: '测试、验证、质量保证、自动化测试' },
  { name: 'automation', component: 'Zap', category: 'development', description: '自动化、脚本、流程、效率' },
  // 微信小程序文档中使用的图标
  { name: 'tool', component: 'PenTool', category: 'development', description: '工具、构建、开发、调试' },
  { name: 'pen-tool', component: 'PenTool', category: 'creation', description: '编辑、设计、绘画、创作' },
  { name: 'trending-up', component: 'TrendingUp', category: 'growth', description: '趋势、增长、上升、进步' },
  { name: 'bar-chart', component: 'BarChart3', category: 'data', description: '柱状图、数据、分析、统计' },
  { name: 'pie-chart', component: 'PieChart', category: 'data', description: '饼图、数据、比例、分布' },
  { name: 'send', component: 'Send', category: 'action', description: '发送、提交、传输、通信' },
  { name: 'alert-circle', component: 'AlertCircle', category: 'warning', description: '警告、注意、提示、安全' },
  { name: 'type', component: 'Type', category: 'text', description: '文本、字体、排版、命名' },
  { name: 'message-square', component: 'MessageSquare', category: 'communication', description: '消息、对话、交流、注释' },
  { name: 'activity', component: 'Activity', category: 'data', description: '活动、动态、数据、响应' },
  { name: 'git-branch', component: 'GitBranch', category: 'development', description: '分支、版本控制、开发、协作' },
  { name: 'book-open', component: 'BookOpen', category: 'knowledge', description: '文档、指南、学习、参考' },
  // 缓存系统分析与优化报告使用的图标
  { name: 'workflow', component: 'GitBranch', category: 'development', description: '工作流、流程、步骤、顺序' },
  { name: 'check-circle', component: 'CheckCircle', category: 'success', description: '成功、完成、验证、确认' },
  { name: 'wrench', component: 'Settings', category: 'tool', description: '工具、维修、调整、设置' },
  { name: 'puzzle', component: 'Layers', category: 'structure', description: '拼图、组件、集成、组合' },
  { name: 'scan', component: 'Search', category: 'action', description: '扫描、搜索、检测、分析' }
];

// 图标映射表
const iconMap = new Map<string, string>();
ICON_CONFIG.forEach(icon => {
  iconMap.set(icon.name, icon.component);
});

// 动态导入图标组件
export const getIconComponent = async (iconName: string): Promise<React.ElementType | null> => {
  try {
    const componentName = iconMap.get(iconName);
    if (!componentName) {
      return null;
    }

    // 动态导入lucide-react图标
    const lucideModule = await import('lucide-react');
    const IconComponent = (lucideModule as any)[componentName];
    
    if (typeof IconComponent === 'function') {
      return IconComponent;
    }
    return null;
  } catch (error) {
    console.error(`Error loading icon ${iconName}:`, error);
    return null;
  }
};

// 同步获取图标组件（用于SSR）
export const getIconComponentSync = (iconName: string): React.ElementType | null => {
  try {
    const componentName = iconMap.get(iconName);
    if (!componentName) {
      return null;
    }

    // 尝试从全局lucide对象获取（需要在全局导入）
    // 注意：这种方式需要在应用启动时导入所有可能的图标
    // 这里使用一个简化的版本，实际项目中可能需要更复杂的处理
    return null;
  } catch (error) {
    console.error(`Error loading icon ${iconName}:`, error);
    return null;
  }
};

// 获取所有可用图标
export const getAllIcons = (): IconConfig[] => {
  return ICON_CONFIG;
};

// 根据分类获取图标
export const getIconsByCategory = (category: string): IconConfig[] => {
  return ICON_CONFIG.filter(icon => icon.category === category);
};

// 搜索图标
export const searchIcons = (query: string): IconConfig[] => {
  const lowerQuery = query.toLowerCase();
  return ICON_CONFIG.filter(icon => 
    icon.name.toLowerCase().includes(lowerQuery) ||
    icon.description?.toLowerCase().includes(lowerQuery)
  );
};

// 检查图标是否存在
export const iconExists = (iconName: string): boolean => {
  return iconMap.has(iconName);
};
