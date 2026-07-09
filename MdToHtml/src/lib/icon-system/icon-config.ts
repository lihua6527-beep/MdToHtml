/**
 * icon-config.ts — 图标配置层（纯数据）
 * 
 * 职责：
 * - 定义 IconConfig 接口
 * - 定义 SCENE_LIST 场景分类
 * - 定义 ICON_CONFIG 完整配置列表
 * 
 * 特点：
 * - 无任何运行时依赖
 * - 纯数据 + 类型定义，可被任何模块引用
 * - 变更时不影响渲染逻辑
 */

// ===== 类型定义 =====

export interface IconConfig {
  name: string;           // 图标名称（用户使用的名称）
  primaryName?: string;   // 标准名（如果 name 不是标准名，此字段指向标准名）
  component: string;      // Lucide组件名称
  category?: string;      // 图标分类
  scene?: string;         // 使用场景（与提示词语义对齐）
  description?: string;   // 图标描述
}

// ===== 场景分类 =====

export const SCENE_LIST = [
  'tech',           // 技术/性能/开发
  'data',           // 数据/分析/统计
  'doc',            // 文档/知识/学习
  'security',       // 安全/防护/加密
  'ai',             // AI/智能/机器学习
  'communication',  // 通信/连接/消息
  'achievement',    // 成果/成就/目标
  'time',           // 时间/进度/历史
  'creation',       // 创意/创新/设计
  'tool',           // 工具/配置/设置
  'user',           // 用户/管理/群组
  'media',          // 媒体/图像/音视频
  'storage',        // 存储/文件/归档
  'navigation',     // 导航/方向/位置
  'device',         // 设备/硬件
  'general',        // 通用/other
] as const;

// ===== 场景中文标签 =====

export const SCENE_LABELS: Record<string, string> = {
  tech: '技术/性能/开发',
  data: '数据/分析/统计',
  doc: '文档/知识/学习',
  security: '安全/防护/加密',
  ai: 'AI/智能/机器学习',
  communication: '通信/连接/消息',
  achievement: '成果/成就/目标',
  time: '时间/进度/历史',
  creation: '创意/创新/设计',
  tool: '工具/配置/设置',
  user: '用户/管理/群组',
  media: '媒体/图像/音视频',
  storage: '存储/文件/归档',
  navigation: '导航/方向/位置',
  device: '设备/硬件',
  general: '通用/other',
};

// ===== 完整图标配置列表 =====

