'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Maximize2, Palette, MoreHorizontal, LayoutGrid, Type, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Edit, Check, Trash2, GripHorizontal, GripVertical, Minus, Plus, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

// --- Types ---

type CardStyle = 'normal' | 'highlight' | 'stat' | 'quote' | 'warning' | 'code' | 'summary' | 'orange';
type CardColor = 'default' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5';

interface CardProps {
  title: string;
  content: string;
  style?: CardStyle | string; // Allow string for legacy compatibility
  attributes?: Record<string, any>;
  inheritedColor?: string; // Color inherited from Section
  colSpan?: number;
  rowSpan?: number;
  isActive?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
  editMode?: boolean;
  onAttributeChange?: (attributes: Record<string, any>) => void;
  onContentChange?: (newContent: string) => void;
  onTitleChange?: (newTitle: string) => void;
  onMove?: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onDelete?: () => void;
}

// --- Constants ---
const STYLE_LABELS: Record<CardStyle, string> = {
  normal: '标准',
  highlight: '高亮',
  stat: '指标',
  quote: '引用',
  warning: '警告',
  code: '代码',
  summary: '摘要',
  orange: '强调'
};

const CARD_COLORS: { value: CardColor; label: string; class: string }[] = [
  { value: 'default', label: '默认', class: 'bg-white border-border-soft' },
  { value: 'chart-1', label: '配色一', class: 'bg-chart-1' },
  { value: 'chart-2', label: '配色二', class: 'bg-chart-2' },
  { value: 'chart-3', label: '配色三', class: 'bg-chart-3' },
  { value: 'chart-4', label: '配色四', class: 'bg-chart-4' },
  { value: 'chart-5', label: '配色五', class: 'bg-chart-5' },
];

const TEXT_SIZES = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];

// --- Component: Card ---

