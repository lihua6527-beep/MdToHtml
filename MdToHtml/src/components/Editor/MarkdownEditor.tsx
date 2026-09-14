'use client';

import React, { useState, useEffect, useRef, useMemo, forwardRef } from 'react';
import { validateContent, ValidationResult } from '@/lib/validator';
import { useAutoSave, loadFromStorage } from '@/hooks/useAutoSave';
import { useEditorDragDrop } from '@/hooks/editor/useEditorDragDrop';
import { useEditorIO } from '@/hooks/editor/useEditorIO';
import { useEditorScroll, type MarkdownEditorHandle } from '@/hooks/editor/useEditorScroll';
import { 
  FileText,
  AlertCircle,
  XCircle,
  Wrench,
  ExternalLink,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { EXAMPLE_CONTENT, INITIAL_CONTENT } from '@/data/editor-defaults';
import { EDITOR_MENU_ITEMS } from '@/config/editor-menu';

interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  onCursorChange?: (line: number) => void;
  className?: string;
}

export type { MarkdownEditorHandle };

/** 扩展的编辑器句柄，增加选中文本获取 */
export interface ExtendedMarkdownEditorHandle extends MarkdownEditorHandle {
  getSelection: () => string;
  replaceSelection: (text: string) => void;
  getCursorLine: () => number;
}

