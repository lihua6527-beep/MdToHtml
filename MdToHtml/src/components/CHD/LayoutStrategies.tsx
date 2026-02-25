import React, { useState, useRef, useEffect } from 'react';
import { Card } from './Card';
import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// --- Interfaces ---

export interface LayoutContext {
  sectionId?: string;
  cards: Array<any>; // Using any for Card data structure matching Section.tsx
  config: Record<string, any>;
  isMobile?: boolean;
  // Callbacks for interactivity
  activeLine?: number;
  selectedBlockIndex?: number | null;
  editMode?: boolean;
  onCardClick?: (line: number) => void;
  onSelectBlock?: (index: number | null) => void;
  onCardUpdate?: (blockIndex: number, newAttrs: Record<string, any>) => void;
  onContentUpdate?: (cardIndex: number, newContent: string) => void;
  onTitleUpdate?: (cardIndex: number, newTitle: string) => void;
  onCardMove?: (cardIndex: number, direction: 'left' | 'right' | 'up' | 'down') => void;
  onCardDelete?: (cardIndex: number) => void;
}

export interface ILayoutStrategy {
  id: string;
  render: (ctx: LayoutContext) => React.ReactNode;
}

// --- Strategies ---

const GridLayoutStrategy: ILayoutStrategy = {
  id: 'grid',
  render: (ctx) => {
    const { cards, config, activeLine, selectedBlockIndex, editMode } = ctx;
    
    // 1. Determine Column Count (Legacy Logic from Section.tsx)
    let columns = 2;
    const rawColumns = config.columns || config.cols;
    const rawLayout = config.layout || '';

    if (rawColumns) {
      columns = parseInt(rawColumns, 10);
    } else if (rawLayout === 'gallery') {
      columns = 3;
    } else if (rawLayout === 'stat-row') {
      columns = 4;
    } else if (rawLayout.startsWith('cols-')) {
      const match = rawLayout.match(/cols-(\d+)/);
      if (match) columns = parseInt(match[1], 10);
    } else if (config.layout === 'single') {
      columns = 1;
    }

    columns = Math.max(1, Math.min(4, columns));
    const multiplier = Math.floor(12 / columns);
    const defaultColSpan = Math.floor(12 / columns);

    // 2. Container Classes
    const isList = config.layout === 'list' || config.layout === 'stack' || config.layout === 'single';
    const isGrid = !isList;
    const containerClasses = isGrid 
      ? `grid grid-cols-12 gap-6 grid-flow-dense auto-rows-min` 
      : 'flex flex-col gap-6';

    // 3. Render Cards
    return (
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
              inheritedColor={config['section-color']}
              colSpan={(() => {
                  const raw = card.props['col-span'] ? parseInt(card.props['col-span']) : defaultColSpan;
                  return raw < 3 ? raw * multiplier : raw;
              })()}
              rowSpan={card.props['row-span'] ? parseInt(card.props['row-span']) : undefined}
              isActive={isActive}
              isSelected={isSelected}
              onSelect={() => card.blockIndex !== undefined && ctx.onSelectBlock?.(card.blockIndex)}
              onClick={() => card.startLine !== undefined && ctx.onCardClick?.(card.startLine)}
              editMode={editMode}
              onAttributeChange={(newAttrs) => card.blockIndex !== undefined && ctx.onCardUpdate?.(card.blockIndex, newAttrs)}
              onContentChange={(newContent) => card.blockIndex !== undefined && ctx.onContentUpdate?.(card.blockIndex, newContent)}
              onTitleChange={(newTitle) => card.blockIndex !== undefined && ctx.onTitleUpdate?.(card.blockIndex, newTitle)}
              onMove={(direction) => card.blockIndex !== undefined && ctx.onCardMove?.(card.blockIndex, direction)}
              onDelete={() => card.blockIndex !== undefined && ctx.onCardDelete?.(card.blockIndex)}
            />
          );
        })}
      </div>
    );
  }
};

const CarouselLayoutStrategy: ILayoutStrategy = {
  id: 'carousel',
  render: (ctx) => <CarouselLayout ctx={ctx} />
};

