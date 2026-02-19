'use client';

import React, { useState } from 'react';
import { Card } from './Card';
import { clsx } from 'clsx';

// --- Types ---

import { Plus, LayoutGrid, Columns, Settings, Type, Palette, Check } from 'lucide-react';

interface SectionProps {
  title: string;
  cards: Array<{
    title: string;
    content: string;
    props: Record<string, any>;
    startLine?: number;
    endLine?: number;
    blockIndex?: number;
  }>;
  layoutProps: Record<string, any>;
  blockIndex?: number;
  activeLine?: number;
  onCardClick?: (line: number) => void;
  editMode?: boolean;
  selectedBlockIndex?: number | null;
  onSelectBlock?: (index: number | null) => void;
  onCardUpdate?: (blockIndex: number, newAttrs: Record<string, any>) => void;
  onBatchCardUpdate?: (updates: Array<{blockIndex: number, key: string, value: any}>) => void;
  onContentUpdate?: (cardIndex: number, newContent: string) => void;
  onTitleUpdate?: (cardIndex: number, newTitle: string) => void;
  onCardMove?: (cardIndex: number, direction: 'left' | 'right' | 'up' | 'down') => void;
  onCardDelete?: (cardIndex: number) => void;
  onCardAdd?: (sectionBlockIndex: number) => void;
}

// --- Component: Section ---

