/**
 * icon-renderer.ts — 图标渲染层
 * 
 * 职责：
 * - 管理 Lucide 组件的静态映射（防止 tree-shaking）
 * - 提供 getIconComponent / getIconComponentSync
 * 
 * 特点：
 * - 所有 Lucide 组件通过直接命名导入（确保 tree-shaking 不移除）
 * - 零配置依赖，只从 icon-config 读取配置信息
 * - 内部缓存机制
 */

import React from 'react';

// ===== 直接命名导入所有 Lucide 组件 =====
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
} from 'lucide-react';

// ===== 组件名 → React 组件 的静态映射 =====

const componentNameMap: Record<string, React.ElementType> = {
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
};

// ===== 图标名 → 组件的静态映射（编译时直接追踪，防止 tree-shaking）=====

const iconNameMap: Record<string, React.ElementType> = {
  'zap': Zap, 'cpu': Cpu, 'chart': BarChart2, 'bar-chart': BarChart3,
  'award': Award, 'rocket': Rocket, 'clock': Clock,
  'alert-triangle': AlertTriangle, 'alert-circle': AlertCircle,
  'check-circle': CheckCircle, 'check-square': CheckSquare,
  'network': Network, 'eye': Eye, 'tag': Tag, 'layers': Layers,
  'box': Box, 'globe': Globe, 'trending-up': TrendingUp,
  'book': Book, 'book-open': BookOpen,
  'message': MessageSquare, 'message-square': MessageSquare,
  'settings': Settings, 'user': User, 'users': Users, 'user-plus': UserPlus,
  'shield': Shield, 'lightbulb': Lightbulb, 'calendar': Calendar,
  'dollar-sign': DollarSign, 'target': Target, 'star': Star,
  'heart': Heart, 'bookmark': Bookmark,
  'file': File, 'file-text': FileText, 'file-code': FileCode,
  'fileimage': FileImage, 'filevideo': FileVideo, 'fileaudio': FileAudio,
  'filespreadsheet': FileSpreadsheet, 'filearchive': FileArchive,
  'camera': Camera, 'image': Image, 'music': Music, 'video': Video,
  'code': Code, 'terminal': Terminal, 'server': Server, 'monitor': Monitor,
  'database': Database, 'package': Package, 'github': Github,
  'clipboard': Clipboard, 'git-branch': GitBranch,
  'key': Key, 'lock': Lock, 'hash': Hash, 'brain': Brain,
  'cloud': Cloud, 'folder': Folder, 'storage': HardDrive, 'hard-drive': HardDrive,
  'smartphone': Smartphone, 'tablet': Tablet,
  'wifi': Wifi, 'link': Link, 'mail': Mail, 'send': Send, 'share-2': Share2,
  'home': Home, 'map': Map, 'menu': Menu,
  'chevronright': ChevronRight, 'chevrondown': ChevronDown,
  'chevronup': ChevronUp, 'chevronleft': ChevronLeft,
  'grid': Grid, 'layout': Layout, 'list': List,
  'download': Download, 'upload': Upload, 'filter': Filter, 'search': Search,
  'refresh': RefreshCw, 'save': Save, 'tool': PenTool, 'pen-tool': PenTool,
  'puzzle': Layers, 'type': Type, 'sun': Sun, 'moon': Moon,
  'timer': Clock4, 'history': History, 'cycle': RefreshCw,
  'bell': Bell, 'flag': Flag, 'gift': Gift, 'activity': Activity,
  'signal': WifiOff, 'index': Hash, 'tree': TreePine, 'expand': Maximize2,
  'wrench': Settings, 'share': Share2, 'phone': Smartphone, 'mobile': Smartphone,
  'memory': Database, 'data': Database, 'edge': Wifi,
  'workflow': GitBranch, 'promise': GitMerge, 'pipe': GitMerge, 'queue': List,
  // 补充缺失的标准名
  'cryptography': Lock, 'ml': Brain, 'vision': Eye, 'scan': Search,
  'blockchain': GitBranch, 'bitcoin': DollarSign, 'test': CheckSquare,
  'automation': Zap, 'controller': Cpu, 'service': Server, 'spring': Leaf,
};

// ===== 导出函数 =====

/**
 * 根据图标名（name）同步获取 Lucide 图标组件
 * 用于 Card.tsx 等客户端渲染组件
 */
export function getIconComponentSync(iconName: string): React.ElementType | null {
  return iconNameMap[iconName] || null;
}

/**
 * 根据图标名（name）异步获取 Lucide 图标组件
 * 用于动态导入场景
 */
export async function getIconComponentAsync(iconName: string): Promise<React.ElementType | null> {
  return iconNameMap[iconName] || null;
}

/**
 * 根据 Lucide 组件名获取 React 组件
 */
export function getComponentByName(componentName: string): React.ElementType | null {
  return componentNameMap[componentName] || null;
}

/**
 * 检查图标名是否存在于映射中
 */
export function iconComponentExists(iconName: string): boolean {
  return iconName in iconNameMap;
}