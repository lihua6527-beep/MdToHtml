import React from 'react';
import { 
  Cpu, Zap, TrendingUp, Award, Layers, Box, Globe, Tag, 
  Brain, Database, Terminal, GitBranch, Search, Filter, Hash, Star,
  Shield, Key, Lock, Code2, Rocket, Cloud, Server, Link2, Monitor,
  Activity, BarChart3, PieChart, LineChart, FileText, CheckCircle2,
  AlertTriangle, Info, Clock, Calendar, User, Users, Briefcase
} from 'lucide-react';
import { clsx } from 'clsx';

// -----------------------------------------------------------------------------
// Types & Constants
// -----------------------------------------------------------------------------

export type TagStyleType = 'glass' | 'tech' | 'gradient' | 'outline' | 'pop';

export const TAG_STYLES: { id: TagStyleType; name: string; description: string }[] = [
  { id: 'glass', name: 'Glass', description: '磨砂质感 (默认)' },
  { id: 'tech', name: 'Tech', description: '深色科技' },
  { id: 'gradient', name: 'Gradient', description: '柔和渐变' },
  { id: 'outline', name: 'Outline', description: '极简描边' },
  { id: 'pop', name: 'Pop', description: '立体波普' },
];

// -----------------------------------------------------------------------------
// Icon Mapping Logic (Advanced)
// -----------------------------------------------------------------------------
const getSmartIcon = (tag: string, size = 14) => {
  const lower = tag.toLowerCase();
  
  // AI / ML / NLP
  if (lower.match(/ai|ml|nlp|自然语言|深度学习|智能|brain|net/)) return <Brain size={size} />;
  if (lower.match(/model|模型|bert|gpt|llm|transformer/)) return <Box size={size} />;
  if (lower.match(/data|数据|dataset|语料/)) return <Database size={size} />;
  if (lower.match(/chart|vis|分析|评估|score|f1|acc/)) return <BarChart3 size={size} />;
  
  // Dev / Code
  if (lower.match(/code|python|js|java|rust|go|lang|dev/)) return <Code2 size={size} />;
  if (lower.match(/git|version|branch|commit|muc/)) return <GitBranch size={size} />;
  if (lower.match(/terminal|shell|bash|cmd|cli/)) return <Terminal size={size} />;
  if (lower.match(/api|web|http|net|react|vue|next/)) return <Globe size={size} />;
  
  // Infra / System
  if (lower.match(/cloud|aws|azure|gcp|云/)) return <Cloud size={size} />;
  if (lower.match(/server|docker|k8s|container|服务/)) return <Server size={size} />;
  if (lower.match(/cpu|gpu|cuda|chip|硬件|算力/)) return <Cpu size={size} />;
  
  // Security
  if (lower.match(/sec|auth|login|jwt|key|lock|安全|加密/)) return <Shield size={size} />;
  
  // General
  if (lower.match(/fast|speed|opt|perf|快|速|优化/)) return <Zap size={size} />;
  if (lower.match(/top|best|sota|high|高级|顶会/)) return <TrendingUp size={size} />;
  if (lower.match(/award|win|奖|优秀/)) return <Award size={size} />;
  if (lower.match(/layer|stack|层|架构/)) return <Layers size={size} />;
  if (lower.match(/time|date|history|历史|时间/)) return <Clock size={size} />;
  if (lower.match(/user|human|people|用户/)) return <User size={size} />;
  if (lower.match(/work|job|task|任务/)) return <Briefcase size={size} />;
  if (lower.match(/link|url|ref|引用/)) return <Link2 size={size} />;
  
  // Default
  return <Tag size={size} />;
};

// -----------------------------------------------------------------------------
// Style Components
// -----------------------------------------------------------------------------

const StyleGlass = ({ tag }: { tag: string }) => (
  <div className={clsx(
      "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all select-none shadow-sm",
      "bg-white/40 border-white/50 text-slate-800 backdrop-blur-md hover:bg-white/50"
  )}>
    <span className="text-slate-600">{getSmartIcon(tag)}</span>
    <span>{tag}</span>
  </div>
);

const StyleTech = ({ tag }: { tag: string }) => (
  <div className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border transition-all select-none
    bg-slate-900 border-slate-700 text-slate-300 shadow-sm hover:border-primary/50 hover:text-primary hover:shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)] duration-200">
    <span className="opacity-70">{getSmartIcon(tag)}</span>
    <span className="tracking-wide">{tag}</span>
  </div>
);

const StyleGradient = ({ tag }: { tag: string }) => {
  const colors = [
    'from-blue-50 to-indigo-50 text-blue-700 border-blue-100',
    'from-emerald-50 to-teal-50 text-emerald-700 border-emerald-100',
    'from-rose-50 to-orange-50 text-rose-700 border-rose-100',
    'from-violet-50 to-purple-50 text-violet-700 border-violet-100',
    'from-amber-50 to-yellow-50 text-amber-700 border-amber-100',
  ];
  const colorClass = colors[tag.length % colors.length];

  return (
    <div className={clsx(
      "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all select-none bg-gradient-to-br shadow-sm border",
      colorClass
    )}>
      <span className="opacity-80">{getSmartIcon(tag)}</span>
      <span>{tag}</span>
    </div>
  );
};

const StyleOutline = ({ tag }: { tag: string }) => (
  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all select-none
    bg-transparent border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 duration-200">
    <span className="text-slate-400">{getSmartIcon(tag)}</span>
    <span>{tag}</span>
  </div>
);

const StylePop = ({ tag }: { tag: string }) => (
  <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border-b-2 transition-all select-none
    bg-white border-slate-200 border-b-slate-300 text-slate-700 hover:-translate-y-0.5 hover:border-b-primary hover:text-primary duration-100">
    <span className="text-slate-400">{getSmartIcon(tag)}</span>
    <span>{tag}</span>
  </div>
);

// -----------------------------------------------------------------------------
// Main Renderer Component
// -----------------------------------------------------------------------------

export const TagRenderer = ({ tags, style = 'glass' }: { tags: string[], style?: TagStyleType }) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="mt-6 flex flex-wrap gap-2 justify-center">
      {tags.map((tag, i) => {
        const cleanTag = tag.trim();
        if (!cleanTag) return null;

        switch (style) {
          case 'tech': return <StyleTech key={i} tag={cleanTag} />;
          case 'gradient': return <StyleGradient key={i} tag={cleanTag} />;
          case 'outline': return <StyleOutline key={i} tag={cleanTag} />;
          case 'pop': return <StylePop key={i} tag={cleanTag} />;
          case 'glass':
          default: return <StyleGlass key={i} tag={cleanTag} />;
        }
      })}
    </div>
  );
};
