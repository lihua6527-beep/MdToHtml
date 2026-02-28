'use client';

import React from 'react';
import { 
  Cpu, Zap, TrendingUp, Award, Layers, Box, Globe, Tag, 
  Brain, Database, Terminal, GitBranch, Search, Filter, Hash, Star,
  Shield, Key, Lock, Code2, Rocket, Cloud, Server, Link2, Monitor,
  Activity, BarChart3, PieChart, LineChart, FileText, CheckCircle2,
  AlertTriangle, Info, Clock, Calendar, User, Users, Briefcase
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '@/components/ThemeProvider';

// -----------------------------------------------------------------------------
// Tag Data Mock
// -----------------------------------------------------------------------------
const SAMPLE_TAGS = [
  "自然语言处理", "信息抽取", "命名实体识别", "MUC", 
  "深度学习", "Transformer", "BERT", "GPT-4",
  "Python", "PyTorch", "TensorFlow", "CUDA",
  "数据预处理", "特征工程", "模型评估", "F1 Score",
  "Web开发", "React", "Next.js", "TailwindCSS",
  "系统架构", "微服务", "Docker", "Kubernetes",
  "安全性", "OAuth2", "JWT", "加密算法"
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
  return <Hash size={size} />;
};

// -----------------------------------------------------------------------------
// Style Variants
// -----------------------------------------------------------------------------

// Style A: Glassmorphism (Current, Refined)
// Feature: Translucent background, subtle border, blur, shadow
const StyleGlass = ({ tag }: { tag: string }) => (
  <div className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all select-none cursor-pointer
    bg-white/40 border-white/60 text-slate-700 backdrop-blur-md shadow-sm hover:shadow-md hover:bg-white/60 hover:-translate-y-0.5 active:translate-y-0 duration-200">
    <span className="text-slate-500 group-hover:text-primary transition-colors">{getSmartIcon(tag)}</span>
    <span>{tag}</span>
  </div>
);

// Style B: Tech / Cyber (Dark / High Contrast)
// Feature: Dark background, accent border, mono font feeling, glowing effect
const StyleTech = ({ tag }: { tag: string }) => (
  <div className="group flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border transition-all select-none cursor-pointer
    bg-slate-900 border-slate-700 text-slate-300 shadow-sm hover:border-primary/50 hover:text-primary hover:shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)] duration-200">
    <span className="opacity-70 group-hover:opacity-100 transition-opacity">{getSmartIcon(tag)}</span>
    <span className="tracking-wide">{tag}</span>
  </div>
);

// Style C: Modern Gradient (Soft & Friendly)
// Feature: Subtle gradient background, no border, colored text
const StyleGradient = ({ tag }: { tag: string }) => {
  // Simple deterministic color generation based on tag length
  const colors = [
    'from-blue-50 to-indigo-50 text-blue-700 hover:from-blue-100 hover:to-indigo-100',
    'from-emerald-50 to-teal-50 text-emerald-700 hover:from-emerald-100 hover:to-teal-100',
    'from-rose-50 to-orange-50 text-rose-700 hover:from-rose-100 hover:to-orange-100',
    'from-violet-50 to-purple-50 text-violet-700 hover:from-violet-100 hover:to-purple-100',
    'from-amber-50 to-yellow-50 text-amber-700 hover:from-amber-100 hover:to-yellow-100',
  ];
  const colorClass = colors[tag.length % colors.length];

  return (
    <div className={clsx(
      "group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all select-none cursor-pointer bg-gradient-to-br shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200",
      colorClass
    )}>
      <span className="opacity-80">{getSmartIcon(tag)}</span>
      <span>{tag}</span>
    </div>
  );
};

// Style D: Minimal Outline (Clean & Professional)
// Feature: Transparent bg, thin border, neutral colors
const StyleOutline = ({ tag }: { tag: string }) => (
  <div className="group flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all select-none cursor-pointer
    bg-transparent border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 duration-200">
    <span className="text-slate-400 group-hover:text-slate-600 transition-colors">{getSmartIcon(tag)}</span>
    <span>{tag}</span>
  </div>
);

