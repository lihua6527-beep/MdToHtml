import React, { useState, useEffect } from 'react';
import { 
    LayoutTemplate, 
    Palette, 
    AppWindow, 
    Grid, 
    List, 
    Component, 
    CircleDot,
    Type,
    AlignLeft,
    Image as ImageIcon,
    ListOrdered,
    Quote,
    Highlighter,
    Binary,
    Code,
    FileText,
    AlertCircle,
    GalleryHorizontal,
    Plus,
    Trash2,
    ChevronUp,
    Check,
    Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardShape } from '@/lib/shapes';
import { CardStyle } from '@/types/chd';
import { TAG_STYLES, TagStyleType } from './TagRenderer';

export interface BottomToolbarProps {
    // Current State
    currentThemeIndex: number;
    onThemeChange: (index: number) => void;

    // Tag Style
    tagStyle?: TagStyleType;
    onTagStyleChange?: (style: TagStyleType) => void;
    
    // Selection State
    selectedBlockIndex: number | null;
    selectedSectionTitle: string | null;
    
    // Section Props (if section selected or card selected -> parent section)
    sectionLayout: string;
    onSectionLayoutChange: (layout: string) => void;
    sectionColor: string;
    onSectionColorChange: (color: string) => void;
    sectionColumns: number;
    onSectionColumnsChange: (cols: number) => void;
    sectionTitleSpacing?: string;
    onSectionTitleSpacingChange?: (spacing: string) => void;
    sectionShowDivider?: boolean;
    onSectionShowDividerChange?: (show: boolean) => void;
    
    // Card Props (if card selected)
    cardShape: CardShape;
    onCardShapeChange: (shape: CardShape) => void;
    cardStyle: CardStyle;
    onCardStyleChange: (style: CardStyle) => void;
    cardBadge: string;
    onCardBadgeChange: (badge: string) => void;
    
    // Actions
    onCardAdd?: () => void;
    onCardDelete?: () => void;
    
    // Global Props (optional, from prototype)
    titleSize?: 'S' | 'M' | 'L';
    onTitleSizeChange?: (size: 'S' | 'M' | 'L') => void;
    textSize?: 'S' | 'M' | 'L';
    onTextSizeChange?: (size: 'S' | 'M' | 'L') => void;

    // Section List for Fallback Selection
    sections?: Array<{ title: string, blockIndex: number }>;
    onSelectSection?: (blockIndex: number) => void;
    
    // Active Card Block Index (to differentiate from section selection)
    activeCardBlockIndex?: number;
}

const THEMES = [
    { name: 'Ocean', primary: '#2C6CFF', bg: '#F0F5FF', text: '#0A1120' },
    { name: 'Mint', primary: '#6BD0CC', bg: '#F0FDFA', text: '#134E4A' },
    { name: 'Lavender', primary: '#6C53B3', bg: '#FAF9FC', text: '#1C1C1C' },
    { name: 'Earth', primary: '#41C187', bg: '#FBFBFB', text: '#04260E' },
    { name: 'Caramel', primary: '#855D36', bg: '#FDFBF6', text: '#492D11' },
];