export const MarkdownEditor = forwardRef<ExtendedMarkdownEditorHandle, MarkdownEditorProps>(({
  value,
  onChange,
  onScroll,
  onCursorChange,
  className
}, ref) => {
  // Internal state for uncontrolled mode (or initial load)
  const [internalContent, setInternalContent] = useState(() => loadFromStorage('chd_md_content', INITIAL_CONTENT));
  
  // Use controlled value if provided, else internal
  const content = value !== undefined ? value : internalContent;
  
  const setContent = (newVal: string | ((prev: string) => string)) => {
    let nextContent: string;
    if (typeof newVal === 'function') {
      nextContent = newVal(content);
    } else {
      nextContent = newVal;
    }
    
    if (onChange) {
      onChange(nextContent);
    } else {
      setInternalContent(nextContent);
    }
  };

  // 1. Hooks Integration
  const { filePath, setFilePath, status, setStatus, handleSave, handleLoad } = useEditorIO({
    content,
    setContent,
  });

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useEditorDragDrop({
    setContent,
    setFilePath,
    setStatus,
  });

  const { textareaRef, handleScroll } = useEditorScroll({
    ref: ref as any,
    onScroll
  });

  const { lastSaved, isSaving } = useAutoSave('chd_md_content', content, 3000);

  // 2. Local State for UI
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [menuFilter, setMenuFilter] = useState('');
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationResult[]>([]);

  const components = EDITOR_MENU_ITEMS;

  const filteredComponents = useMemo(() => {
    if (!menuFilter) return components;
    return components.filter(c => 
      c.label.toLowerCase().includes(menuFilter.toLowerCase()) || 
      c.id.toLowerCase().includes(menuFilter.toLowerCase())
    );
  }, [components, menuFilter]);

  // 3. Effects
  useEffect(() => {
    const errors = validateContent(content);
    setValidationErrors(errors);
  }, [content]);

  // 4. Handlers
  const updateActiveLine = (): number | undefined => {
    if (!textareaRef.current) return undefined;
    const cursor = textareaRef.current.selectionStart;
    const textBefore = textareaRef.current.value.slice(0, cursor);
    const line = textBefore.split('\n').length;
    if (onCursorChange) onCursorChange(line);
    return line;
  };

  // Smart Insert: Inserts at cursor position
  const insertText = (textToInsert: string, replaceTrigger = false) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent(prev => prev + '\n' + textToInsert + '\n');
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    let newContent = '';
    let newCursorPos = 0;

    if (replaceTrigger) {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const lineContent = text.substring(lineStart, start);
      const slashIndex = lineContent.lastIndexOf('/');
      
      const beforeSlash = text.substring(0, lineStart + slashIndex);
      const afterCursor = text.substring(end);
      
      newContent = beforeSlash + textToInsert + '\n' + afterCursor;
      newCursorPos = beforeSlash.length + textToInsert.length + 1;
    } else {
      newContent = text.substring(0, start) + textToInsert + text.substring(end);
      newCursorPos = start + textToInsert.length;
    }

    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      updateActiveLine();
    }, 0);
    
    setShowMenu(false);
  };

  // Input Handler: Detect Slash
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const lastLine = textBefore.split('\n').pop() || '';
    
    // Update active line
    const line = textBefore.split('\n').length;
    if (onCursorChange) onCursorChange(line);

    const slashMatch = lastLine.match(/\/([a-zA-Z0-9]*)$/);
    
    if (slashMatch) {
      const query = slashMatch[1];
      setMenuFilter(query);
      setActiveMenuIndex(0);
      
      if (!showMenu) {
         const lineHeight = 24; 
         const lines = textBefore.split('\n').length;
         const top = (lines * lineHeight) - (e.target.scrollTop || 0) + 10; 
         const left = 40 + (lastLine.length * 8); 
         
         const clampedTop = Math.min(top, 600); 
         
         setMenuPosition({ top: clampedTop, left });
         setShowMenu(true);
      }
    } else {
      setShowMenu(false);
    }
  };

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
      return;
    }

    if (showMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveMenuIndex(prev => (prev + 1) % filteredComponents.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveMenuIndex(prev => (prev - 1 + filteredComponents.length) % filteredComponents.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredComponents[activeMenuIndex]) {
          insertText(filteredComponents[activeMenuIndex].text, true);
        }
      } else if (e.key === 'Escape') {
        setShowMenu(false);
      }
    }
  };

  // Click handler to update cursor
  const handleClick = () => {
    updateActiveLine();
  };

  const handleFix = (fix: NonNullable<ValidationResult['fix']>, lineNum: number) => {
    if (fix.range === 'line') {
      const lines = content.split('\n');
      if (lines[lineNum - 1] !== undefined) {
        lines[lineNum - 1] = fix.newText;
        const newContent = lines.join('\n');
        setContent(newContent);
      }
    }
  };

  return (
    <div 
      className={`flex flex-col h-full bg-gray-50 text-gray-900 font-sans overflow-hidden relative ${className || ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-primary/20 backdrop-blur-sm flex items-center justify-center border-4 border-primary border-dashed m-4 rounded-xl pointer-events-none">
          <div className="bg-white px-8 py-6 rounded-xl shadow-xl flex flex-col items-center animate-bounce">
             <FileText className="w-12 h-12 text-primary mb-2" />
             <span className="text-lg font-bold text-gray-700">Drop Markdown file to edit</span>
          </div>
        </div>
      )}
      
      {/* 1. Top Navigation Bar */}
      <div className="h-14 border-b border-gray-200 bg-white flex items-center px-4 justify-between shrink-0 z-50 relative shadow-sm">
        <div className="flex items-center gap-6 flex-1">
          {/* File Manager */}
          <div className="flex items-center gap-2 flex-1 max-w-2xl">
             <div className="flex items-center bg-gray-100 rounded-md px-3 py-1.5 border border-gray-200 flex-1 transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                <span className="text-gray-400 text-xs mr-2 font-mono">ROOT/</span>
                <input 
                  className="bg-transparent border-none outline-none text-sm text-gray-700 w-full placeholder-gray-400 font-mono"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="path/to/file.md"
                />
             </div>
             <button onClick={handleLoad} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
               Load
             </button>
             <button onClick={handleSave} className="px-4 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-all active:scale-95 flex items-center gap-2">
               Save
             </button>
             <button 
               onClick={() => {
                 if (confirm('This will overwrite current content. Continue?')) {
                   setContent(EXAMPLE_CONTENT);
                 }
               }} 
               className="px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors flex items-center gap-1"
              title="加载系统设计示例文档"
             >
               <BookOpen className="w-3 h-3" />
               Example
             </button>
             {status ? (
                <span className="text-xs text-gray-500 animate-fade-in">{status}</span>
             ) : (
                <span className="text-xs text-gray-400 transition-opacity">
                    {isSaving ? 'Saving...' : lastSaved ? `Autosaved ${lastSaved.toLocaleTimeString()}` : ''}
                </span>
             )}
          </div>
        </div>

        <div className="flex items-center gap-3">
             <button 
               onClick={() => window.open('/preview', '_blank')}
               className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1"
              title="在新标签页中打开预览以测试交互"
             >
               <ExternalLink className="w-3 h-3" />
               Preview
             </button>
             <div className="text-[10px] px-2 py-1 bg-gray-100 rounded text-gray-500">Mode: Markdown</div>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Column 1: Component Palette (Left, ~12.5%) */}
        <div className="w-32 lg:w-[12.5%] flex flex-col border-r border-gray-200 bg-gray-50/50 shrink-0 transition-all">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-bold text-gray-700 text-xs flex items-center justify-center gap-2 uppercase tracking-wider">
              Toolbox
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {components.map((item, idx) => (
              <button
                key={idx}
                onClick={() => insertText(item.text)}
                className="w-full flex flex-col items-center gap-1 p-2 rounded-lg bg-white border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all group active:scale-[0.98]"
              >
                <div className="p-1.5 bg-gray-50 rounded-full group-hover:bg-primary/10 transition-colors">
                  <item.icon className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
                </div>
                <div className="text-[10px] font-medium text-gray-600 group-hover:text-primary text-center w-full truncate">
                  {item.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Column 2: Source Editor (Middle, Flex-1) */}
        <div className="flex-1 flex flex-col bg-white relative min-w-0 border-r border-gray-200 z-10 shadow-[5px_0_15px_-5px_rgba(0,0,0,0.05)]">
          <div className="p-2 border-b border-gray-100 flex justify-between items-center bg-white">
            <span className="text-xs font-medium text-gray-400 px-2">Markdown Source</span>
            <span className="text-[10px] text-green-500 font-mono px-2">Live Sync</span>
          </div>
          <textarea 
            ref={textareaRef}
            className="flex-1 w-full p-8 resize-none focus:outline-none font-mono text-sm leading-relaxed text-gray-800 bg-white selection:bg-primary/20"
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onClick={handleClick}
            onScroll={handleScroll}
            placeholder="Start typing your CHD document... (Type '/' for commands)"
            spellCheck={false}
          />
          
          {/* Slash Command Menu */}
          {showMenu && (
            <div 
              className="absolute z-50 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Insert Component
              </div>
              <div className="max-h-64 overflow-y-auto p-1">
                {filteredComponents.length > 0 ? (
                  filteredComponents.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => insertText(item.text, true)}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors ${
                        idx === activeMenuIndex 
                          ? 'bg-primary/10 text-primary' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-gray-400 text-center">No matches</div>
                )}
              </div>
            </div>
          )}

          {/* Validation Panel */}
          {validationErrors.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border border-red-100 overflow-hidden z-40 max-h-64 flex flex-col animate-in slide-in-from-bottom-2">
              <div className="bg-red-50 px-3 py-2 border-b border-red-100 flex justify-between items-center sticky top-0">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-red-700">CHD Protocol Issues ({validationErrors.length})</span>
                </div>
              </div>
              <div className="overflow-y-auto p-0 divide-y divide-gray-100">
                {validationErrors.map((err, idx) => (
                  <div key={idx} className="group flex flex-col gap-1 p-3 hover:bg-red-50 transition-colors">
                    <div className="flex items-start gap-2">
                       {err.type === 'error' ? (
                         <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                       ) : (
                         <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                       )}
                       <div className="flex-1">
                          <div className="flex items-baseline justify-between">
                            <span className={`text-xs font-semibold ${err.type === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                                {err.message}
                            </span>
                            <span className="font-mono text-[10px] text-gray-400 bg-white border px-1.5 rounded">Ln {err.line}</span>
                          </div>
                          
                          {/* Suggestion & Quick Fix */}
                          {err.suggestion && (
                             <div className="mt-1.5 text-xs text-gray-600 flex items-center gap-2">
                                <span className="font-medium text-gray-500">Suggestion:</span>
                                {err.suggestion}
                             </div>
                          )}
                          
                          {err.fix && (
                             <button 
                               onClick={() => handleFix(err.fix!, err.line)}
                               className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all text-xs font-medium w-fit"
                             >
                                <Wrench className="w-3 h-3" />
                                Auto Fix: Apply Change
                             </button>
                          )}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
MarkdownEditor.displayName = 'MarkdownEditor';
