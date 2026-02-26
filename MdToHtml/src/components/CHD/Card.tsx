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
import { Maximize2, Palette, MoreHorizontal, LayoutGrid, Type, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Edit, Check, Trash2, Minus, Plus, AlignLeft, AlignCenter, AlignRight, Cpu, Zap, TrendingUp, Tag, Award, Layers, Box, Globe } from 'lucide-react';
import { getShapeClass, CardShape } from '../../lib/shapes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

// --- Types ---

type CardStyle = 'normal' | 'highlight' | 'quote' | 'code';
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
  quote: '引用',
  code: '代码',
};

const CARD_COLORS: { value: CardColor; label: string; class: string }[] = [
  { value: 'default', label: '默认', class: 'bg-bg-card border-border-soft' },
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
  const [badgeError, setBadgeError] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempContent, setTempContent] = useState(content);
  const [tempTitle, setTempTitle] = useState(title);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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
  const titleSize = attributes['title-size'] || (style === 'highlight' ? 'text-3xl' : 'text-2xl');
  const contentSize = attributes['content-size'] || (style === 'highlight' ? 'text-sm text-slate-500' : 'text-base');
  const titleAlign = attributes['title-align'] || 'center';
  const contentAlign = attributes['content-align'] || 'left';
  
  // Color handling: Priority: 1. Card Attribute 2. Inherited Section Color 3. Default
  // FIXED: Ensure colors are strictly from Chart palette as requested by user.
  let rawColor = (attributes['card-color'] as string) || inheritedColor || 'default';
  
  // Normalize potentially complex values if legacy data exists (though we should enforce strict values)
  if (typeof rawColor === 'string' && rawColor.includes('bg-chart-')) {
     const match = rawColor.match(/chart-\d/);
     if (match) rawColor = match[0];
  }

  // Validate against allowed colors
  const forcedCardColor: CardColor = (['default', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'].includes(rawColor))
    ? rawColor as CardColor
    : 'default';

  // Style Variants (Simplified to 4 core styles)
  const shapeVariants: Record<CardStyle, string> = {
    normal: "bg-white shadow-sm border border-border-soft hover:shadow-md text-text-primary",
    highlight: "bg-white shadow-md border-2 border-slate-200 hover:border-slate-300 text-text-primary", // Visuals handled by dynamic defaults
    quote: "bg-slate-50/50 shadow-sm border-l-[6px] border-l-slate-300 text-text-secondary italic pl-4",
    code: "bg-slate-100/50 shadow-inner text-text-secondary font-mono text-sm border border-border-soft",
  };

  const getCardStyle = () => {
    const baseStyle = shapeVariants[style as CardStyle] || shapeVariants.normal;
    
    // Apply color if not default
    if (forcedCardColor !== 'default') {
        // When a color is applied, we adjust the text color for contrast if needed
        // For chart colors, we usually want white or dark text depending on the theme
        return twMerge(baseStyle, `bg-${forcedCardColor} border-none text-white`);
    }
    
    return baseStyle;
  };


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
  // Refactored: Split baseClasses into layout-only and visual parts for Composition Pattern
  const layoutClasses = "transition-all duration-300 h-full cursor-pointer relative group";
  
  // 2. Color Logic (Theme Optimized) - STRICTLY CHART COLORS ONLY
  // [Removed duplicate shapeVariants definition]

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

  // --- Composition Pattern Logic ---
  const shape = (attributes.shape as CardShape) || 'rect';
  const isCustomShape = shape && shape !== 'rect';
  const shapeClass = getShapeClass(shape);

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
      className={twMerge(
          layoutClasses, 
          spanClasses, 
          activeClass, 
          selectedClass,
          // Standard Card Styles (only applied if NOT custom shape)
          !isCustomShape && [
              "rounded-card hover:shadow-card flex flex-col overflow-hidden",
              shapeVariants[style as CardStyle] || shapeVariants.normal, 
              colorVariants[forcedCardColor]
          ],
          // Custom Shape Wrapper Styles
          isCustomShape && "drop-shadow-md", // Apply drop-shadow to wrapper for shapes
          // Circle specific aspect ratio
          shape === 'circle' && "aspect-square flex flex-col items-center justify-center text-center p-6"
      )}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      style={gridStyle}
    >
      {/* Floating Badge (Visual) */}
      {shape === 'floating' && attributes.badge && (
          <div className="absolute -top-5 -right-5 z-20 transform rotate-12 shadow-lg animate-in zoom-in duration-300 pointer-events-none">
              <span className="bg-amber-400 text-amber-900 font-bold text-sm w-14 h-14 rounded-full border-4 border-white shadow-lg flex items-center justify-center leading-tight">
                  {attributes.badge}
              </span>
          </div>
      )}

      {/* 1. Shape Layer (Custom Shapes Only) */}
      {isCustomShape && (
          <div 
            className={twMerge(
                "absolute inset-0 z-0",
                shapeVariants[style as CardStyle] || shapeVariants.normal,
                colorVariants[forcedCardColor],
                "shadow-none border-none", // Remove box-shadow/border from shape layer as it might be clipped weirdly or we rely on drop-shadow
                shapeClass
            )}
          />
      )}

      {/* 2. Background Overlay (Standard Cards Only) */}
      {!isCustomShape && forcedCardColor !== 'default' && (
          <div className={twMerge("absolute inset-0 pointer-events-none z-0", bgVariants[forcedCardColor])} />
      )}
      
      {/* 3. Content Wrapper (Relative z-10 to stay above background) */}
      <div className={twMerge(
          "relative z-10 w-full h-full flex flex-col",
          // Arrow shape padding compensation
          shape === 'arrow' && "pl-8 pr-4"
      )}>


      {/* Header */}
      <div className={clsx(
        "px-6 pt-6 pb-3 flex flex-col gap-3",
        style === 'code' && "bg-black/5 border-b border-border-soft py-3",
        // Alignment classes
        titleAlign === 'center' && "text-center items-center",
        titleAlign === 'left' && "text-left items-start",
        // Overrides for specific styles or legacy logic
        isWideAndShort && "items-center text-center", 
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
                style === 'code' && "text-text-muted text-sm font-mono",
                style !== 'code' && "text-primary",
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
                    // CHD Protocol: Strict Code Style Enforcement
                    // Only allow code style for: 1. Block code, 2. Arrows/Sequences, 3. References, 4. Actual code
                    code: ({node, inline, className, children, ...props}: any) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const text = String(children).trim();
                      
                      // 1. Block Code (always allowed)
                      if (!inline || match) {
                        return <code className={clsx("bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-text-secondary", className)} {...props}>{children}</code>;
                      }

                      // 2. Allow List Logic for Inline Code
                      const isArrow = /^(\->|=>|→|←|↔|<->|<=>)$/.test(text);
                      const isReference = /^\[.+\]$/.test(text); // [1], [Ref]
                      const isCodeLike = /[=\(\)\{\}\[\]\$\._<>]/.test(text) || // Contains symbols
                                        /[a-z]+[A-Z][a-z]+/.test(text) ||   // camelCase
                                        /[a-z]+_[a-z]+/.test(text) ||       // snake_case
                                        /^[a-zA-Z0-9\.]+$/.test(text);      // Single word (var, file.ext) - permissive
                      
                      // 3. Strict Check: If it looks like a sentence or Chinese text, FORCE Bold instead of Code
                      const isSentence = /\s/.test(text) && text.length > 10;
                      const hasChinese = /[\u4e00-\u9fa5]/.test(text);

                      if (isArrow || isReference || (isCodeLike && !hasChinese && !isSentence)) {
                         return <code className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-text-secondary" {...props}>{children}</code>;
                      }

                      // Fallback: Render as Bold Text (Correction)
                      return <strong className="font-bold text-primary/80" title="Auto-corrected from code style">{children}</strong>;
                    },
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