const SECTION_COLORS = [
    { name: 'Default', value: 'default', bg: '#e2e8f0' },
    { name: 'Chart 1', value: 'chart-1', bg: 'hsl(var(--chart-1, 12 76% 61%))' },
    { name: 'Chart 2', value: 'chart-2', bg: 'hsl(var(--chart-2, 173 58% 39%))' },
    { name: 'Chart 3', value: 'chart-3', bg: 'hsl(var(--chart-3, 197 37% 24%))' },
    { name: 'Chart 4', value: 'chart-4', bg: 'hsl(var(--chart-4, 43 74% 66%))' },
    { name: 'Chart 5', value: 'chart-5', bg: 'hsl(var(--chart-5, 27 87% 67%))' },
];

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
    currentThemeIndex,
    onThemeChange,
    selectedBlockIndex,
    selectedSectionTitle,
    sectionLayout,
    onSectionLayoutChange,
    sectionColor,
    onSectionColorChange,
    sectionColumns,
    onSectionColumnsChange,
    sectionTitleSpacing = '2',
    onSectionTitleSpacingChange,
    sectionShowDivider = false,
    onSectionShowDividerChange,
    cardShape,
    onCardShapeChange,
    cardStyle,
    onCardStyleChange,
    cardBadge,
    onCardBadgeChange,
    tagStyle = 'glass',
    onTagStyleChange,
    onCardAdd,
    onCardDelete,
    titleSize = 'M',
    onTitleSizeChange,
    textSize = 'M',
    onTextSizeChange,
    sections = [],
    onSelectSection,
    activeCardBlockIndex = -1
}) => {
    const [activeTab, setActiveTab] = useState<'theme' | 'layout' | 'card'>('theme');
    const [showSectionList, setShowSectionList] = useState(false);

    // Auto-switch tab based on selection
    useEffect(() => {
        // If a specific card is selected (activeCardBlockIndex != -1), switch to card tab
        if (activeCardBlockIndex !== -1) {
            setActiveTab('card');
        } 
        // If a section is selected (selectedSectionTitle is present but no specific card is active), 
        // we might want to switch to layout tab, or stay on current tab if user prefers.
        // User requested: "点击选中分区后不要跳转到卡片样式"
        // Since we now distinguish between card and section selection, this logic is safer.
        else if (selectedSectionTitle) {
            setActiveTab('layout');
        }
    }, [activeCardBlockIndex, selectedSectionTitle]);

    return (
        <div 
            className="h-[240px] bg-white border-t border-border-soft shadow-[0_-4px_30px_rgba(0,0,0,0.1)] flex z-[999] fixed bottom-0 left-0 right-0 transform-none filter-none"
            onClick={(e) => e.stopPropagation()} // Prevent click-through
        >
            {/* 1. Left Sidebar (Tabs) */}
            <div className="w-[60px] bg-slate-50 border-r border-border-soft flex flex-col items-center py-6 gap-4 shrink-0 h-full">
                <button 
                    onClick={() => setActiveTab('theme')}
                    className={cn(
                        "w-10 h-10 rounded-xl flex flex-col items-center justify-center text-slate-500 transition-all hover:bg-slate-200",
                        activeTab === 'theme' && "bg-primary text-white shadow-md shadow-primary/30 hover:bg-primary"
                    )}
                >
                    <Palette size={20} className="mb-0.5" />
                    <span className="text-[10px] font-bold scale-90">主题</span>
                </button>

                <div className="w-8 h-px bg-slate-200 shrink-0" />

                <button 
                    onClick={() => setActiveTab('layout')}
                    className={cn(
                        "w-10 h-10 rounded-xl flex flex-col items-center justify-center text-slate-500 transition-all hover:bg-slate-200",
                        activeTab === 'layout' && "bg-primary text-white shadow-md shadow-primary/30 hover:bg-primary"
                    )}
                >
                    <LayoutTemplate size={20} className="mb-0.5" />
                    <span className="text-[10px] font-bold scale-90">布局</span>
                </button>

                <div className="w-8 h-px bg-slate-200 shrink-0" />

                <button 
                    onClick={() => setActiveTab('card')}
                    className={cn(
                        "w-10 h-10 rounded-xl flex flex-col items-center justify-center text-slate-500 transition-all hover:bg-slate-200",
                        activeTab === 'card' && "bg-primary text-white shadow-md shadow-primary/30 hover:bg-primary"
                    )}
                >
                    <AppWindow size={20} className="mb-0.5" />
                    <span className="text-[10px] font-bold scale-90">卡片</span>
                </button>
            </div>

            {/* 2. Content Area */}
            <div className="flex-1 p-3 flex gap-6 overflow-x-auto">
                
                {/* Tab 1: Theme */}
                {activeTab === 'theme' && (
                    <>
                        <div className="flex-none flex flex-col gap-3 border-r border-slate-200 pr-6 min-w-[180px]">
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">主题风格</div>
                            <div className="flex gap-4 flex-wrap">
                                {THEMES.map((t, i) => (
                                    <button
                                        key={t.name}
                                        onClick={() => onThemeChange(i)}
                                        className={cn(
                                            "w-8 h-8 rounded-full border-2 border-transparent transition-all hover:scale-110 shadow-sm",
                                            currentThemeIndex === i && "border-slate-900 scale-110 ring-2 ring-slate-900 ring-offset-2"
                                        )}
                                        style={{ backgroundColor: t.primary }}
                                        title={t.name}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex-none flex flex-col gap-3 min-w-[140px] pl-6">
                             <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">全局微调</div>
                             <div className="space-y-3">
                                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                     <span className="text-sm font-medium text-slate-600">分区与间距</span>
                                     <div className="flex gap-1">
                                         {['0', '2', '4', '6', '8'].map(v => (
                                             <button 
                                                key={v} 
                                                onClick={() => onSectionTitleSpacingChange?.(v)}
                                                className={cn(
                                                    "w-6 h-6 flex items-center justify-center text-xs rounded text-slate-500 hover:bg-white", 
                                                    sectionTitleSpacing === v && "bg-white text-slate-900 shadow-sm font-bold"
                                                )}
                                             >
                                                {v}
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                                 <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                     <span className="text-sm font-medium text-slate-600">分割线</span>
                                     <div 
                                        className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors", sectionShowDivider ? "bg-primary" : "bg-slate-300")}
                                        onClick={() => onSectionShowDividerChange?.(!sectionShowDivider)}
                                     >
                                         <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all", sectionShowDivider ? "right-1" : "left-1")} />
                                     </div>
                                 </div>
                             </div>
                        </div>

                        {/* Tag Style Selector */}
                        <div className="flex-none flex flex-col gap-3 min-w-[160px] pl-6 border-l border-slate-200">
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">标签风格</div>
                            <div className="flex flex-wrap gap-2">
                                {TAG_STYLES.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => onTagStyleChange?.(style.id)}
                                        className={cn(
                                            "px-2 py-1.5 text-xs font-medium rounded border transition-all flex items-center gap-1.5",
                                            tagStyle === style.id 
                                                ? "bg-slate-800 text-white border-slate-800 shadow-md transform scale-105" 
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                        title={style.description}
                                    >
                                        <Tag size={12} className={cn("opacity-70", tagStyle === style.id && "text-white")} />
                                        {style.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Spacer to push content left */}
                        <div className="flex-1"></div>
                    </>
                )}

                {/* Tab 2: Layout */}
                {activeTab === 'layout' && (
                    <>
                        <div className="flex-none flex flex-col gap-3 border-r border-dashed border-border-soft pr-6 min-w-[220px]">
                            <div className="relative">
                                <button 
                                    onClick={() => setShowSectionList(!showSectionList)}
                                    className="w-full flex items-center justify-between gap-2 mb-2 bg-slate-100 p-2 rounded hover:bg-slate-200 transition-colors"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-sm font-bold text-slate-500 whitespace-nowrap">当前选区:</span>
                                        <span className="text-sm font-bold text-slate-800 truncate">
                                            {selectedSectionTitle?.replace(/\{.*?\}/g, '').trim() || '点击选择分区'}
                                        </span>
                                    </div>
                                    <ChevronUp size={16} className={cn("text-slate-500 transition-transform", showSectionList && "rotate-180")} />
                                </button>

                                {/* Dropdown List */}
                                {showSectionList && (
                                    <div className="fixed bottom-[240px] left-[80px] w-[240px] max-h-[300px] overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl mb-2 p-1 z-[1000] animate-in slide-in-from-bottom-2 fade-in duration-200">
                                        <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                                            切换分区 ({sections.length})
                                        </div>
                                        {sections.map((section, idx) => {
                                            const isSelected = selectedSectionTitle === section.title.replace(/\{.*?\}/g, '').trim();
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        onSelectSection?.(section.blockIndex);
                                                        setShowSectionList(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-2 py-2 rounded-md text-sm font-medium flex items-center justify-between group transition-colors",
                                                        isSelected 
                                                            ? "bg-primary/10 text-primary" 
                                                            : "text-slate-600 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <span className="truncate flex-1">{section.title.replace(/\{.*?\}/g, '').trim() || '未命名分区'}</span>
                                                    {isSelected && <Check size={14} className="text-primary" />}
                                                </button>
                                            );
                                        })}
                                        {sections.length === 0 && (
                                            <div className="px-2 py-4 text-center text-xs text-slate-400">
                                                暂无分区
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">布局模式 (已锁定)</div>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'grid', label: '网格布局 (Grid Only)', icon: Grid },
                                ].map(l => (
                                    <button
                                        key={l.id}
                                        onClick={() => onSectionLayoutChange(l.id)}
                                        className={cn(
                                            "p-2 border border-border-soft rounded-lg flex flex-row items-center justify-center gap-2 transition-all hover:bg-slate-50 cursor-default",
                                            sectionLayout === l.id && "bg-primary text-white border-primary shadow-md shadow-primary/20 hover:bg-primary"
                                        )}
                                        disabled={true}
                                    >
                                        <l.icon size={18} />
                                        <span className="text-sm font-medium">{l.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-none flex flex-col gap-4 border-r border-dashed border-border-soft pr-6 min-w-[140px]">
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">分区配色</div>
                            <div className="grid grid-cols-3 gap-3">
                                {SECTION_COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSectionColorChange(c.value);
                                        }}
                                        className={cn(
                                            "w-8 h-8 rounded-full border-2 border-transparent flex items-center justify-center shadow-sm transition-transform hover:scale-105",
                                            sectionColor === c.value && "border-slate-900 scale-110 ring-2 ring-slate-900 ring-offset-1"
                                        )}
                                        style={{ backgroundColor: c.bg }}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                            
                            <div className="mt-auto">
                                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">列数</div>
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4].map(col => (
                                        <button
                                            key={col}
                                            onClick={() => onSectionColumnsChange(col)}
                                            className={cn(
                                                "w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-slate-100",
                                                sectionColumns === col && "bg-primary text-white border-primary shadow-sm"
                                            )}
                                        >
                                            {col}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex-none flex flex-col gap-3 min-w-[140px]">
                             
                             {onCardAdd && (
                                <button 
                                    onClick={onCardAdd}
                                    className="mt-auto h-9 px-4 bg-primary text-white rounded-lg shadow hover:bg-blue-600 transition-colors flex items-center gap-2 self-start w-full justify-center"
                                >
                                    <Plus size={16} />
                                    <span className="text-xs font-bold">新增卡片</span>
                                </button>
                            )}
                        </div>
                        
                        {/* Spacer */}
                        <div className="flex-1"></div>
                    </>
                )}

                {/* Tab 3: Card */}
                {activeTab === 'card' && (
                    <>
                        <div className="flex-none flex flex-col gap-3 border-r border-dashed border-border-soft pr-6 min-w-[280px] overflow-hidden">
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">内容样式</div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'normal', label: '标准 (Normal)', icon: AlignLeft },
                                    { id: 'highlight', label: '高亮 (Highlight)', icon: Highlighter },
                                    { id: 'quote', label: '引用 (Quote)', icon: Quote },
                                    { id: 'code', label: '代码 (Code)', icon: Code },
                                ].map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => onCardStyleChange(s.id as CardStyle)}
                                        className={cn(
                                            "h-[48px] w-full border border-border-soft rounded-lg flex items-center justify-start px-3 gap-3 text-slate-500 hover:border-primary transition-colors bg-white hover:bg-slate-50",
                                            cardStyle === s.id && "bg-primary text-white border-primary shadow-md shadow-primary/20 hover:bg-primary"
                                        )}
                                    >
                                        <s.icon size={18} />
                                        <span className="text-sm font-medium">{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-none flex flex-col gap-3 border-r border-dashed border-border-soft pr-6 min-w-[280px] overflow-hidden">
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">卡片形态</div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'rect', label: '标准矩形', class: 'rounded-sm' },
                                    { id: 'cut', label: '赛博切角', class: 'clip-cut' },
                                    { id: 'arrow', label: '箭头', class: 'clip-arrow' },
                                    { id: 'floating', label: '悬浮', class: 'shadow-sm translate-y-[-1px]' },
                                    { id: 'circle', label: '圆形', class: 'rounded-full w-4' },
                                ].map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => onCardShapeChange(s.id as CardShape)}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 border border-transparent text-left transition-colors h-[40px]",
                                            cardShape === s.id && "bg-white border-primary shadow-sm ring-1 ring-primary/20"
                                        )}
                                    >
                                        <div className={cn("w-6 h-4 bg-slate-300 flex-none", s.class)}></div>
                                        <span className="text-sm text-slate-700 font-medium truncate">{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-none flex flex-col gap-3 min-w-[160px]">
                             {cardShape === 'floating' && (
                                <div className="flex flex-col gap-2 mb-2 animate-in fade-in zoom-in duration-300">
                                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-0.5">悬浮徽章</div>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            value={cardBadge || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const isChinese = /[\u4e00-\u9fa5]/.test(val);
                                                if ((isChinese && val.length <= 2) || (!isChinese && val.length <= 5)) {
                                                    onCardBadgeChange(val);
                                                }
                                            }}
                                            placeholder="徽章文本"
                                            className="w-24 px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:border-primary outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        <span className="text-xs text-slate-400">限2-5字</span>
                                    </div>
                                </div>
                             )}
                             
                             {onCardDelete && (
                                <button 
                                    onClick={onCardDelete}
                                    className="mt-auto mb-1 py-2 px-4 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 hover:border-red-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    <span className="text-sm font-bold">删除卡片</span>
                                </button>
                             )}
                        </div>

                        {/* Spacer */}
                        <div className="flex-1"></div>
                    </>
                )}
            </div>
        </div>
    );
};
