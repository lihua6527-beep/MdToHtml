'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Plus, LayoutGrid, Columns, Settings, Type, Palette, Check } from 'lucide-react';
import { getLayoutStrategy } from './LayoutStrategies';

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
  startLine?: number;
  activeLine?: number;
  onCardClick?: (line: number) => void;
  editMode?: boolean;
  selectedBlockIndex?: number | null;
  activeSectionBlockIndex?: number; // Added for robust section selection
  onSelectBlock?: (index: number | null) => void;
  onSelectSection?: (index: number, title: string, layoutProps: Record<string, any>) => void;
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
  startLine,
  activeLine, 
  onCardClick, 
  editMode, 
  selectedBlockIndex,
  activeSectionBlockIndex,
  onSelectBlock,
  onSelectSection,
  onCardUpdate,
  onBatchCardUpdate,
  onContentUpdate,
  onTitleUpdate,
  onCardMove,
  onCardDelete,
  onCardAdd
}) => {
  // [Strategy Pattern Implementation]
  // Determine layout strategy based on 'layout' prop
  const { strategy, isFallback } = getLayoutStrategy(layoutProps.layout || 'grid');

  // Effect: Handle Fallback Warning
  React.useEffect(() => {
    if (isFallback && layoutProps.layout) {
      console.warn(`Layout '${layoutProps.layout}' is not supported yet. Falling back to Grid.`);
      // Optional: Add Toast notification here if UI library available
    }
  }, [isFallback, layoutProps.layout]);

  // Determine Column Count (Keep for Toolbar UI state)
  let columns = 2; 
  const rawColumns = layoutProps.columns || layoutProps.cols;
  const rawLayout = layoutProps.layout || '';

  if (rawColumns) {
    columns = parseInt(rawColumns, 10);
  } else if (rawLayout === 'gallery') {
    columns = 3;
  } else if (rawLayout === 'stat-row') {
    columns = 4;
  } else if (rawLayout.startsWith('cols-')) {
    const match = rawLayout.match(/cols-(\d+)/);
    if (match) columns = parseInt(match[1], 10);
  } else if (layoutProps.layout === 'single') {
    columns = 1;
  }
  columns = Math.max(1, Math.min(4, columns));

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

  const sectionColor = layoutProps['section-color'];
  const titleSpacing = layoutProps['title-spacing'] || '2';
  const showDivider = layoutProps['show-divider'] === true || layoutProps['show-divider'] === 'true'; // Handle boolean or string

  const spacingMap: Record<string, string> = {
      '0': 'mb-0',
      '2': 'mb-8',
      '4': 'mb-16',
      '6': 'mb-24',
      '8': 'mb-32'
  };
  const sectionMbClass = spacingMap[titleSpacing] || 'mb-16';

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

  // Determine selection state
  // Section is selected if:
  // 1. No specific card is selected (selectedBlockIndex === null)
  // 2. This section is the active one (blockIndex === activeSectionBlockIndex)
  // OR fallback to activeLine exact match if blockIndex not available
  const isSelected = editMode && (
      (activeSectionBlockIndex !== undefined && blockIndex !== undefined && activeSectionBlockIndex === blockIndex && selectedBlockIndex === null) ||
      (activeLine !== undefined && startLine !== undefined && activeLine === startLine)
  );

  return (
    <section 
      onClick={(e) => {
        if (editMode && startLine !== undefined && (onCardClick || onSelectBlock) && !e.defaultPrevented) {
             console.log('[Section Click Action] Triggering onSelectSection with index:', blockIndex);
             // Priority 1: Use explicit block index selection (Architecture Fix)
             if (blockIndex !== undefined) {
                 if (onSelectBlock) {
                     onSelectBlock(blockIndex);
                 } else if (onSelectSection) {
                     const cleanTitle = title.replace('## ', '').replace(/\{.*?\}/g, '').trim();
                     onSelectSection(blockIndex, cleanTitle, layoutProps);
                 } else if (onCardClick) {
                     onCardClick(startLine);
                 }
             } 
             // Priority 2: Fallback to line-based selection (Legacy)
             else if (onCardClick) {
                 onCardClick(startLine);
             }
          }
      }}
      className={clsx(
        "animate-in fade-in slide-in-from-bottom-4 duration-700 rounded-3xl transition-all relative group", 
        // Remove layout-shifting classes (p-2 -m-2) and visual styles from root
        // Edit mode visuals are now handled by the absolute overlay
        editMode && "cursor-pointer",
        // Apply Section Spacing (controlled by 'title-spacing')
        sectionMbClass
    )}>
      {/* Global Section Overlay (Visuals Only, No Layout Shift) */}
      {editMode && (
          <div 
            className={clsx(
                "absolute -inset-2 rounded-3xl z-0 transition-all border border-transparent pointer-events-none",
                !isSelected && "group-hover:border-border-soft group-hover:bg-slate-50/50",
                isSelected && "ring-2 ring-primary ring-offset-2 bg-slate-50/50 shadow-sm"
            )}
          />
      )}

      <div className={clsx("flex flex-col gap-4 relative z-10 group mb-4")}>
        {/* Transparent Clickable Overlay for Title Area - Kept for explicit title clicking if needed, but redundant? 
            Actually, let's keep it simple. The section onClick handles everything. 
            We just need to make sure this div doesn't block clicks. It bubbles.
        */}
        <div className="flex items-center gap-4 relative z-20 pointer-events-none">
            <h2 
            className={clsx(
                "text-2xl font-bold tracking-tight transition-colors duration-300",
                !sectionColor && "text-text-primary"
            )}
            style={sectionColor ? { color: `hsl(var(--${sectionColor}))` } : undefined}
            >
            {title.replace('## ', '')}
            </h2>
        </div>
        {showDivider && (
            <div className="h-px w-full bg-border-soft" />
        )}
      </div>

      {/* Divider between sections */}
      {isFallback && editMode && (
         <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 text-sm rounded-lg border border-yellow-200 flex items-center gap-2">
             <span>⚠️ 布局 &apos;{layoutProps.layout}&apos; 暂不支持，已自动回退到并列布局。</span>
             <button 
                onClick={() => onCardUpdate?.(blockIndex!, { ...layoutProps, layout: '' })}
                className="underline hover:text-yellow-900"
             >
                重置布局
             </button>
         </div>
      )}

      <div className="relative z-10">
      {strategy.render({
        cards,
        config: layoutProps,
        activeLine,
        selectedBlockIndex,
        onCardClick,
        editMode,
        onSelectBlock,
        onCardUpdate: (idx, attrs) => onCardUpdate?.(idx, attrs),
        onContentUpdate: (idx, content) => onContentUpdate?.(idx, content),
        onTitleUpdate: (idx, title) => onTitleUpdate?.(idx, title),
        onCardMove: (idx, dir) => onCardMove?.(idx, dir),
        onCardDelete: (idx) => onCardDelete?.(idx)
      })}
      </div>

      <hr className="mt-4 mb-4 border-t border-border-soft" style={{ display: showDivider ? 'block' : 'none' }} />
    </section>
  );
};