export const Card: React.FC<CardProps> = ({ 
  title, 
  content, 
  style = 'normal',
  attributes = {},
  inheritedColor,
  colSpan = 1, 
  rowSpan = 1, 
  isActive, 
  isSelected,
  onSelect,
  onClick, 
  editMode,
  onAttributeChange,
  onContentChange,
  onTitleChange,
  onMove,
  onDelete
}) => {
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempContent, setTempContent] = useState(content);
  const [tempTitle, setTempTitle] = useState(title);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // --- Dock Dragging State ---
  const [dockPosition, setDockPosition] = useState<{x: number, y: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  // --- Context Menu State ---
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Font Sizes & Alignment
  const titleSize = attributes['title-size'] || (style === 'stat' ? 'text-4xl' : 'text-2xl');
  const contentSize = attributes['content-size'] || (style === 'stat' ? 'text-sm' : 'text-base');
  const titleAlign = attributes['title-align'] || 'center';
  const contentAlign = attributes['content-align'] || 'left';
  
  // Color handling: Priority: 1. Card Attribute 2. Inherited Section Color 3. Default
  // FIXED: Ensure colors are strictly from Chart palette as requested by user.
  let rawColor = (attributes['card-color'] as string) || inheritedColor || 'default';
  
  // Normalize potentially complex values if legacy data exists (though we should enforce strict values)
  if (rawColor.includes('bg-chart-')) {
     // Extract chart-X from class string if necessary, but ideally we stick to simple values
     const match = rawColor.match(/chart-\d/);
     if (match) rawColor = match[0];
  }

  // Validate against allowed colors
  const forcedCardColor: CardColor = (['default', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'].includes(rawColor))
    ? rawColor as CardColor
    : 'default';

  // [Fix: Remove Legacy Layout Locks]
  // Previously, specific styles (like summary/stat) might force col-span.
  // We now strictly respect the passed 'colSpan' prop which comes from Section's grid system.
  // The 'style' prop should ONLY affect visual styling, not layout dimensions.


  const adjustFontSize = (target: 'title' | 'content', direction: 'up' | 'down') => {
    const currentSize = target === 'title' ? titleSize : contentSize;
    const currentIndex = TEXT_SIZES.indexOf(currentSize);
    let nextIndex = currentIndex;
    
    if (currentIndex === -1) {
      // If not found, default to base/2xl then adjust
      nextIndex = target === 'title' ? 5 : 2;
    }

    if (direction === 'up') {
      nextIndex = Math.min(nextIndex + 1, TEXT_SIZES.length - 1);
    } else {
      nextIndex = Math.max(nextIndex - 1, 0);
    }

    onAttributeChange?.({ [`${target}-size`]: TEXT_SIZES[nextIndex] });
  };

  const setAlignment = (target: 'title' | 'content', align: 'left' | 'center' | 'right') => {
    onAttributeChange?.({ [`${target}-align`]: align });
  };

  useEffect(() => {
    setTempContent(content);
  }, [content]);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  useEffect(() => {
    if (isEditingContent && textareaRef.current) {
        // Auto-resize on init
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        textareaRef.current.focus();
    }
  }, [isEditingContent]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
        titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  // --- Dragging Logic ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      setDockPosition(prev => {
        const currentX = prev ? prev.x : (window.innerWidth / 2);
        const currentY = prev ? prev.y : (window.innerHeight - 100); // approx bottom-8
        return {
          x: currentX + dx,
          y: currentY + dy
        };
      });
      
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    
    // Initialize dockPosition if it's null (first drag)
    if (!dockPosition && dockRef.current) {
       const rect = dockRef.current.getBoundingClientRect();
       setDockPosition({
         x: rect.left + rect.width / 2, // center point
         y: rect.top
       });
    }
  };

  const handleContentSave = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setIsEditingContent(false);
      if (tempContent !== content) {
          onContentChange?.(tempContent);
      }
  };

  const handleTitleSave = (e?: React.FormEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      setIsEditingTitle(false);
      if (tempTitle !== title) {
          // Remove potential leading ### if user typed them, or just send as is
          // The hook adds ### back.
          // Let's strip ### from tempTitle if present to avoid duplication
          const cleanTitle = tempTitle.replace(/^#+\s*/, '');
          onTitleChange?.(cleanTitle);
      }
  };

  const handleCardClick = (e: React.MouseEvent) => {
      if (editMode) {
          e.stopPropagation();
          onSelect?.();
      } else {
          onClick?.();
      }
  };

  // 1. Height Logic: 'h-full' to ensure cards in the same row stretch to equal height.
  const baseClasses = "rounded-card transition-all duration-300 hover:shadow-card flex flex-col overflow-hidden h-full cursor-pointer relative group";
  
  // 2. Color Logic (Theme Optimized) - STRICTLY CHART COLORS ONLY
  const styleVariants: Record<CardStyle, string> = {
    // Normal: Clean white background, soft border
    normal: "bg-white shadow-sm border border-border-soft hover:shadow-md text-text-primary",
    
    // Highlight: White background, distinct border
    highlight: "bg-white shadow-sm border border-secondary/40 hover:border-secondary/60 text-text-primary",
    
    // Stat: Centered, bold, white background
    stat: "bg-white shadow-sm border border-border-soft text-center justify-center items-center py-6 text-text-primary",
    
    // Quote: Left accent, white background
    quote: "bg-white shadow-sm border-l-[4px] border-l-secondary text-text-secondary italic",
    
    // Warning: White background, red border
    warning: "bg-white shadow-sm border border-red-200 text-accent",
    
    // Code: White background, monospace
    code: "bg-white shadow-inner text-text-secondary font-mono text-sm border border-gray-200",
    
    // Summary: White background
    summary: "bg-white shadow-sm border border-amber-200 text-text-primary",

    // Orange: Hero/Intro style (from mature template)
    orange: "bg-white shadow-sm border border-orange-200 text-text-primary",
  };

  const colorVariants: Record<CardColor, string> = {
    default: "", 
    'chart-1': "bg-chart-1/10 border-chart-1/20 text-text-primary", 
    'chart-2': "bg-chart-2/10 border-chart-2/20 text-text-primary",
    'chart-3': "bg-chart-3/10 border-chart-3/20 text-text-primary",
    'chart-4': "bg-chart-4/10 border-chart-4/20 text-text-primary",
    'chart-5': "bg-chart-5/10 border-chart-5/20 text-text-primary",
  };
  
  const bgVariants: Record<CardColor, string> = {
      default: "",
      'chart-1': "bg-chart-1/5",
      'chart-2': "bg-chart-2/5",
      'chart-3': "bg-chart-3/5",
      'chart-4': "bg-chart-4/5",
      'chart-5': "bg-chart-5/5",
  };

  const activeClass = isActive && !isSelected ? "ring-2 ring-primary ring-offset-2 transform scale-[1.02]" : "";
  const selectedClass = isSelected ? "ring-2 ring-secondary ring-offset-2 z-[20] transform-none overflow-visible transition-none" : "overflow-hidden";

  const spanClasses = clsx({
    // Desktop: 12-Column System
    // STRICT RULE: Respect passed colSpan prop absolutely. 
    // Do not let style (summary/stat) override this unless explicitly handled in Section.
    'col-span-1': colSpan === 1,   // 1/12
    'col-span-2': colSpan === 2,   // 1/6
    'col-span-3': colSpan === 3,   // 1/4 (Standard 4-col)
    'col-span-4': colSpan === 4,   // 1/3 (Standard 3-col)
    'col-span-6': colSpan === 6,   // 1/2 (Half)
    'col-span-8': colSpan === 8,   // 2/3
    'col-span-9': colSpan === 9,   // 3/4
    'col-span-12': colSpan >= 12,  // Full
    'col-span-full': colSpan >= 12, // Legacy fallback
    
    'row-span-1': rowSpan === 1,
    'row-span-2': rowSpan === 2,
  });

  const isWide = colSpan && colSpan >= 2;
  const isWideAndShort = isWide && content.length < 100 && style === 'normal';

  // Resolve effective style: If legacy color style is used, map it to normal + color (logic only for display)
  // Actually, we keep the style as is, but if it matches a color name, we might want to treat it?
  // For now, let's rely on explicit 'card-color'.

  const gridStyle: React.CSSProperties = {
      ...(attributes.area ? { gridArea: attributes.area } : {}),
      ...(attributes['justify-self'] ? { justifySelf: attributes['justify-self'] } : {}),
      ...(attributes['align-self'] ? { alignSelf: attributes['align-self'] } : {}),
  };

  return (
    <>
    {/* Context Menu */}
    {contextMenu && (
        <div 
            className="fixed z-[10000] bg-white border border-border-soft shadow-xl rounded-lg py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
        >
            <button 
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                    setContextMenu(null);
                }}
            >
                <Trash2 size={16} />
                删除卡片
            </button>
        </div>
    )}

    <div 
      className={twMerge(baseClasses, styleVariants[style as CardStyle] || styleVariants.normal, colorVariants[forcedCardColor], spanClasses, activeClass, selectedClass)}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      style={gridStyle}
    >
      {/* Background Overlay (Explicit DIV for robust rendering) */}
      {forcedCardColor !== 'default' && (
          <div className={twMerge("absolute inset-0 pointer-events-none z-0", bgVariants[forcedCardColor])} />
      )}
      
      {/* Content Wrapper (Relative z-10 to stay above background) */}
      <div className="relative z-10 w-full h-full flex flex-col">

      {/* Floating Dock - Global Property Panel */}
      {editMode && isSelected && !isEditingContent && (
        <div 
            ref={dockRef}
            className="fixed z-[9999] animate-in slide-in-from-bottom-10 duration-300"
            style={{
                left: dockPosition ? dockPosition.x : '50%',
                top: dockPosition ? dockPosition.y : undefined,
                bottom: dockPosition ? undefined : '2rem',
                transform: dockPosition ? 'translate(-50%, 0)' : 'translate(-50%, 0)'
            }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="bg-white/95 backdrop-blur-md shadow-2xl border border-border-soft rounded-2xl p-3 flex flex-col gap-3 text-sm min-w-[580px] cursor-default"
          >
            
            {/* Row 1: Fixed Controls (Drag, Actions, Typography) */}
            <div className="flex items-center justify-between gap-4 border-b border-border-soft pb-2">
                <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    <div 
                        className="cursor-move text-text-muted hover:text-text-primary px-1"
                        onMouseDown={handleMouseDown}
                    >
                        <GripVertical size={20} />
                    </div>

                    {/* Actions Group */}
                    <div className="flex gap-2">
                        {/* Vertical Moves */}
                        <div className="flex flex-col gap-1">
                                <button onClick={(e) => { e.stopPropagation(); onMove?.('up'); }} className="p-1.5 hover:bg-primary/10 rounded-md text-text-secondary hover:text-primary transition-colors" title="上移"><ArrowUp size={16} /></button>
                                <button onClick={(e) => { e.stopPropagation(); onMove?.('down'); }} className="p-1.5 hover:bg-primary/10 rounded-md text-text-secondary hover:text-primary transition-colors" title="下移"><ArrowDown size={16} /></button>
                        </div>
                        {/* Horizontal Moves */}
                        <div className="flex flex-col gap-1">
                                <button onClick={(e) => { e.stopPropagation(); onMove?.('left'); }} className="p-1.5 hover:bg-primary/10 rounded-md text-text-secondary hover:text-primary transition-colors" title="左移"><ArrowLeft size={16} /></button>
                                <button onClick={(e) => { e.stopPropagation(); onMove?.('right'); }} className="p-1.5 hover:bg-primary/10 rounded-md text-text-secondary hover:text-primary transition-colors" title="右移"><ArrowRight size={16} /></button>
                        </div>
                    </div>
                    
                    <div className="h-8 w-px bg-border-soft mx-1" />

                    <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setIsEditingContent(true); }} className="flex flex-col items-center justify-center p-2 hover:bg-primary/10 rounded-md text-text-secondary hover:text-primary transition-colors gap-1" title="编辑内容">
                            <Edit size={18} />
                            <span className="text-[10px]">编辑</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); if(confirm('确认删除?')) onDelete?.(); }} className="flex flex-col items-center justify-center p-2 hover:bg-red-50 rounded-md text-text-secondary hover:text-red-500 transition-colors gap-1" title="删除">
                            <Trash2 size={18} />
                            <span className="text-[10px]">删除</span>
                        </button>
                    </div>
                </div>

                {/* Typography Group */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-2">
                        {/* Title Controls */}
                        <div className="flex items-center gap-3">
                            <span className="text-text-secondary text-xs w-6">标题</span>
                            {/* Size */}
                            <div className="flex items-center bg-bg-page rounded-lg border border-border-soft overflow-hidden h-6">
                                <button onClick={(e) => { e.stopPropagation(); adjustFontSize('title', 'down'); }} className="px-1.5 hover:bg-primary/5 text-text-secondary h-full flex items-center"><Minus size={10} /></button>
                                <span className="w-6 text-center text-[10px] font-mono leading-none">{TEXT_SIZES.indexOf(titleSize)}</span>
                                <button onClick={(e) => { e.stopPropagation(); adjustFontSize('title', 'up'); }} className="px-1.5 hover:bg-primary/5 text-text-secondary h-full flex items-center"><Plus size={10} /></button>
                            </div>
                            {/* Alignment */}
                            <div className="flex items-center bg-bg-page rounded-lg border border-border-soft overflow-hidden h-6">
                                <button onClick={(e) => { e.stopPropagation(); setAlignment('title', 'left'); }} className={clsx("px-1.5 h-full flex items-center transition-colors", titleAlign === 'left' ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-primary/5")}><AlignLeft size={12} /></button>
                                <div className="w-px h-3 bg-border-soft" />
                                <button onClick={(e) => { e.stopPropagation(); setAlignment('title', 'center'); }} className={clsx("px-1.5 h-full flex items-center transition-colors", titleAlign === 'center' ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-primary/5")}><AlignCenter size={12} /></button>
                            </div>
                        </div>
                        
                        {/* Content Controls */}
                        <div className="flex items-center gap-3">
                            <span className="text-text-secondary text-xs w-6">正文</span>
                            {/* Size */}
                            <div className="flex items-center bg-bg-page rounded-lg border border-border-soft overflow-hidden h-6">
                                <button onClick={(e) => { e.stopPropagation(); adjustFontSize('content', 'down'); }} className="px-1.5 hover:bg-primary/5 text-text-secondary h-full flex items-center"><Minus size={10} /></button>
                                <span className="w-6 text-center text-[10px] font-mono leading-none">{TEXT_SIZES.indexOf(contentSize)}</span>
                                <button onClick={(e) => { e.stopPropagation(); adjustFontSize('content', 'up'); }} className="px-1.5 hover:bg-primary/5 text-text-secondary h-full flex items-center"><Plus size={10} /></button>
                            </div>
                            {/* Alignment */}
                            <div className="flex items-center bg-bg-page rounded-lg border border-border-soft overflow-hidden h-6">
                                <button onClick={(e) => { e.stopPropagation(); setAlignment('content', 'left'); }} className={clsx("px-1.5 h-full flex items-center transition-colors", contentAlign === 'left' ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-primary/5")}><AlignLeft size={12} /></button>
                                <div className="w-px h-3 bg-border-soft" />
                                <button onClick={(e) => { e.stopPropagation(); setAlignment('content', 'center'); }} className={clsx("px-1.5 h-full flex items-center transition-colors", contentAlign === 'center' ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-primary/5")}><AlignCenter size={12} /></button>
                                <div className="w-px h-3 bg-border-soft" />
                                <button onClick={(e) => { e.stopPropagation(); setAlignment('content', 'right'); }} className={clsx("px-1.5 h-full flex items-center transition-colors", contentAlign === 'right' ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-primary/5")}><AlignRight size={12} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Variable Content (Styles & Colors & Width) */}
            <div className="flex items-start gap-6">
                {/* Style Selector */}
                <div className="flex flex-col gap-2 flex-1">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">卡片样式</span>
                    <div className="flex flex-wrap gap-1.5">
                        {(['normal', 'highlight', 'stat', 'quote', 'warning', 'code', 'summary', 'orange'] as CardStyle[]).map(s => (
                            <button
                                key={s}
                                onClick={(e) => { e.stopPropagation(); onAttributeChange?.({ 'card-style': s }); }}
                                className={clsx(
                                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                                    s === style 
                                        ? "bg-primary text-white border-primary shadow-sm" 
                                        : "bg-bg-page text-text-secondary border-border-soft hover:border-primary/50 hover:text-primary"
                                )}
                            >
                                {STYLE_LABELS[s]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-px bg-border-soft self-stretch" />

                {/* Color Picker */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">卡片颜色</span>
                    <div className="flex items-center gap-1.5">
                        {CARD_COLORS.map(c => (
                            <button
                                key={c.value}
                                onClick={(e) => { e.stopPropagation(); onAttributeChange?.({ 'card-color': c.value }); }}
                                className={clsx(
                                    "w-6 h-6 rounded-full border transition-all hover:scale-110",
                                    c.class,
                                    forcedCardColor === c.value ? "ring-2 ring-primary ring-offset-2 scale-110" : "border-transparent hover:border-border-soft"
                                )}
                                title={c.label}
                            />
                        ))}
                    </div>
                </div>

                 <div className="w-px bg-border-soft self-stretch" />
                 
                {/* Layout/Width (Moved to Row 2) */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">宽度占比</span>
                    <div className="flex items-center gap-1">
                        {[
                            { label: '1/1', title: '全宽 (1/1)', value: 12 },
                            { label: '1/2', title: '半宽 (1/2)', value: 6 },
                            { label: '1/3', title: '三分之一 (1/3)', value: 4 },
                            { label: '1/4', title: '四分之一 (1/4)', value: 3 }
                        ].map(opt => (
                            <button 
                              key={opt.label}
                              onClick={(e) => { e.stopPropagation(); onAttributeChange?.({ 'col-span': String(opt.value) }); }}
                              className={clsx(
                                  "px-2 h-8 flex items-center justify-center rounded-lg border transition-all text-xs font-medium min-w-[32px]",
                                  (colSpan === opt.value)
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-bg-page border-border-soft text-text-muted hover:border-primary/50 hover:text-primary"
                              )}
                              title={opt.title}
                            >
                              {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={clsx(
        "px-6 pt-6 pb-3",
        style === 'stat' && "pb-0 pt-0", // Stat handles its own padding
        style === 'code' && "bg-black/5 border-b border-border-soft py-3",
        // Alignment classes
        titleAlign === 'center' && "text-center flex justify-center",
        titleAlign === 'left' && "text-left flex justify-start",
        // Overrides for specific styles or legacy logic
        isWideAndShort && "flex justify-center text-center", 
        // Note: We prioritize explicit user alignment over auto-alignment, 
        // but keep 'stat' style centered by default if not set.
        // Actually, styleVariants.stat has 'text-center' which might conflict.
        // Let's rely on the explicit titleAlign state.
        "flex-none" // Header shouldn't shrink
      )}>
        {isEditingTitle && editMode && isSelected ? (
             <form onSubmit={handleTitleSave} onClick={e => e.stopPropagation()} className="w-full">
                <input
                    ref={titleInputRef}
                    value={tempTitle.replace(/^#+\s*/, '')} // Show only text
                    onChange={(e) => setTempTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    className={clsx(
                        "w-full bg-bg-page border border-primary rounded px-2 py-1 font-bold text-lg focus:outline-none",
                        titleAlign === 'center' ? "text-center" : "text-left"
                    )}
                    placeholder="Card Title"
                />
             </form>
        ) : (
            <h3 
              onClick={(e) => {
                  if (editMode && isSelected) {
                      e.stopPropagation();
                      setIsEditingTitle(true);
                  }
              }}
              className={clsx(
                "font-bold tracking-tight font-heading transition-all duration-200 w-full",
                // Typography based on Theme
                style === 'warning' && "text-accent",
                style === 'code' && "text-text-muted text-sm font-mono",
                style !== 'code' && style !== 'warning' && style !== 'stat' && "text-primary",
                style === 'stat' && "text-primary mb-2",
                // Dynamic Font Size
                titleSize,
                editMode && isSelected && "hover:bg-primary/5 cursor-text border border-transparent hover:border-primary/20 rounded px-1 -mx-1 transition-colors"
              )}
            >
              {title.replace('### ', '')}
            </h3>
        )}
      </div>
      
      {/* Content */}
      <div className={clsx(
        "px-6 pb-6 pt-0 flex-grow font-body leading-relaxed relative transition-all duration-200",
        // Dynamic Content Font Size
        contentSize,
        // Alignment
        contentAlign === 'center' && "text-center",
        contentAlign === 'left' && "text-left",
        
        style === 'stat' && "pt-0 pb-6 text-text-muted font-medium uppercase tracking-wide",
        style === 'code' && "p-4 overflow-x-auto text-sm", 
        style === 'quote' && "pt-3",
        isWideAndShort && "flex justify-center items-center pt-0 text-center",
        isWide && !isWideAndShort && "flex flex-col" 
      )}>
        {isEditingContent ? (
            <div className="w-full h-auto min-h-full relative z-30" onClick={e => e.stopPropagation()}>
                <textarea
                    ref={textareaRef}
                    value={tempContent}
                    onChange={(e) => {
                        setTempContent(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    className={clsx(
                        "w-full bg-bg-page border border-primary rounded resize-none font-mono focus:outline-none focus:ring-1 focus:ring-primary overflow-hidden",
                        "p-2", // Consistent padding
                        contentAlign === 'center' ? "text-center" : "text-left"
                    )}
                    placeholder="Enter markdown..."
                />
                <button 
                    onClick={handleContentSave}
                    className="absolute bottom-2 right-2 p-1 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors z-40"
                >
                    <Check size={16} />
                </button>
            </div>
        ) : (
            <div 
                onClick={(e) => {
                    if (editMode && isSelected) {
                        e.stopPropagation();
                        setIsEditingContent(true);
                    }
                }}
                className={clsx(
                    "w-full h-full",
                    editMode && isSelected && "hover:bg-primary/5 cursor-text border border-transparent hover:border-primary/20 rounded p-1 -m-1 transition-colors",
                    // Fix: Remove max-w-3xl constraint for wide cards to allow full width usage
                    // isWide && !isWideAndShort && "max-w-3xl w-full" 
                    isWide && "w-full"
                )}
            >
                {style === 'code' ? (
                <pre className="whitespace-pre-wrap font-mono text-sm">{content}</pre>
                ) : (
                <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]} 
              rehypePlugins={[rehypeKatex]}
              components={{
                    // Custom styling for markdown elements to match theme
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1 text-left" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-left" {...props} />,
                    a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-text-primary" {...props} />,
                    code: ({node, ...props}) => <code className="bg-bg-page px-1.5 py-0.5 rounded text-sm font-mono text-text-secondary" {...props} />,
                    // Table Styling
                    table: ({node, ...props}) => (
                      <div className="overflow-x-auto my-4 rounded-lg border border-border-soft">
                        <table className="w-full text-sm text-left" {...props} />
                      </div>
                    ),
                    thead: ({node, ...props}) => <thead className="bg-bg-page text-text-primary font-bold border-b border-border-soft" {...props} />,
                    tbody: ({node, ...props}) => <tbody className="divide-y divide-border-soft bg-white" {...props} />,
                    tr: ({node, ...props}) => <tr className="hover:bg-bg-page/40 transition-colors" {...props} />,
                    th: ({node, ...props}) => <th className="px-4 py-3 font-semibold whitespace-nowrap" {...props} />,
                    td: ({node, ...props}) => <td className="px-4 py-3 text-text-secondary align-top" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/30 pl-4 py-1 my-2 text-text-muted italic bg-bg-page/30 rounded-r" {...props} />,
                    }}
                >
                    {content}
                </ReactMarkdown>
                )}
            </div>
        )}
      </div>
      </div>
    </div>
    </>
  );
};
