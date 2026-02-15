import React, { useState, useEffect } from 'react';
import { useAutoSave, loadFromStorage } from '@/hooks/useAutoSave';
import { 
  LayoutTemplate, 
  Heading3, 
  Quote, 
  AlertTriangle, 
  Code,
  BarChart3,
  Move,
  Plus,
  Trash2,
  Maximize,
  Minimize,
  Save,
  FolderOpen,
  Monitor,
  Palette,
  PaintBucket
} from 'lucide-react';

interface CardData {
  id: string;
  title: string;
  content: string;
  type: 'normal' | 'stat' | 'highlight' | 'quote' | 'warning' | 'code';
  aspectRatio: 'auto' | '16/9' | '4/3' | '1/1';
  colSpan: 3 | 4 | 6 | 12; // 1/4, 1/3, 1/2, Full
  color?: string; // Hex or Tailwind class, let's use predefined palette for simplicity
  x?: number; // For free positioning if needed, but we'll stick to flow/grid for now
  y?: number;
}

const INITIAL_CARDS: CardData[] = [
  { id: '1', title: 'Welcome', content: 'Click to edit this card.', type: 'normal', aspectRatio: 'auto', colSpan: 12, color: 'bg-white' },
  { id: '2', title: 'Stats', content: '99%', type: 'stat', aspectRatio: '1/1', colSpan: 6, color: 'bg-white' },
];

const THEMES = [
  { id: 'ocean', name: 'Ocean', color: '#2C6CFF' },
  { id: 'mint', name: 'Mint', color: '#6BD0CC' },
  { id: 'lavender', name: 'Lavender', color: '#6C53B3' },
  { id: 'earth', name: 'Earth', color: '#41C187' },
  { id: 'caramel', name: 'Caramel', color: '#855D36' },
];

const CARD_COLORS = [
  { id: 'white', name: 'Default', class: 'bg-white border-gray-100' },
  { id: 'chart-1', name: 'Color 1', class: 'bg-chart-1 border-chart-1' },
  { id: 'chart-2', name: 'Color 2', class: 'bg-chart-2 border-chart-2' },
  { id: 'chart-3', name: 'Color 3', class: 'bg-chart-3 border-chart-3' },
  { id: 'chart-4', name: 'Color 4', class: 'bg-chart-4 border-chart-4' },
  { id: 'chart-5', name: 'Color 5', class: 'bg-chart-5 border-chart-5' },
];