export const ICON_CONFIG: IconConfig[] = [
  { name: 'zap', component: 'Zap', category: 'basic', scene: 'tech', description: '创新、能量、快速、高效' },
  { name: 'cpu', component: 'Cpu', category: 'tech', scene: 'tech', description: '技术、性能、计算、架构' },
  { name: 'chart', component: 'BarChart2', category: 'data', scene: 'data', description: '数据、分析、统计、趋势' },
  { name: 'chart3', primaryName: 'bar-chart', component: 'BarChart3', category: 'data', scene: 'data', description: '高级数据、复杂分析、多维度统计' },
  { name: 'bar-chart', component: 'BarChart3', category: 'data', scene: 'data', description: '柱状图、数据、分析、统计（标准名）' },
  { name: 'award', component: 'Award', category: 'achievement', scene: 'achievement', description: '成就、奖项、荣誉、认可' },
  { name: 'rocket', component: 'Rocket', category: 'growth', scene: 'achievement', description: '增长、启动、推进、突破' },
  { name: 'clock', component: 'Clock', category: 'time', scene: 'time', description: '时间、计划、进度、截止日期' },
  { name: 'alert', primaryName: 'alert-triangle', component: 'AlertTriangle', category: 'warning', scene: 'security', description: '警告、注意、提示、安全' },
  { name: 'alert-triangle', component: 'AlertTriangle', category: 'warning', scene: 'security', description: '严重警告、安全风险（标准名）' },
  { name: 'alert-circle', component: 'AlertCircle', category: 'warning', scene: 'security', description: '警告、注意、提示、安全' },
  { name: 'check', primaryName: 'check-circle', component: 'CheckCircle', category: 'success', scene: 'achievement', description: '成功、完成、验证、确认' },
  { name: 'check-circle', component: 'CheckCircle', category: 'success', scene: 'achievement', description: '成功、完成、验证、确认（标准名）' },
  { name: 'checksquare', primaryName: 'check-square', component: 'CheckSquare', category: 'success', scene: 'achievement', description: '任务完成、清单、确认' },
  { name: 'check-square', component: 'CheckSquare', category: 'success', scene: 'achievement', description: '任务完成、清单、确认（标准名）' },
  { name: 'network', component: 'Network', category: 'connection', scene: 'communication', description: '连接、网络、关系、协作' },
  { name: 'eye', component: 'Eye', category: 'view', scene: 'ai', description: '观察、监控、查看、洞察' },
  { name: 'tag', component: 'Tag', category: 'organization', scene: 'doc', description: '标签、分类、标记、关键词' },
  { name: 'layers', component: 'Layers', category: 'structure', scene: 'doc', description: '层次、结构、组织、组件' },
  { name: 'box', component: 'Box', category: 'storage', scene: 'storage', description: '容器、包装、存储、内容' },
  { name: 'globe', component: 'Globe', category: 'global', scene: 'communication', description: '全球、国际化、地球、多元文化' },
  { name: 'trending', primaryName: 'trending-up', component: 'TrendingUp', category: 'growth', scene: 'achievement', description: '趋势、增长、上升、进步' },
  { name: 'trending-up', component: 'TrendingUp', category: 'growth', scene: 'achievement', description: '趋势、增长、上升、进步（标准名）' },
  { name: 'book', component: 'Book', category: 'knowledge', scene: 'doc', description: '知识、学习、文档、教育' },
  { name: 'book-open', component: 'BookOpen', category: 'knowledge', scene: 'doc', description: '文档、指南、学习、参考' },
  { name: 'message', component: 'MessageSquare', category: 'communication', scene: 'communication', description: '沟通、对话、消息、交流' },
  { name: 'message-square', component: 'MessageSquare', category: 'communication', scene: 'communication', description: '消息、对话、交流、注释' },
  { name: 'settings', component: 'Settings', category: 'configuration', scene: 'tool', description: '设置、配置、选项、偏好' },
  { name: 'user', component: 'User', category: 'people', scene: 'user', description: '用户、个人、账号、个人资料' },
  { name: 'users', component: 'Users', category: 'people', scene: 'user', description: '团队、用户群、社区、合作' },
  { name: 'userplus', primaryName: 'user-plus', component: 'UserPlus', category: 'people', scene: 'user', description: '添加用户、邀请、注册、新成员' },
  { name: 'user-plus', component: 'UserPlus', category: 'people', scene: 'user', description: '添加用户、邀请、注册、新成员（标准名）' },
  { name: 'shield', component: 'Shield', category: 'security', scene: 'security', description: '安全、保护、防御、隐私' },
  { name: 'lightbulb', component: 'Lightbulb', category: 'idea', scene: 'creation', description: '创意、想法、灵感、创新' },
  { name: 'calendar', component: 'Calendar', category: 'time', scene: 'time', description: '日期、计划、安排、日程' },
  { name: 'dollar', primaryName: 'dollar-sign', component: 'DollarSign', category: 'finance', scene: 'general', description: '财务、金钱、价值、投资' },
  { name: 'dollar-sign', component: 'DollarSign', category: 'finance', scene: 'general', description: '财务、金钱、价值、投资（标准名）' },
  { name: 'target', component: 'Target', category: 'goal', scene: 'achievement', description: '目标、目的、焦点、方向' },
  { name: 'star', component: 'Star', category: 'rating', scene: 'achievement', description: '星级、评分、优秀、突出' },
  { name: 'heart', component: 'Heart', category: 'emotion', scene: 'general', description: '喜欢、爱、情感、关注' },
  { name: 'bookmark', component: 'Bookmark', category: 'organization', scene: 'doc', description: '收藏、保存、标记、重要' },

  // 文件/文档类
  { name: 'file', component: 'File', category: 'document', scene: 'doc', description: '文件、文档、资料、内容' },
  { name: 'filetext', primaryName: 'file-text', component: 'FileText', category: 'document', scene: 'doc', description: '文本文件、文档、文章、报告' },
  { name: 'file-text', component: 'FileText', category: 'document', scene: 'doc', description: '文本文件、文档、文章、报告（标准名）' },
  { name: 'filecode', primaryName: 'file-code', component: 'FileCode', category: 'document', scene: 'doc', description: '代码文件、编程、开发、脚本' },
  { name: 'file-code', component: 'FileCode', category: 'document', scene: 'doc', description: '代码文件、编程、开发、脚本（标准名）' },
  { name: 'fileimage', component: 'FileImage', category: 'document', scene: 'media', description: '图片文件、图像、视觉、设计' },
  { name: 'filevideo', component: 'FileVideo', category: 'document', scene: 'media', description: '视频文件、影片、媒体、演示' },
  { name: 'fileaudio', component: 'FileAudio', category: 'document', scene: 'media', description: '音频文件、音乐、声音、播客' },
  { name: 'filespreadsheet', component: 'FileSpreadsheet', category: 'document', scene: 'data', description: '电子表格、数据、表格、计算' },
  { name: 'filearchive', component: 'FileArchive', category: 'document', scene: 'storage', description: '压缩文件、归档、存储、备份' },

  // 媒体类
  { name: 'camera', component: 'Camera', category: 'media', scene: 'media', description: '图片、摄影、视觉、媒体' },
  { name: 'image', component: 'Image', category: 'media', scene: 'media', description: '图片、图像、视觉、设计' },
  { name: 'music', component: 'Music', category: 'media', scene: 'media', description: '音乐、音频、声音、娱乐' },
  { name: 'video', component: 'Video', category: 'media', scene: 'media', description: '视频、影片、媒体、演示' },

  // 技术/开发类
  { name: 'code', component: 'Code', category: 'development', scene: 'tech', description: '代码、编程、开发、脚本' },
  { name: 'terminal', component: 'Terminal', category: 'development', scene: 'tech', description: '终端、命令行、开发、系统' },
  { name: 'server', component: 'Server', category: 'infrastructure', scene: 'tech', description: '服务器、后端、主机、服务' },
  { name: 'monitor', component: 'Monitor', category: 'device', scene: 'tech', description: '显示器、屏幕、设备、显示' },
  { name: 'database', component: 'Database', category: 'data', scene: 'data', description: '数据、存储、数据库、信息' },
  { name: 'package', component: 'Package', category: 'development', scene: 'tech', description: '包、软件、部署、分发' },
  { name: 'github', component: 'Github', category: 'development', scene: 'tech', description: '代码托管、版本控制、开发、协作' },
  { name: 'clipboard', component: 'Clipboard', category: 'action', scene: 'tool', description: '剪贴板、复制、粘贴、内容' },

  // 版本控制/分支
  { name: 'gitbranch', primaryName: 'git-branch', component: 'GitBranch', category: 'development', scene: 'tech', description: '分支、版本控制、开发、协作' },
  { name: 'git-branch', component: 'GitBranch', category: 'development', scene: 'tech', description: '分支、版本控制、开发、协作（标准名）' },

  // 安全类
  { name: 'key', component: 'Key', category: 'security', scene: 'security', description: '密钥、权限、访问、安全' },
  { name: 'lock', component: 'Lock', category: 'security', scene: 'security', description: '锁定、安全、保护、隐私' },
  { name: 'cryptography', component: 'Lock', category: 'security', scene: 'security', description: '密码学、加密、安全、隐私' },
  { name: 'hash', component: 'Hash', category: 'security', scene: 'security', description: '哈希、加密、数据完整性、验证' },

  // AI/智能类
  { name: 'brain', component: 'Brain', category: 'ai', scene: 'ai', description: '人工智能、机器学习、神经网络、认知' },
  { name: 'ml', component: 'Brain', category: 'ai', scene: 'ai', description: '机器学习、数据科学、模型训练、预测' },
  { name: 'vision', component: 'Eye', category: 'media', scene: 'ai', description: '视觉、计算机视觉、图像识别、视觉处理' },

  // 存储/设备类
  { name: 'cloud', component: 'Cloud', category: 'storage', scene: 'storage', description: '云存储、云端、在线、备份' },
  { name: 'folder', component: 'Folder', category: 'storage', scene: 'storage', description: '文件夹、目录、组织、存储' },
  { name: 'storage', component: 'HardDrive', category: 'storage', scene: 'storage', description: '存储、硬盘、保存、备份' },
  { name: 'hard-drive', component: 'HardDrive', category: 'tech', scene: 'storage', description: '硬盘、存储、数据、设备' },
  { name: 'smartphone', component: 'Smartphone', category: 'device', scene: 'device', description: '手机、移动设备、便携、通讯' },
  { name: 'tablet', component: 'Tablet', category: 'device', scene: 'device', description: '平板、设备、便携、显示' },

  // 通信/连接类
  { name: 'wifi', component: 'Wifi', category: 'connection', scene: 'communication', description: '网络、连接、无线、信号' },
  { name: 'link', component: 'Link', category: 'connection', scene: 'communication', description: '链接、连接、关联、引用' },
  { name: 'mail', component: 'Mail', category: 'communication', scene: 'communication', description: '邮件、通信、消息、联系' },
  { name: 'send', component: 'Send', category: 'action', scene: 'communication', description: '发送、提交、传输、通信' },
  { name: 'share2', primaryName: 'share-2', component: 'Share2', category: 'action', scene: 'communication', description: '分享、传播、合作、社交' },
  { name: 'share-2', component: 'Share2', category: 'action', scene: 'communication', description: '分享、传播、合作、社交（标准名）' },

  // 导航/布局类
  { name: 'home', component: 'Home', category: 'navigation', scene: 'navigation', description: '首页、主页、开始、返回' },
  { name: 'map', component: 'Map', category: 'navigation', scene: 'navigation', description: '地图、位置、导航、方向' },
  { name: 'menu', component: 'Menu', category: 'navigation', scene: 'navigation', description: '菜单、选项、导航、列表' },
  { name: 'chevronright', component: 'ChevronRight', category: 'navigation', scene: 'navigation', description: '向右、前进、下一步、展开' },
  { name: 'chevrondown', component: 'ChevronDown', category: 'navigation', scene: 'navigation', description: '向下、展开、显示、下拉' },
  { name: 'chevronup', component: 'ChevronUp', category: 'navigation', scene: 'navigation', description: '向上、收起、隐藏、上拉' },
  { name: 'chevronleft', component: 'ChevronLeft', category: 'navigation', scene: 'navigation', description: '向左、后退、上一步、收起' },
  { name: 'grid', component: 'Grid', category: 'layout', scene: 'navigation', description: '网格、布局、组织、结构' },
  { name: 'layout', component: 'Layout', category: 'layout', scene: 'navigation', description: '布局、设计、安排、组织' },
  { name: 'list', component: 'List', category: 'organization', scene: 'navigation', description: '列表、项目、清单、组织' },

  // 工具/操作类
  { name: 'download', component: 'Download', category: 'action', scene: 'tool', description: '下载、获取、保存、离线' },
  { name: 'upload', component: 'Upload', category: 'action', scene: 'tool', description: '上传、提交、分享、同步' },
  { name: 'filter', component: 'Filter', category: 'action', scene: 'tool', description: '筛选、过滤、分类、排序' },
  { name: 'search', component: 'Search', category: 'action', scene: 'tool', description: '搜索、查找、探索、发现' },
  { name: 'refresh', component: 'RefreshCw', category: 'action', scene: 'tool', description: '刷新、更新、重试、循环' },
  { name: 'save', component: 'Save', category: 'action', scene: 'tool', description: '保存、存储、持久化' },
  { name: 'scan', component: 'Search', category: 'action', scene: 'tool', description: '扫描、搜索、检测、分析' },
  { name: 'tool', component: 'PenTool', category: 'development', scene: 'tool', description: '工具、构建、开发、调试' },

  // 创作/创意类
  { name: 'pentool', primaryName: 'pen-tool', component: 'PenTool', category: 'creation', scene: 'creation', description: '编辑、设计、绘画、创作' },
  { name: 'pen-tool', component: 'PenTool', category: 'creation', scene: 'creation', description: '编辑、设计、绘画、创作（标准名）' },
  { name: 'puzzle', component: 'Layers', category: 'structure', scene: 'creation', description: '拼图、组件、集成、组合' },
  { name: 'type', component: 'Type', category: 'text', scene: 'creation', description: '文本、字体、排版、命名' },

  // 主题类
  { name: 'sun', component: 'Sun', category: 'theme', scene: 'general', description: '白天、亮色模式、能量、活力' },
  { name: 'moon', component: 'Moon', category: 'theme', scene: 'general', description: '夜晚、暗色模式、睡眠、宁静' },

  // 区块链类
  { name: 'blockchain', component: 'GitBranch', category: 'blockchain', scene: 'tech', description: '区块链、分布式账本、加密货币、智能合约' },
  { name: 'bitcoin', component: 'DollarSign', category: 'blockchain', scene: 'general', description: '比特币、加密货币、数字资产、金融' },

  // 测试类
  { name: 'test', component: 'CheckSquare', category: 'development', scene: 'tech', description: '测试、验证、质量保证、自动化测试' },
  { name: 'automation', component: 'Zap', category: 'development', scene: 'tech', description: '自动化、脚本、流程、效率' },

  // 时间/进度
  { name: 'timer', component: 'Clock4', category: 'time', scene: 'time', description: '时间、定时器、倒计时、准时' },
  { name: 'history', component: 'History', category: 'time', scene: 'time', description: '历史、记录、过去、回顾' },
  { name: 'cycle', component: 'RefreshCw', category: 'time', scene: 'time', description: '循环、周期、迭代' },

  // 通知/消息
  { name: 'bell', component: 'Bell', category: 'notification', scene: 'communication', description: '通知、提醒、消息' },
  { name: 'flag', component: 'Flag', category: 'organization', scene: 'general', description: '标记、旗帜、国家、地区' },
  { name: 'gift', component: 'Gift', category: 'achievement', scene: 'achievement', description: '礼物、奖励、优惠、惊喜' },
  { name: 'activity', component: 'Activity', category: 'data', scene: 'data', description: '活动、动态、数据、响应' },

  // 其他杂项（向后兼容）
  { name: 'signal', component: 'WifiOff', category: 'connection', scene: 'communication', description: '信号、网络、连接、通信' },
  { name: 'index', component: 'Hash', category: 'action', scene: 'tool', description: '索引、搜索、查找、定位' },
  { name: 'memory', component: 'Database', category: 'storage', scene: 'storage', description: '内存、存储、缓存、数据' },
  { name: 'tree', component: 'TreePine', category: 'nature', scene: 'general', description: '树、自然、环境、生态' },
  { name: 'controller', component: 'Cpu', category: 'tech', scene: 'tech', description: '控制器、控制、管理、指挥' },
  { name: 'service', component: 'Server', category: 'infrastructure', scene: 'tech', description: '服务、服务层、后端、支持' },
  { name: 'data', component: 'Database', category: 'data', scene: 'data', description: '数据、信息、资料、内容' },
  { name: 'spring', component: 'Leaf', category: 'nature', scene: 'general', description: '弹簧、弹性、Spring框架、复苏' },
  { name: 'mobile', component: 'Smartphone', category: 'device', scene: 'device', description: '移动、手机、便携、无线' },
  { name: 'expand', component: 'Maximize2', category: 'action', scene: 'tool', description: '扩展、放大、增长、发展' },
  { name: 'edge', component: 'Wifi', category: 'connection', scene: 'communication', description: '边缘、边界、边缘计算、前沿' },
  { name: 'workflow', component: 'GitBranch', category: 'development', scene: 'tech', description: '工作流、流程、步骤、顺序' },
  { name: 'wrench', component: 'Settings', category: 'tool', scene: 'tool', description: '工具、维修、调整、设置' },
  { name: 'promise', component: 'GitMerge', category: 'development', scene: 'tech', description: '承诺、合并、异步' },
  { name: 'pipe', component: 'GitMerge', category: 'development', scene: 'tech', description: '管道、流、串联' },
  { name: 'queue', component: 'List', category: 'structure', scene: 'general', description: '队列、列表、顺序' },
  { name: 'share', component: 'Share2', category: 'action', scene: 'communication', description: '分享、传播、分发' },
  { name: 'phone', component: 'Smartphone', category: 'device', scene: 'device', description: '手机、移动设备、通信、联系' },
];