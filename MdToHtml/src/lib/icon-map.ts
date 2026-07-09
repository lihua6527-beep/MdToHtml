/**
 * 图标查找表 — 在 Card.tsx 中直接使用
 * 
 * 策略：放弃通过 icon-manager 间接查找组件的方式，
 * 直接在渲染层用硬编码映射表查找。
 * 这样 tree-shaking 能明确追踪每个组件的使用，不会删掉它们。
 */

import {
  Activity, AlertCircle, AlertTriangle, Award,
  BarChart2, BarChart3, Bell, Book, BookOpen, Bookmark, Box, Brain,
  Calendar, Camera, CheckCircle, CheckSquare,
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  Clipboard, Clock, Clock4, Cloud, Code, Cpu,
  Database, DollarSign, Download, Eye,
  File, FileArchive, FileAudio, FileCode, FileImage, FileSpreadsheet, FileText, FileVideo,
  Filter, Flag, Folder,
  Gift, GitBranch, GitMerge, Github, Globe, Grid,
  HardDrive, Hash, Heart, History, Home,
  Image, Key,
  Layers, Layout, Leaf, Lightbulb, Link, Lock, List,
  Mail, Map, Maximize2, Menu, MessageSquare, Monitor, Moon, Music,
  Network, Package, PenTool, PieChart,
  RefreshCw, Rocket,
  Save, Search, Send, Server, Settings, Share2, Shield, Smartphone, Star, Sun,
  Tablet, Tag, Target, Terminal, TreePine, TrendingUp, Type,
  Upload, User, UserPlus, Users,
  Video, Wifi, WifiOff, Zap,
  type LucideIcon
} from 'lucide-react';

/**
 * icon-manager 中定义的 icon name → Lucide 组件的静态映射
 * 使用直接命名导入，确保 tree-shaking 不会移除
 */
const ICON_MAP: Record<string, LucideIcon> = {
  // 基础图标
  'zap': Zap,
  'cpu': Cpu,
  'chart': BarChart2,
  'bar-chart': BarChart3,
  'award': Award,
  'rocket': Rocket,
  'clock': Clock,
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'check-circle': CheckCircle,
  'check-square': CheckSquare,
  'network': Network,
  'eye': Eye,
  'tag': Tag,
  'layers': Layers,
  'box': Box,
  'globe': Globe,
  'trending-up': TrendingUp,
  'book': Book,
  'book-open': BookOpen,
  'message': MessageSquare,
  'message-square': MessageSquare,
  'settings': Settings,
  'user': User,
  'users': Users,
  'user-plus': UserPlus,
  'shield': Shield,
  'lightbulb': Lightbulb,
  'calendar': Calendar,
  'dollar-sign': DollarSign,
  'target': Target,
  'star': Star,
  'heart': Heart,
  'bookmark': Bookmark,

  // 文件/文档类
  'file': File,
  'file-text': FileText,
  'file-code': FileCode,
  'fileimage': FileImage,
  'filevideo': FileVideo,
  'fileaudio': FileAudio,
  'filespreadsheet': FileSpreadsheet,
  'filearchive': FileArchive,

  // 媒体类
  'camera': Camera,
  'image': Image,
  'music': Music,
  'video': Video,

  // 技术/开发类
  'code': Code,
  'terminal': Terminal,
  'server': Server,
  'monitor': Monitor,
  'database': Database,
  'package': Package,
  'github': Github,
  'clipboard': Clipboard,
  'git-branch': GitBranch,

  // 安全类
  'key': Key,
  'lock': Lock,
  'hash': Hash,

  // AI/智能类
  'brain': Brain,

  // 存储/设备类
  'cloud': Cloud,
  'folder': Folder,
  'storage': HardDrive,
  'hard-drive': HardDrive,
  'smartphone': Smartphone,
  'tablet': Tablet,

  // 通信/连接类
  'wifi': Wifi,
  'link': Link,
  'mail': Mail,
  'send': Send,
  'share-2': Share2,

  // 导航/布局类
  'home': Home,
  'map': Map,
  'menu': Menu,
  'chevronright': ChevronRight,
  'chevrondown': ChevronDown,
  'chevronup': ChevronUp,
  'chevronleft': ChevronLeft,
  'grid': Grid,
  'layout': Layout,
  'list': List,

  // 工具/操作类
  'download': Download,
  'upload': Upload,
  'filter': Filter,
  'search': Search,
  'refresh': RefreshCw,
  'save': Save,
  'tool': PenTool,
  'pen-tool': PenTool,

  // 创作/创意类
  'puzzle': Layers,
  'type': Type,

  // 主题类
  'sun': Sun,
  'moon': Moon,

  // 时间/进度
  'timer': Clock4,
  'history': History,
  'cycle': RefreshCw,

  // 通知/消息
  'bell': Bell,
  'flag': Flag,
  'gift': Gift,
  'activity': Activity,

  // 其他杂项
  'signal': WifiOff,
  'index': Hash,
  'tree': TreePine,
  'expand': Maximize2,
  'wrench': Settings,
  'share': Share2,
  'phone': Smartphone,
  'mobile': Smartphone,
  'memory': Database,
  'data': Database,
  'edge': Wifi,
  'workflow': GitBranch,
  'promise': GitMerge,
  'pipe': GitMerge,
  'queue': List,
};

/**
 * 根据图标名获取 Lucide 图标组件
 */
export function getIconComponentByName(iconName: string): LucideIcon | undefined {
  return ICON_MAP[iconName];
}