// Style E: 3D / Pop (Playful)
// Feature: Strong shadow, lift effect, solid background
const StylePop = ({ tag }: { tag: string }) => (
  <div className="group flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border-b-2 transition-all select-none cursor-pointer
    bg-white border-slate-200 border-b-slate-300 text-slate-700 hover:-translate-y-0.5 hover:border-b-primary hover:text-primary active:translate-y-0 active:border-b-slate-300 duration-100">
    <span className="text-slate-400 group-hover:text-primary transition-colors">{getSmartIcon(tag)}</span>
    <span>{tag}</span>
  </div>
);


// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------
export default function TagShowcasePage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Tags Rendering Styles
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            请从以下 5 种高级渲染风格中选择一种作为最终方案。
            <br />
            <span className="text-sm text-slate-500">（点击标签可预览交互效果）</span>
          </p>
        </div>

        {/* Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Style A */}
          <section className="bg-slate-200/50 p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-white/50 px-3 py-1 rounded-bl-lg text-xs font-mono font-bold text-slate-500 border-b border-l border-slate-200">
              Style A: Glassmorphism (Refined)
            </div>
            <div className="flex flex-wrap gap-3 justify-center pt-6">
              {SAMPLE_TAGS.slice(0, 10).map((tag, i) => (
                <StyleGlass key={i} tag={tag} />
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-slate-500">
              特点：磨砂质感，半透明，适合放置在图片或彩色背景上。
            </p>
          </section>

          {/* Style B */}
          <section className="bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-slate-800 px-3 py-1 rounded-bl-lg text-xs font-mono font-bold text-slate-400 border-b border-l border-slate-700">
              Style B: Tech / Cyber
            </div>
            <div className="flex flex-wrap gap-3 justify-center pt-6">
              {SAMPLE_TAGS.slice(5, 15).map((tag, i) => (
                <StyleTech key={i} tag={tag} />
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-slate-400">
              特点：深色科技风，高对比度，适合强调技术属性。
            </p>
          </section>

          {/* Style C */}
          <section className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-slate-50 px-3 py-1 rounded-bl-lg text-xs font-mono font-bold text-slate-500 border-b border-l border-slate-200">
              Style C: Modern Gradient
            </div>
            <div className="flex flex-wrap gap-3 justify-center pt-6">
              {SAMPLE_TAGS.slice(10, 20).map((tag, i) => (
                <StyleGradient key={i} tag={tag} />
              ))}
            </div>
             <p className="mt-6 text-center text-xs text-slate-500">
              特点：柔和渐变，多彩亲和，适合现代化 UI。
            </p>
          </section>

          {/* Style D */}
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-slate-50 px-3 py-1 rounded-bl-lg text-xs font-mono font-bold text-slate-500 border-b border-l border-slate-200">
              Style D: Minimal Outline
            </div>
            <div className="flex flex-wrap gap-3 justify-center pt-6">
              {SAMPLE_TAGS.slice(0, 12).map((tag, i) => (
                <StyleOutline key={i} tag={tag} />
              ))}
            </div>
             <p className="mt-6 text-center text-xs text-slate-500">
              特点：极简描边，干净专业，通用性强。
            </p>
          </section>
          
           {/* Style E */}
           <section className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden col-span-1 md:col-span-2">
             <div className="absolute top-0 right-0 bg-white px-3 py-1 rounded-bl-lg text-xs font-mono font-bold text-slate-500 border-b border-l border-slate-200">
              Style E: 3D / Pop
            </div>
            <div className="flex flex-wrap gap-3 justify-center pt-6">
              {SAMPLE_TAGS.map((tag, i) => (
                <StylePop key={i} tag={tag} />
              ))}
            </div>
             <p className="mt-6 text-center text-xs text-slate-500">
              特点：微立体感，点击反馈强，活泼有趣。
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}