const CarouselLayout: React.FC<{ ctx: LayoutContext }> = ({ ctx }) => {
  const { cards, activeLine, selectedBlockIndex, editMode } = ctx;
  const [currentAngle, setCurrentAngle] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startAngle = useRef(0);

  const itemCount = Math.max(1, cards.length);
  const theta = 360 / itemCount;
  const panelWidth = 260; // Slightly wider than prototype for better card fit
  const gap = 140;
  const radius = Math.round((panelWidth + gap) / 2 / Math.tan(Math.PI / itemCount));
  
  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startAngle.current = currentAngle;
    if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
        containerRef.current.style.transition = 'none';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const diffX = e.clientX - startX.current;
    const newAngle = startAngle.current + (diffX * 0.5);
    setCurrentAngle(newAngle);
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
        containerRef.current.style.transition = 'transform 0.7s ease-out';
    }
    // Snap to nearest face
    const snapAngle = Math.round(currentAngle / theta) * theta;
    setCurrentAngle(snapAngle);
  };

  const rotate = (dir: number) => {
      setCurrentAngle(prev => prev + dir * theta);
  };

  return (
    <div className="w-full flex flex-col items-center my-12 perspective-1000 overflow-hidden py-10">
      <div className="flex gap-4 mb-8 z-20">
         <button onClick={() => rotate(1)} className="p-2 bg-white rounded-full shadow hover:bg-slate-50 border border-slate-200">
            <ChevronLeft size={20} />
         </button>
         <span className="text-xs text-slate-400 font-mono self-center">DRAG OR CLICK</span>
         <button onClick={() => rotate(-1)} className="p-2 bg-white rounded-full shadow hover:bg-slate-50 border border-slate-200">
            <ChevronRight size={20} />
         </button>
      </div>

      <div 
        className="relative h-[320px] w-full flex justify-center perspective-1000"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
            ref={containerRef}
            className="relative w-[260px] h-[320px] transition-transform duration-700 ease-out preserve-3d"
            style={{ 
                transformStyle: 'preserve-3d',
                transform: `translateZ(-${radius}px) rotateY(${currentAngle}deg)`,
                cursor: 'grab'
            }}
        >
            {cards.map((card, idx) => {
                const angle = theta * idx;
                const isActive = activeLine !== undefined && card.startLine !== undefined && card.endLine !== undefined 
                    ? (activeLine >= card.startLine && activeLine <= card.endLine)
                    : false;
                const isSelected = selectedBlockIndex !== undefined && selectedBlockIndex !== null && card.blockIndex === selectedBlockIndex;

                return (
                    <div
                        key={idx}
                        className={cn(
                            "absolute inset-0 backface-visible",
                            "opacity-90 hover:opacity-100 transition-opacity"
                        )}
                        style={{
                            transform: `rotateY(${angle}deg) translateZ(${radius}px)`
                        }}
                    >
                        <div className="w-full h-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                             <Card 
                                title={card.title}
                                content={card.content}
                                style={card.props['card-style'] || 'normal'}
                                attributes={card.props}
                                inheritedColor={ctx.config['section-color']}
                                isActive={isActive}
                                isSelected={isSelected}
                                onSelect={() => card.blockIndex !== undefined && ctx.onSelectBlock?.(card.blockIndex)}
                                onClick={() => card.startLine !== undefined && ctx.onCardClick?.(card.startLine)}
                                editMode={editMode}
                                onAttributeChange={(newAttrs) => card.blockIndex !== undefined && ctx.onCardUpdate?.(card.blockIndex, newAttrs)}
                                onContentChange={(newContent) => card.blockIndex !== undefined && ctx.onContentUpdate?.(card.blockIndex, newContent)}
                                onTitleChange={(newTitle) => card.blockIndex !== undefined && ctx.onTitleUpdate?.(card.blockIndex, newTitle)}
                                onMove={(direction) => card.blockIndex !== undefined && ctx.onCardMove?.(card.blockIndex, direction)}
                                onDelete={() => card.blockIndex !== undefined && ctx.onCardDelete?.(card.blockIndex)}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

const TimelineLayoutStrategy: ILayoutStrategy = {
  id: 'timeline',
  render: (ctx) => {
    const { cards, activeLine, selectedBlockIndex, editMode } = ctx;
    
    return (
      <div className="w-full overflow-x-auto pb-8">
        <div className="relative min-w-[800px] h-[400px] px-12 flex items-center">
            {/* Axis */}
            <div className="absolute left-0 right-12 top-1/2 h-1 bg-slate-300 rounded-full z-0"></div>
            <div className="absolute right-8 top-1/2 w-4 h-4 border-t-4 border-r-4 border-slate-300 transform -translate-y-1/2 rotate-45 z-0"></div>

            {/* Items */}
            <div className="relative z-10 w-full flex justify-between items-stretch gap-8">
                {cards.map((card, idx) => {
                    const isTop = idx % 2 === 0;
                    const isActive = activeLine !== undefined && card.startLine !== undefined && card.endLine !== undefined 
                        ? (activeLine >= card.startLine && activeLine <= card.endLine)
                        : false;
                    const isSelected = selectedBlockIndex !== undefined && selectedBlockIndex !== null && card.blockIndex === selectedBlockIndex;

                    return (
                        <div key={idx} className="relative w-64 group shrink-0">
                            {/* Dot on Axis */}
                            <div className={cn(
                                "absolute left-1/2 top-1/2 w-5 h-5 rounded-full border-4 border-white shadow-sm z-20 transform -translate-x-1/2 -translate-y-1/2 transition-colors",
                                isActive ? "bg-primary scale-125" : "bg-slate-400 group-hover:bg-primary"
                            )}></div>

                            {/* Card Container */}
                            <div className={cn(
                                "absolute w-full transition-all duration-300",
                                isTop ? "bottom-1/2 mb-8" : "top-1/2 mt-8",
                                isTop ? "hover:-translate-y-2" : "hover:translate-y-2"
                            )}>
                                {/* Connecting Line */}
                                <div className={cn(
                                    "absolute left-1/2 w-0.5 bg-slate-200 h-8",
                                    isTop ? "bottom-[-32px]" : "top-[-32px]"
                                )}></div>

                                <Card 
                                    title={card.title}
                                    content={card.content}
                                    style={card.props['card-style'] || 'normal'}
                                    attributes={card.props}
                                    inheritedColor={ctx.config['section-color']}
                                    isActive={isActive}
                                    isSelected={isSelected}
                                    onSelect={() => card.blockIndex !== undefined && ctx.onSelectBlock?.(card.blockIndex)}
                                    onClick={() => card.startLine !== undefined && ctx.onCardClick?.(card.startLine)}
                                    editMode={editMode}
                                    onAttributeChange={(newAttrs) => card.blockIndex !== undefined && ctx.onCardUpdate?.(card.blockIndex, newAttrs)}
                                    onContentChange={(newContent) => card.blockIndex !== undefined && ctx.onContentUpdate?.(card.blockIndex, newContent)}
                                    onTitleChange={(newTitle) => card.blockIndex !== undefined && ctx.onTitleUpdate?.(card.blockIndex, newTitle)}
                                    onMove={(direction) => card.blockIndex !== undefined && ctx.onCardMove?.(card.blockIndex, direction)}
                                    onDelete={() => card.blockIndex !== undefined && ctx.onCardDelete?.(card.blockIndex)}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    );
  }
};

const HubLayoutStrategy: ILayoutStrategy = {
  id: 'hub',
  render: (ctx) => {
    const { cards, activeLine, selectedBlockIndex, editMode } = ctx;
    const count = cards.length;
    const radius = 160; // 320px diameter / 2
    
    return (
      <div className="relative w-[400px] h-[400px] mx-auto flex items-center justify-center my-12">
        {/* Center Core */}
        <div className="absolute z-10 w-24 h-24 bg-indigo-600 rounded-full shadow-2xl flex flex-col items-center justify-center text-white border-4 border-slate-50 animate-in zoom-in duration-500">
          <span className="font-bold text-lg">CORE</span>
        </div>

        {/* Satellites */}
        {cards.map((card, idx) => {
          const angle = (2 * Math.PI / count) * idx - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          const isActive = activeLine !== undefined && card.startLine !== undefined && card.endLine !== undefined 
            ? (activeLine >= card.startLine && activeLine <= card.endLine)
            : false;
          const isSelected = selectedBlockIndex !== undefined && selectedBlockIndex !== null && card.blockIndex === selectedBlockIndex;

          return (
            <div 
              key={idx}
              className="absolute w-20 h-20 transition-all duration-500 flex items-center justify-center"
              style={{ 
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              }}
            >
              {/* Force Circle Shape for Hub Items */}
              <div className="w-full h-full">
                <Card 
                  title={card.title}
                  content={card.content}
                  style="stat" // Use stat style for compact look
                  attributes={{ ...card.props, shape: 'circle' }}
                  inheritedColor={ctx.config['section-color']}
                  isActive={isActive}
                  isSelected={isSelected}
                  onSelect={() => card.blockIndex !== undefined && ctx.onSelectBlock?.(card.blockIndex)}
                  onClick={() => card.startLine !== undefined && ctx.onCardClick?.(card.startLine)}
                  editMode={editMode}
                  onAttributeChange={(newAttrs) => card.blockIndex !== undefined && ctx.onCardUpdate?.(card.blockIndex, newAttrs)}
                  onContentChange={(newContent) => card.blockIndex !== undefined && ctx.onContentUpdate?.(card.blockIndex, newContent)}
                  onTitleChange={(newTitle) => card.blockIndex !== undefined && ctx.onTitleUpdate?.(card.blockIndex, newTitle)}
                  // Disable move/delete in Hub view for now or handle gracefully
                  onMove={(direction) => card.blockIndex !== undefined && ctx.onCardMove?.(card.blockIndex, direction)}
                  onDelete={() => card.blockIndex !== undefined && ctx.onCardDelete?.(card.blockIndex)}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
};

const RingLayoutStrategy: ILayoutStrategy = {
  id: 'ring',
  render: (ctx) => {
    const { cards, activeLine, selectedBlockIndex, editMode } = ctx;
    const count = Math.max(1, cards.length); // Ensure at least 1 segment if cards exist
    
    // Ring Dimensions
    const size = 400;
    const cx = size / 2;
    const cy = size / 2;
    const rOuter = 180;
    const rInner = 80;
    const rMid = (rOuter + rInner) / 2;
    const arrowAngleOffset = 8;
    
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6'];
    
    const getCoord = (r: number, angleDeg: number) => {
      const rad = (angleDeg - 90) * Math.PI / 180;
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad)
      };
    };

    return (
      <div className="relative w-[400px] h-[400px] mx-auto my-8">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 z-0">
          {cards.map((_, i) => {
            const startAngle = (360 / count) * i;
            const endAngle = (360 / count) * (i + 1);
            
            // Path Construction Logic (Ported from Prototype)
            const pStartIn = getCoord(rInner, startAngle);
            const pStartMid = getCoord(rMid, startAngle + arrowAngleOffset);
            const pStartOut = getCoord(rOuter, startAngle);

            const pEndIn = getCoord(rInner, endAngle);
            const pEndMid = getCoord(rMid, endAngle + arrowAngleOffset);
            const pEndOut = getCoord(rOuter, endAngle);
            
            const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
            
            const d = `
              M ${pStartIn.x} ${pStartIn.y}
              L ${pStartMid.x} ${pStartMid.y}
              L ${pStartOut.x} ${pStartOut.y}
              A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${pEndOut.x} ${pEndOut.y}
              L ${pEndMid.x} ${pEndMid.y}
              L ${pEndIn.x} ${pEndIn.y}
              A ${rInner} ${rInner} 0 ${largeArc} 0 ${pStartIn.x} ${pStartIn.y}
              Z
            `;

            return (
              <path
                key={i}
                d={d}
                fill={colors[i % colors.length]}
                stroke="white"
                strokeWidth="4"
                strokeLinejoin="round"
                className="transition-all hover:opacity-90 cursor-pointer"
                onClick={() => cards[i].startLine !== undefined && ctx.onCardClick?.(cards[i].startLine)}
              />
            );
          })}
        </svg>

        {/* Text/Card Overlay */}
        {cards.map((card, i) => {
          const startAngle = (360 / count) * i;
          const endAngle = (360 / count) * (i + 1);
          const midAngle = (startAngle + endAngle) / 2;
          const pText = getCoord(rMid, midAngle);
          
          const isActive = activeLine !== undefined && card.startLine !== undefined && card.endLine !== undefined 
            ? (activeLine >= card.startLine && activeLine <= card.endLine)
            : false;
          const isSelected = selectedBlockIndex !== undefined && selectedBlockIndex !== null && card.blockIndex === selectedBlockIndex;

          return (
            <div
              key={i}
              className={cn(
                "absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none",
                "text-white font-bold text-center p-2"
              )}
              style={{
                left: `${pText.x}px`,
                top: `${pText.y}px`,
                width: '100px'
              }}
            >
                <div className="pointer-events-auto" onClick={() => card.blockIndex !== undefined && ctx.onSelectBlock?.(card.blockIndex)}>
                    <span className="drop-shadow-md">{card.title}</span>
                </div>
            </div>
          );
        })}
      </div>
    );
  }
};

// --- Registry & Access ---

const STRATEGIES: Record<string, ILayoutStrategy> = {
  grid: GridLayoutStrategy,
  list: GridLayoutStrategy, 
  gallery: GridLayoutStrategy,
  single: GridLayoutStrategy,
  stack: GridLayoutStrategy,
  hub: HubLayoutStrategy,
  ring: RingLayoutStrategy,
  carousel: CarouselLayoutStrategy,
  timeline: TimelineLayoutStrategy
};

export const getLayoutStrategy = (layoutName: string): { strategy: ILayoutStrategy, isFallback: boolean } => {
  // Normalize layout name
  const name = layoutName?.split('-')[0] || 'grid'; 
  
  if (STRATEGIES[name]) {
    return { strategy: STRATEGIES[name], isFallback: false };
  }
  
  return { strategy: GridLayoutStrategy, isFallback: true };
};