export const VisualEditor = () => {
  const [cards, setCards] = useState<CardData[]>(() => loadFromStorage('chd_visual_cards', INITIAL_CARDS));
  const [currentTheme, setCurrentTheme] = useState('ocean');
  
  // Auto-save
  const { lastSaved, isSaving } = useAutoSave('chd_visual_cards', cards);

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const [status, setStatus] = useState('');
  const [fileName, setFileName] = useState('layout.chd.json');

  useEffect(() => {
    // Apply theme to a wrapper or body. Since this is a component, documentElement is global.
    // If we want scoped, we might need a wrapper ref. But global is usually fine for "Theme".
    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const selectedCard = cards.find(c => c.id === selectedCardId);

  const addCard = (type: CardData['type']) => {
    const newCard: CardData = {
      id: Date.now().toString(),
      title: 'New Card',
      content: 'Content...',
      type,
      aspectRatio: 'auto',
      colSpan: 12,
      color: 'bg-white border-gray-100'
    };
    setCards([...cards, newCard]);
    setSelectedCardId(newCard.id);
  };

  const updateCard = (id: string, updates: Partial<CardData>) => {
    setCards(cards.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
    if (selectedCardId === id) setSelectedCardId(null);
  };

  // Drag and Drop (Simple Reordering)
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    // Swap
    const newCards = [...cards];
    const draggedItem = newCards[draggedItemIndex];
    newCards.splice(draggedItemIndex, 1);
    newCards.splice(index, 0, draggedItem);
    
    setCards(newCards);
    setDraggedItemIndex(index);
  };

  const handleSave = async () => {
    setStatus('Saving...');
    try {
        const res = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: fileName, content: JSON.stringify(cards, null, 2) })
        });
        if (res.ok) {
            setStatus('Saved!');
            setTimeout(() => setStatus(''), 2000);
        } else {
            setStatus('Error');
        }
    } catch (e) {
        setStatus('Error');
    }
  };

  const handleLoad = async () => {
     // Mock load for now or implement if needed
     // In a real app, we'd fetch the file
     setStatus('Loading...');
     try {
         const res = await fetch(`/api/read?path=${encodeURIComponent(fileName)}`);
         if (res.ok) {
             const data = await res.json();
             // Try to parse JSON
             try {
                 const parsed = JSON.parse(data.content);
                 if (Array.isArray(parsed)) {
                     setCards(parsed);
                     setStatus('Loaded');
                 } else {
                     setStatus('Invalid Format');
                 }
             } catch (e) {
                 setStatus('Not a JSON file');
             }
         } else {
             setStatus('File not found');
         }
     } catch (e) {
         setStatus('Error');
     }
     setTimeout(() => setStatus(''), 2000);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Save: Ctrl+S
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleSave();
            return;
        }

        // Delete: Delete/Backspace (only if no input is focused)
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea') return;
            
            if (selectedCardId) {
                e.preventDefault();
                deleteCard(selectedCardId);
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCardId, cards]); // Re-bind when dependencies change to access latest state

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden">
      {/* Left Sidebar: Toolbox */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4 z-10 shadow-sm">
        <div title="普通卡片" onClick={() => addCard('normal')} className="p-2 bg-gray-50 rounded hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors">
            <Heading3 className="w-5 h-5" />
        </div>
        <div title="统计卡片" onClick={() => addCard('stat')} className="p-2 bg-gray-50 rounded hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors">
            <BarChart3 className="w-5 h-5" />
        </div>
        <div title="高亮卡片" onClick={() => addCard('highlight')} className="p-2 bg-gray-50 rounded hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors">
            <LayoutTemplate className="w-5 h-5" />
        </div>
        <div title="引用卡片" onClick={() => addCard('quote')} className="p-2 bg-gray-50 rounded hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors">
            <Quote className="w-5 h-5" />
        </div>
        <div title="警示卡片" onClick={() => addCard('warning')} className="p-2 bg-gray-50 rounded hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors">
            <AlertTriangle className="w-5 h-5" />
        </div>
        <div title="代码卡片" onClick={() => addCard('code')} className="p-2 bg-gray-50 rounded hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors">
            <Code className="w-5 h-5" />
        </div>
      </div>

      {/* Center: Canvas */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Toolbar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Canvas</span>
                <div className="h-4 w-px bg-gray-300 mx-2"></div>
                
                {/* Theme Switcher */}
                <div className="flex items-center gap-1.5 mr-2 px-2">
                   <Palette className="w-3 h-3 text-gray-400" />
                   {THEMES.map(t => (
                      <button
                        key={t.id}
                        title={`Theme: ${t.name}`}
                        onClick={() => setCurrentTheme(t.id)}
                        className={`w-3 h-3 rounded-full transition-transform ring-1 ring-black/5 ${currentTheme === t.id ? 'scale-125 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
                        style={{ backgroundColor: t.color }}
                      />
                   ))}
                </div>
                <div className="h-4 w-px bg-gray-300 mx-2"></div>

                <div className="flex items-center bg-gray-100 rounded p-0.5">
                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1 hover:bg-white rounded"><Minimize className="w-3 h-3" /></button>
                    <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-1 hover:bg-white rounded"><Maximize className="w-3 h-3" /></button>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 rounded-md px-2 py-1 border border-gray-200">
                    <input 
                        className="bg-transparent border-none outline-none text-xs w-32 font-mono"
                        value={fileName}
                        onChange={e => setFileName(e.target.value)}
                        placeholder="filename.json"
                    />
                </div>
                <button onClick={handleLoad} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="加载示例">
                    <FolderOpen className="w-4 h-4" />
                </button>
                <button onClick={handleSave} className="p-1.5 text-primary hover:bg-primary/10 rounded" title="保存到本地">
                    <Save className="w-4 h-4" />
                </button>
                {status ? (
                    <span className="text-xs text-gray-500 min-w-[60px]">{status}</span>
                ) : (
                    <span className="text-xs text-gray-400 min-w-[60px] transition-opacity">
                        {isSaving ? 'Saving...' : lastSaved ? 'Autosaved' : ''}
                    </span>
                )}
            </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-100 overflow-auto p-8 relative">
            <div 
                className="bg-white shadow-xl min-h-[800px] p-8 transition-transform origin-top-left grid grid-cols-2 gap-4"
                style={{ 
                    width: '100%', 
                    maxWidth: '1200px',
                    transform: `scale(${scale})`,
                    marginLeft: 'auto',
                    marginRight: 'auto'
                }}
            >
                {cards.map((card, idx) => (
                    <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onClick={() => setSelectedCardId(card.id)}
                        className={`
                        relative group border-2 rounded-xl p-4 cursor-pointer transition-all
                        ${card.colSpan === 12 ? 'col-span-2' : 'col-span-1'}
                        ${card.aspectRatio === '1/1' ? 'aspect-square' : ''}
                            ${card.aspectRatio === '16/9' ? 'aspect-video' : ''}
                            ${card.aspectRatio === '4/3' ? 'aspect-[4/3]' : ''}
                            ${card.color || (card.type === 'highlight' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100')}
                            ${selectedCardId === card.id ? '!border-primary ring-2 ring-primary/20 z-10' : 'hover:border-gray-300'}
                            ${card.type === 'stat' ? 'flex flex-col items-center justify-center text-center' : ''}
                        `}
                    >
                        <div className="pointer-events-none">
                            <h3 className="font-bold text-gray-800 mb-2">{card.title}</h3>
                            <div className="text-sm text-gray-600 whitespace-pre-wrap">{card.content}</div>
                        </div>
                        
                        {/* Drag Handle */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 cursor-move p-1 bg-gray-100 rounded text-gray-400 hover:text-gray-700">
                            <Move className="w-4 h-4" />
                        </div>
                    </div>
                ))}

                {/* Empty State / Add Placeholder */}
                {cards.length === 0 && (
                    <div className="col-span-2 h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400">
                        <Plus className="w-12 h-12 mb-2 opacity-50" />
                        <span>Add cards from the left toolbar</span>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Right Sidebar: Properties */}
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col shrink-0">
         <div className="p-4 border-b border-gray-200 font-bold text-sm text-gray-700">Properties</div>
         
         {selectedCard ? (
             <div className="p-4 space-y-4 overflow-y-auto">
                 <div>
                     <label className="text-xs font-medium text-gray-500 block mb-1">Title</label>
                     <input 
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-primary outline-none"
                        value={selectedCard.title}
                        onChange={e => updateCard(selectedCard.id, { title: e.target.value })}
                     />
                 </div>
                 
                 <div>
                     <label className="text-xs font-medium text-gray-500 block mb-1">Content</label>
                     <textarea 
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-primary outline-none min-h-[100px]"
                        value={selectedCard.content}
                        onChange={e => updateCard(selectedCard.id, { content: e.target.value })}
                     />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-2">
                         <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">宽度占比</span>
                         <select 
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-primary outline-none"
                            value={selectedCard.colSpan}
                            onChange={e => updateCard(selectedCard.id, { colSpan: Number(e.target.value) as 3 | 4 | 6 | 12 })}
                         >
                             <option value={12}>全宽 (1/1)</option>
                             <option value={9}>3/4</option>
                             <option value={8}>2/3</option>
                             <option value={6}>半宽 (1/2)</option>
                             <option value={4}>三分之一 (1/3)</option>
                             <option value={3}>四分之一 (1/4)</option>
                         </select>
                     </div>
                     <div>
                         <label className="text-xs font-medium text-gray-500 block mb-1">Aspect Ratio</label>
                         <select 
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-primary outline-none"
                            value={selectedCard.aspectRatio}
                            onChange={e => updateCard(selectedCard.id, { aspectRatio: e.target.value as any })}
                         >
                             <option value="auto">Auto</option>
                             <option value="16/9">16:9</option>
                             <option value="4/3">4:3</option>
                             <option value="1/1">1:1</option>
                         </select>
                     </div>
                 </div>

                 <div>
                     <label className="text-xs font-medium text-gray-500 block mb-1">Style Type</label>
                     <select 
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-primary outline-none"
                        value={selectedCard.type}
                        onChange={e => updateCard(selectedCard.id, { type: e.target.value as any })}
                     >
                         <option value="normal">Normal</option>
                         <option value="stat">Stat</option>
                         <option value="highlight">Highlight</option>
                         <option value="quote">Quote</option>
                         <option value="warning">Warning</option>
                         <option value="code">Code</option>
                     </select>
                 </div>

                 <div>
                     <label className="text-xs font-medium text-gray-500 block mb-2">Color</label>
                     <div className="flex flex-wrap gap-2">
                         {CARD_COLORS.map(c => (
                             <button
                                 key={c.id}
                                 title={c.name}
                                 onClick={() => updateCard(selectedCard.id, { color: c.class })}
                                 className={`
                                    w-6 h-6 rounded-full border transition-all
                                    ${c.class} 
                                    ${(selectedCard.color || 'bg-white border-gray-100') === c.class ? 'ring-2 ring-primary ring-offset-1 scale-110' : 'hover:scale-110'}
                                 `}
                             />
                         ))}
                     </div>
                 </div>

                 <div className="pt-4 border-t border-gray-100">
                     <button 
                        onClick={() => deleteCard(selectedCard.id)}
                        className="w-full py-2 bg-red-50 text-red-600 text-sm font-medium rounded hover:bg-red-100 flex items-center justify-center gap-2"
                     >
                         <Trash2 className="w-4 h-4" />
                         Delete Card
                     </button>
                 </div>
             </div>
         ) : (
             <div className="p-8 text-center text-gray-400 text-sm">
                 Select a card to edit its properties
             </div>
         )}
      </div>
    </div>
  );
};
