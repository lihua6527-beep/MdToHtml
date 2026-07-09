/**
 * Icon Components — Lucide 图标组件的静态映射表
 * 
 * 为什么需要这个文件？
 * 
 * Next.js / webpack 的 tree-shaking 机制会移除通过字符串动态访问的
 * 组件（如 (LucideIcons as any)['Zap']），导致图标永远无法渲染。
 * 
 * 解决方案：使用直接命名导入，构建时编译器能明确追踪每个组件的使用。
 * 这是 100% 可靠的方案。
 */

// 直接命名导入所有 Lucide 图标组件
import {
  Activity, AlertCircle, AlertTriangle, Award, BarChart2, BarChart3,
  Bell, Book, BookOpen, Bookmark, Box, Brain,
  Calendar, Camera, CheckCircle, CheckSquare, ChevronDown, ChevronLeft,
  ChevronRight, ChevronUp, Clipboard, Clock, Clock4, Cloud, Code, Cpu,
  Database, DollarSign, Download,
  File, FileArchive, FileAudio, FileCode, FileImage, FileSpreadsheet, FileText, FileVideo,
  Filter, Flag, Folder,
  Gift, GitBranch, GitMerge, Github, Globe, Grid,
  HardDrive, Hash, Heart, History, Home,
  Image, Key,
  Layers, Layout, Leaf, Lightbulb, Link, List, Lock,
  Mail, Map, Maximize2, Menu, MessageSquare, Monitor, Moon, Music,
  Network, Package, PenTool, PieChart,
  RefreshCw, Rocket,
  Save, Search, Send, Server, Settings, Share2, Shield, Smartphone, Star, Sun,
  Tag, Target, Terminal, Trash2, TreePine, Type,
  Upload, User, UserPlus, Users,
  Video, Wifi, WifiOff,
  Zap, Hash as HashIcon, List as ListIcon, type LucideIcon
} from 'lucide-react';

/**
 * 图标组件映射表 — 组件名 → React 组件
 * 使用直接命名导入，确保 tree-shaking 不会移除它们
 */
export const ICON_COMPONENTS: Record<string, LucideIcon> = {
  Activity, AlertCircle, AlertTriangle, Award,
  BarChart2, BarChart3, Bell, Book, BookOpen, Bookmark, Box, Brain,
  Calendar, Camera, CheckCircle, CheckSquare,
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  Clipboard, Clock, Clock4, Cloud, Code, Cpu,
  Database, DollarSign, Download,
  File, FileArchive, FileAudio, FileCode, FileImage, FileSpreadsheet, FileText, FileVideo,
  Filter, Flag, Folder,
  Gift, GitBranch, GitMerge, Github, Globe, Grid,
  HardDrive, Hash, Heart, History, Home,
  Image, Key,
  Layers, Layout, Leaf, Lightbulb, Link, Lock,
  Mail, Map, Maximize2, Menu, MessageSquare, Monitor, Moon, Music,
  Network, Package, PenTool, PieChart,
  RefreshCw, Rocket,
  Save, Search, Send, Server, Settings, Share2, Shield, Smartphone, Star, Sun,
  Tag, Target, Terminal, TreePine, Type,
  Upload, User, UserPlus, Users,
  Video, Wifi, WifiOff, Zap,
};