export const Section: React.FC<SectionProps> = ({ 
  title, 
  cards, 
  layoutProps, 
  blockIndex,
  activeLine, 
  onCardClick, 
  editMode, 
  selectedBlockIndex,
  onSelectBlock,
  onCardUpdate,
  onBatchCardUpdate,
  onContentUpdate,
  onTitleUpdate,
  onCardMove,
  onCardDelete,
  onCardAdd
}) => {
  const [showSettings, setShowSettings] = useState(false);

  // [Fix: Default to Grid System]
  // User requested "Multidimensional Layout" as default.
  // We default to GRID (cols-2) to enable side-by-side rhythm unless explicitly 'list' or 'stack'.
  const isList = layoutProps.layout === 'list' || layoutProps.layout === 'stack' || layoutProps.layout === 'single';
  const isGrid = !isList;

  // Determine Column Count
  let columns = 2; // 默认两列
  
  // Normalize layout props (handle 'cols' alias and layout-based columns)
  const rawColumns = layoutProps.columns || layoutProps.cols;
  const rawLayout = layoutProps.layout || '';

  if (rawColumns) {
    columns = parseInt(rawColumns, 10);
  } else if (rawLayout === 'gallery') {
    columns = 3;
  } else if (rawLayout === 'stat-row') {
    columns = 4;
  } else if (rawLayout.startsWith('cols-')) {
    // Handle layout="cols-3" shorthand
    const match = rawLayout.match(/cols-(\d+)/);
    if (match) {
      columns = parseInt(match[1], 10);
    }
  } else if (layoutProps.layout === 'single') {
    columns = 1;
  }

  // 限制列数为 1-4，保证最多四个并排
  columns = Math.max(1, Math.min(4, columns));

  // [Fix: 12-Column Grid System]
  // We use a fixed 12-column grid for the section container.
  // We interpret 'col-span' relative to the section's column count to prevent "long strip" (1/12 width) issues.
  // e.g. In a 3-column layout (multiplier=4), col-span=1 means 1*4=4 (1/3 width), not 1/12.
  const multiplier = Math.floor(12 / columns);
  const containerClasses = isGrid 
    ? `grid grid-cols-12 gap-6 grid-flow-dense auto-rows-min` 
    : 'flex flex-col gap-6';

  // Calculate default span based on columns setting
  // columns=1 -> span=12 (Full)
  // columns=2 -> span=6 (Half)
  // columns=3 -> span=4 (Third)
  // columns=4 -> span=3 (Quarter)
  const defaultColSpan = Math.floor(12 / columns);

  const handleLayoutChange = () => {
    if (blockIndex === undefined) return;
    
    // Cycle columns: 1 -> 2 -> 3 -> 4 -> 1
    // User Requirement: Cycle width one per line -> two -> three -> four
    let nextCols = 1;
    if (columns === 1) nextCols = 2;
    else if (columns === 2) nextCols = 3;
    else if (columns === 3) nextCols = 4;
    else nextCols = 1; // If 4 or anything else, reset to 1 (full width)
    
    if (onBatchCardUpdate) {
        const updates: Array<{blockIndex: number, key: string, value: any}> = [];
        
        // 1. Update Section 'columns' prop
        updates.push({
            blockIndex: blockIndex,
            key: 'columns',
            value: String(nextCols)
        });

        // [Fix] Ensure we switch to grid mode if currently in list/stack mode
            // If layout is explicit 'list'/'stack', removing it (setting to empty) reverts to default grid
            if (layoutProps.layout === 'list' || layoutProps.layout === 'stack' || layoutProps.layout === 'single') {
                updates.push({
                    blockIndex: blockIndex,
                    key: 'layout',
                    value: '' 
                });
            }
        
        // 2. Batch update ALL child cards to match the new column count
        // This enforces the layout on all cards, overriding any individual col-span settings
        const newSpan = Math.floor(12 / nextCols);
        
        cards.forEach(card => {
            if (card.blockIndex !== undefined) {
                updates.push({
                    blockIndex: card.blockIndex,
                    key: 'col-span',
                    value: String(newSpan)
                });
            }
        });
        
        onBatchCardUpdate(updates);
    } else {
        // Fallback (should not happen in InteractivePost)
        onCardUpdate?.(blockIndex, { ...layoutProps, columns: String(nextCols) });
    }
  };

  const handleUnifyFonts = (target: 'title' | 'content', size: string) => {
    cards.forEach(card => {
        if (card.blockIndex !== undefined) {
             onCardUpdate?.(card.blockIndex, { [`${target}-size`]: size });
        }
    });
  };

  const SECTION_COLORS = [
    { label: '默认', value: 'default', class: 'bg-bg-card border-border-soft' },
    { label: '配色一', value: 'chart-1', class: 'bg-chart-1' },
    { label: '配色二', value: 'chart-2', class: 'bg-chart-2' },
    { label: '配色三', value: 'chart-3', class: 'bg-chart-3' },
    { label: '配色四', value: 'chart-4', class: 'bg-chart-4' },
    { label: '配色五', value: 'chart-5', class: 'bg-chart-5' },
  ];

  const handleSectionColor = (colorValue: string) => {
    if (blockIndex === undefined) return;
    
    // If default, remove the attribute to keep it clean
    const newValue = colorValue === 'default' ? undefined : colorValue;
    
    onCardUpdate?.(blockIndex, { ...layoutProps, 'section-color': newValue });
  };

  const handleUnifyWidth = (span: number) => {
    if (!onBatchCardUpdate) return;
    const updates = cards
      .filter(card => card.blockIndex !== undefined)
      .map(card => ({
        blockIndex: card.blockIndex as number,
        key: 'col-span',
        value: String(span),
      }));
    if (updates.length > 0) {
      onBatchCardUpdate(updates);
    }
  };

  return (
    <section className={clsx(
        "animate-in fade-in slide-in-from-bottom-4 duration-700 rounded-3xl transition-colors", 
        // FIXED: Section color applies to children cards, not the section container itself per user request.
        // We keep padding if a color is set to maintain visual structure, or maybe just remove it?
        // Let's keep it simple: No background on section.
        ""
    )}>
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">{title.replace('## ', '')}</h2>
        {editMode && (
             <div className="flex items-center gap-2">
                 <button
                    onClick={() => blockIndex !== undefined && onCardAdd?.(blockIndex)}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 hover:shadow-sm transition-all"
                    title="新增卡片"
                 >
                    <Plus size={18} strokeWidth={2.5} />
                 </button>
                 
                 <button
                    onClick={handleLayoutChange}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-bg-card border border-border-soft text-text-secondary hover:text-primary hover:border-primary/50 transition-all"
                    title={`每行卡片数：${columns} 个（点击切换）`}
                 >
                    {columns === 1 ? <LayoutGrid size={16} /> : <Columns size={16} />}
                 </button>
                 
                 <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={clsx(
                        "w-8 h-8 flex items-center justify-center rounded-md border transition-all",
                        showSettings 
                            ? "bg-primary text-white border-primary"
                            : "bg-bg-card border-border-soft text-text-secondary hover:text-primary hover:border-primary/50"
                    )}
                    title="区块设置"
                 >
                    <Settings size={16} />
                 </button>
             </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && editMode && (
          <div className="mb-6 p-4 bg-bg-card border border-border-soft rounded-xl shadow-sm animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-4">
                  {/* 1. Unify Fonts */}
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-text-secondary w-24">
                          <Type size={16} />
                          <span>统一字体</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-xs text-text-muted">标题:</span>
                          {['text-xl', 'text-2xl', 'text-3xl'].map(size => (
                              <button 
                                  key={size}
                                  onClick={() => handleUnifyFonts('title', size)}
                                  className="px-2 py-1 text-xs bg-bg-page border border-border-soft rounded hover:border-primary hover:text-primary transition-colors"
                              >
                                  {size.replace('text-', '')}
                              </button>
                          ))}
                          <div className="w-px h-4 bg-border-soft mx-2" />
                          <span className="text-xs text-text-muted">正文:</span>
                          {['text-sm', 'text-base', 'text-lg'].map(size => (
                              <button 
                                  key={size}
                                  onClick={() => handleUnifyFonts('content', size)}
                                  className="px-2 py-1 text-xs bg-bg-page border border-border-soft rounded hover:border-primary hover:text-primary transition-colors"
                              >
                                  {size.replace('text-', '')}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* 2. Section Color */}
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-text-secondary w-24">
                          <Palette size={16} />
                          <span>区块颜色</span>
                      </div>
                      <div className="flex items-center gap-2">
                          {SECTION_COLORS.map(color => (
                              <button
                                  key={color.label}
                                  onClick={() => handleSectionColor(color.value)}
                                  className={clsx(
                                      "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                                      layoutProps['section-color'] === color.value 
                                          ? "ring-2 ring-primary ring-offset-2 border-primary scale-110" 
                                          : "border-transparent hover:border-border-soft hover:scale-110",
                                      color.class // use the solid color for the button itself
                                  )}
                                  title={color.label}
                              >
                                  {layoutProps['section-color'] === color.value && <Check size={12} className="text-white drop-shadow-md" />}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* 3. Cards Width Control */}
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-text-secondary w-24">
                          <LayoutGrid size={16} />
                          <span>卡片宽度</span>
                      </div>
                      <div className="flex items-center gap-2">
                          {[
                              { label: '1/4', value: 3 },
                              { label: '1/3', value: 4 },
                              { label: '1/2', value: 6 },
                              { label: '整行', value: 12 }
                          ].map(opt => (
                              <button
                                  key={opt.value}
                                  onClick={() => handleUnifyWidth(opt.value)}
                                  className={clsx(
                                      "px-3 py-1.5 text-xs rounded-full border transition-all",
                                      "bg-bg-page text-text-secondary border-border-soft hover:border-primary/50 hover:text-primary"
                                  )}
                              >
                                  {opt.label}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}
      
      <div className={containerClasses}>
        {cards.map((card, idx) => {
          const isActive = activeLine !== undefined && card.startLine !== undefined && card.endLine !== undefined 
            ? (activeLine >= card.startLine && activeLine <= card.endLine)
            : false;
            
          const isSelected = selectedBlockIndex !== undefined && selectedBlockIndex !== null && card.blockIndex === selectedBlockIndex;

          return (
            <Card 
              key={idx}
              title={card.title}
              content={card.content}
              style={card.props['card-style']}
              attributes={card.props}
              inheritedColor={layoutProps['section-color']} // Pass section color to card
              colSpan={(() => {
                  const raw = card.props['col-span'] ? parseInt(card.props['col-span']) : defaultColSpan;
                  // [Fix] Heuristic: If span is < 3, treat as logical units (1 unit, 2 units) -> multiply by multiplier.
                  // This fixes "Long Strip" (1/12 width) when users specify "1".
                  // Standard Grid Spans (3, 4, 6, 12) are preserved.
                  return raw < 3 ? raw * multiplier : raw;
              })()}
              rowSpan={card.props['row-span'] ? parseInt(card.props['row-span']) : undefined}
              isActive={isActive}
              isSelected={isSelected}
              onSelect={() => card.blockIndex !== undefined && onSelectBlock?.(card.blockIndex)}
              onClick={() => card.startLine !== undefined && onCardClick?.(card.startLine)}
              editMode={editMode}
              onAttributeChange={(newAttrs) => card.blockIndex !== undefined && onCardUpdate?.(card.blockIndex, newAttrs)}
              onContentChange={(newContent) => card.blockIndex !== undefined && onContentUpdate?.(card.blockIndex, newContent)}
              onTitleChange={(newTitle) => card.blockIndex !== undefined && onTitleUpdate?.(card.blockIndex, newTitle)}
              onMove={(direction) => card.blockIndex !== undefined && onCardMove?.(card.blockIndex, direction)}
              onDelete={() => card.blockIndex !== undefined && onCardDelete?.(card.blockIndex)}
            />
          );
        })}
      </div>

      {/* Divider between sections */}
      <hr className="mt-8 mb-8 border-t border-border-soft" />
    </section>
  );
};
