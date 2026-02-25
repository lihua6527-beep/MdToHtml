'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { INITIAL_CONTENT } from '@/components/Editor/MarkdownEditor';
import { CodeMirrorEditor, CodeMirrorEditorHandle } from '@/components/Editor/CodeMirrorEditor';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { loadFromStorage } from '@/hooks/useAutoSave';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { FileCode, Save, Download, Bold, Italic, List, Link as LinkIcon, Heading1, Heading2, Heading3, Code as CodeIcon, Upload, Home, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { parseCHDBlocks } from '@/lib/chdParser';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useTheme } from '@/components/ThemeProvider';
import { CHDRenderer } from '@/components/CHD/CHDRenderer';
import { ThemeScope } from '@/components/ThemeScope';
import { useMarkdownInteraction } from '@/hooks/useMarkdownInteraction';
import { HtmlBundler } from '@/lib/export/HtmlBundler';
import { BottomToolbar, CardStyle } from '@/components/CHD/BottomToolbar';
import { AVAILABLE_THEMES } from '@/lib/themes';
import { parseAttributes } from '@/lib/attributeParser';
import { CardShape } from '@/lib/shapes';

export default function EditorPage() {
  const { theme, setTheme } = useTheme();
  
  // Editor State
  const [content, setContent] = useState<string>('');
  const [currentFilename, setCurrentFilename] = useState<string>('示例1.md');
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeLine, setActiveLine] = useState<number>(0);
  // Track last saved content for diff logging
  const [lastSavedContent, setLastSavedContent] = useState<string>('');
  
  // Selection State for BottomToolbar
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [selectedSectionTitle, setSelectedSectionTitle] = useState<string | null>(null);
  const [activeSectionProps, setActiveSectionProps] = useState<{
      layout: string;
      color: string;
      columns: number;
      titleSpacing: string;
      blockIndex: number;
  }>({ layout: 'grid', color: 'default', columns: 2, titleSpacing: '2', blockIndex: -1 });

  const [activeCardProps, setActiveCardProps] = useState<{
      shape: CardShape;
      style: CardStyle;
      badge: string;
  }>({ shape: 'rect', style: 'normal', badge: '' });

  // Interaction Hook
  const { updateAttribute, updateContent, updateTitle, moveCard, batchUpdateAttributes, addCard, deleteCard } = useMarkdownInteraction(content, setContent);
  
  useEffect(() => {
      if (!content) return;
      // We wrap this in a try-catch to avoid parsing errors blocking the UI
      try {
        const blocks = parseCHDBlocks(content);
        
        // Find block containing activeLine
        const currentBlock = blocks.find(b => activeLine >= b.startLine && activeLine <= b.endLine);
        
        // [Architecture Fix: Inertia Selection]
        // 1. If activeLine is inside the currently selected card, do nothing (preserve selection).
        if (selectedBlockIndex !== null) {
            const currentSelectedCard = blocks[selectedBlockIndex];
            if (currentSelectedCard && activeLine >= currentSelectedCard.startLine && activeLine <= currentSelectedCard.endLine) {
                return;
            }
        }
        
        // 2. If activeLine is inside the currently selected section HEADER, do nothing.
        // But what if activeLine is in the "gap" after the header?
        // We want to KEEP the section selected if we are in the gap.
        // So we should only CHANGE selection if we hit a NEW block.
        
        if (currentBlock) {
             // We hit a known block. Is it different from current selection?
             
             if (currentBlock.type === 'card' || currentBlock.type === 'code') {
                 // Switch to Card Selection
                 const idx = blocks.indexOf(currentBlock);
                 if (idx !== selectedBlockIndex) {
                    console.log('[Selection Update] Switching to Card:', idx);
                    // ... (update logic)
                    setSelectedBlockIndex(idx);
                    // Extract Card Props...
                    const lines = content.split('\n');
                    const titleLine = lines[currentBlock.startLine];
                    const { props } = parseAttributes(titleLine.replace(/^(#+)\s+/, ''));
                    setActiveCardProps({
                        shape: (props.shape as CardShape) || 'rect',
                        style: (props['card-style'] as CardStyle) || 'normal',
                        badge: props.badge || ''
                    });
                    // Find parent section...
                    let sectionBlock = null;
                    let sectionIdx = -1;
                    for (let i = idx - 1; i >= 0; i--) {
                        if (blocks[i].type === 'section') {
                            sectionBlock = blocks[i];
                            sectionIdx = i;
                            break;
                        }
                    }
                    if (sectionBlock) {
                        const { cleanText, props: sProps } = parseAttributes(sectionBlock.title);
                        setSelectedSectionTitle(cleanText);
                        setActiveSectionProps({
                            layout: sProps.layout || 'grid',
                            color: sProps['section-color'] || 'default',
                            columns: parseInt(sProps.columns || sProps.cols || '2'),
                            titleSpacing: sProps['title-spacing'] || '2',
                            blockIndex: sectionIdx
                        });
                    } else {
                         setSelectedSectionTitle('Overview');
                         setActiveSectionProps({ layout: 'grid', color: 'default', columns: 2, titleSpacing: '2', blockIndex: -1 });
                    }
                 }
             } else if (currentBlock.type === 'section') {
                 // Switch to Section Selection
                 const idx = blocks.indexOf(currentBlock);
                 if (idx !== activeSectionProps.blockIndex || selectedBlockIndex !== null) {
                    console.log('[Selection Update] Switching to Section:', idx);
                    setSelectedBlockIndex(null); // No card selected
                    const { cleanText, props: sProps } = parseAttributes(currentBlock.title);
                              const titleToSet = cleanText || currentBlock.title.replace(/\{.*?\}/g, '').trim() || '未命名分区';
                              setSelectedSectionTitle(titleToSet);
                    setActiveSectionProps({
                        layout: sProps.layout || 'grid',
                        color: sProps['section-color'] || 'default',
                        columns: parseInt(sProps.columns || sProps.cols || '2'),
                        titleSpacing: sProps['title-spacing'] || '2',
                        blockIndex: idx
                    });
                    setActiveCardProps({ shape: 'rect', style: 'normal', badge: '' });
                 }
             }
        } else {
            // activeLine is in a gap (no block).
            // Do we clear selection?
            // NO. This is the key fix. If we are in a gap, we KEEP the previous selection.
            // This allows clicking "empty space" in a section without deselecting the section.
            console.log('[Selection Update] In gap - preserving selection');
        }
      } catch (e) {
           console.warn('Selection update failed', e);
       }
   }, [activeLine, content, selectedBlockIndex, activeSectionProps.blockIndex]);
  
  // Ensure state consistency when blockIndex changes
  useEffect(() => {
      // If we have a valid section selection, ensure selectedSectionTitle is synced
      if (activeSectionProps.blockIndex !== -1 && selectedBlockIndex === null) {
           const blocks = parseCHDBlocks(content);
           const sectionBlock = blocks[activeSectionProps.blockIndex];
           if (sectionBlock && sectionBlock.type === 'section') {
               const { cleanText } = parseAttributes(sectionBlock.title);
               const titleToSet = cleanText || sectionBlock.title.replace(/\{.*?\}/g, '').trim() || '未命名分区';
               if (selectedSectionTitle !== titleToSet) {
                   console.log('[Sync] Updating Section Title:', titleToSet);
                   setSelectedSectionTitle(titleToSet);
               }
           }
      }
  }, [activeSectionProps.blockIndex, selectedBlockIndex, content]);
  const [isDragging, setIsDragging] = useState(false);
  // Export State
  const [isExporting, setIsExporting] = useState(false);

  // Refs
  const editorRef = useRef<CodeMirrorEditorHandle>(null);

  // Debounce content for auto-save
  const debouncedContent = useDebounce(content, 1000);

  // Initialize
  useEffect(() => {
    setIsMounted(true);
    const saved = loadFromStorage('chd_md_content', INITIAL_CONTENT);
    setContent(saved);
    setLastSavedContent(saved);
  }, []);

  // Auto-Save
  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => {
      if (content) {
        localStorage.setItem('chd_md_content', content);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [content, isMounted]);

  // Extract Sections for BottomToolbar Dropdown (Matching CHDRenderer Logic)
  const sections = useMemo(() => {
      try {
          // If content is empty/loading, return empty array immediately
          if (!content) return [];

          const blocks = parseCHDBlocks(content);
          const result: Array<{ title: string, blockIndex: number }> = [];

          blocks.forEach((block, index) => {
              if (block.type === 'section') {
                  result.push({
                      title: block.title,
                      blockIndex: index
                  });
              }
          });
          
          // Debug Log: Only log if sections found or if explicitly checking
          if (result.length > 0) {
             console.log('[EditorPage] Parsed Sections:', result.length);
          } else {
             console.warn('[EditorPage] No sections found in content length:', content.length);
          }
          
          return result;
      } catch (e) {
          console.error('[EditorPage] Section parsing failed:', e);
          return [];
      }
  }, [content]);

  // Handle Section Selection from Toolbar (Fallback)
  const handleToolbarSectionSelect = (blockIndex: number) => {
      try {
          const blocks = parseCHDBlocks(content);
          const sectionBlock = blocks[blockIndex];
          if (sectionBlock && sectionBlock.type === 'section') {
              const { cleanText, props: sProps } = parseAttributes(sectionBlock.title);
              
              console.log('[EditorPage] Toolbar Selection:', cleanText);
              
              setSelectedSectionTitle(cleanText || '未命名分区');
              setActiveSectionProps({
                  layout: sProps.layout || 'grid',
                  color: sProps['section-color'] || 'default',
                  columns: parseInt(sProps.columns || sProps.cols || '2'),
                  titleSpacing: sProps['title-spacing'] || '2',
                  blockIndex: blockIndex
              });
              
              setSelectedBlockIndex(null);
              setActiveCardProps({ shape: 'rect', style: 'normal', badge: '' });
              
              // Sync cursor
              setActiveLine(sectionBlock.startLine);
          }
      } catch (e) {
          console.error('Toolbar selection failed', e);
      }
  };

  // Drag & Drop Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        const file = files[0];
        if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
            alert('请拖入 Markdown (.md) 文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setContent(event.target.result as string);
                setLastSavedContent(event.target.result as string);
                setCurrentFilename(file.name);
            }
        };
        reader.readAsText(file);
    }
  };

  // Editor Actions
  const insertMarkdown = (type: string) => {
    if (!editorRef.current) return;
    
    switch (type) {
        case 'bold': editorRef.current.insertText('**Bold Text**'); break;
        case 'italic': editorRef.current.insertText('*Italic Text*'); break;
        case 'h1': editorRef.current.insertText('# Heading 1\n'); break;
        case 'h2': editorRef.current.insertText('## Heading 2\n'); break;
        case 'h3': editorRef.current.insertText('### Heading 3\n'); break;
        case 'list': editorRef.current.insertText('- List Item\n'); break;
        case 'link': editorRef.current.insertText('[Link Text](url)'); break;
        case 'code': editorRef.current.insertText('\n```\nCode Block\n```\n'); break;
    }
  };

  // Export
  const handleExport = () => {
    const filename = prompt('请输入下载文件名:', currentFilename || `document-${new Date().toISOString().slice(0, 10)}.md`);
    if (!filename) return;
    const finalFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Save to Workspace
  const handleSaveToWorkspace = async () => {
    const slug = prompt('请输入文件名 (不含 .md):', currentFilename.replace(/\.md$/i, '') || 'my-document');
    if (!slug) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, content })
      });
      
      if (res.ok) {
        // Log Training Data
        try {
            const blocks = parseCHDBlocks(content);
            await fetch('/api/dataset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    input: content, 
                    output: blocks,
                    previous_content: lastSavedContent,
                    current_content: content,
                    metadata: { slug }
                })
            });
            setLastSavedContent(content);
        } catch (err) {
            console.error('Failed to log training data', err);
        }

        alert('保存成功！数据已自动录入训练集。');
        setCurrentFilename(slug.endsWith('.md') ? slug : `${slug}.md`);
      } else {
        alert('保存失败');
      }
    } catch (e) {
      alert('保存出错');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="h-screen flex flex-col bg-bg-page overflow-hidden transition-colors duration-300">
       {/* Global App Header */}
       <div className="h-10 bg-bg-card border-b border-border-soft flex items-center justify-between px-4 text-text-primary shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Home className="w-4 h-4" />
                <span className="text-xs font-bold">返回首页</span>
            </Link>
            <div className="w-px h-4 bg-border-soft" />
            <div className="flex items-center gap-2 font-bold tracking-tight">
              <div className="w-5 h-5 bg-primary rounded flex items-center justify-center text-primary-foreground text-[10px]">C</div>
              <span className="text-sm">CHD 编辑器</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-secondary">
             <ThemeSwitcher />
             <div className="w-px h-4 bg-border-soft" />
             <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-text-primary hover:bg-primary/10 hover:text-primary"
                onClick={async () => {
                    setIsExporting(true);
                    try {
                        const title = currentFilename.replace(/\.md$/i, '') || 'Untitled';
                        const blob = await HtmlBundler.bundle(content, title, theme);
                        
                        // Sync to output directory
                        try {
                            const htmlContent = await blob.text();
                            await fetch('/api/save-export', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    filename: `${title}.html`,
                                    content: htmlContent
                                })
                            });
                            console.log('Export synced to output directory');
                        } catch (saveErr) {
                            console.error('Failed to sync export to output:', saveErr);
                        }

                        const url = URL.createObjectURL(blob);
                        
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${title}.html`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    } catch (err: any) {
                        console.error('Export failed:', err);
                        alert('导出失败：' + (err.message || '未知错误'));
                    } finally {
                        setIsExporting(false);
                    }
                }}
                disabled={isExporting}
                title="导出为静态网页 (HTML)"
             >
                <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                <span className="hidden sm:inline">{isExporting ? '导出中...' : '导出 HTML'}</span>
             </Button>
             <div className="w-px h-4 bg-border-soft" />
             <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-text-primary hover:bg-primary/10 hover:text-primary"
                onClick={() => {
                    const slug = currentFilename.replace(/\.md$/i, '') || 'my-document';
                    window.open(`/${slug}`, '_blank');
                }}
                title="在新窗口预览 (需先保存)"
             >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">新窗口预览</span>
             </Button>
             <Button 
                variant="default" 
                size="sm" 
                className="gap-2 h-7 text-xs"
                onClick={handleSaveToWorkspace} 
                disabled={isSaving}
             >
                <Save className="w-3 h-3" />
                {isSaving ? '保存中...' : '保存'}
             </Button>
          </div>
       </div>

       {/* Main Layout - Split View */}
       <div 
        className="flex-1 flex overflow-hidden relative"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
       >
          {/* Debug Overlay */}
          <div className="fixed bottom-24 left-4 bg-black/80 text-white p-2 rounded text-xs z-50 pointer-events-none font-mono">
              Line: {activeLine} <br/>
              Block: {selectedBlockIndex ?? 'null'} <br/>
              Section: {activeSectionProps.blockIndex ?? 'null'} <br/>
              Title: {selectedSectionTitle}
          </div>

          {/* Drag Overlay */}
          {isDragging && (
            <div 
                className="absolute inset-0 bg-primary/10 border-4 border-primary border-dashed z-50 flex flex-col items-center justify-center backdrop-blur-sm"
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <Upload className="w-16 h-16 text-primary mb-4 animate-bounce" />
                <p className="text-xl font-bold text-primary">松开鼠标加载文件</p>
            </div>
          )}

          {/* Left: Editor Region */}
          <div 
            className="w-1/2 flex flex-col bg-bg-card relative z-10 shadow-xl transition-colors duration-300 border-r border-border-soft"
          >
             {/* Editor Toolbar */}
             <div className="h-10 bg-bg-page border-b border-border-soft flex items-center px-2 gap-1 shrink-0 transition-colors duration-300">
                <div className="flex items-center gap-2 mr-4 pl-2 border-r border-border-soft pr-4">
                    <FileCode className="w-4 h-4 text-text-secondary" />
                    <span className="text-xs font-medium text-text-primary truncate max-w-[150px]">{currentFilename}</span>
                </div>
                
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertMarkdown('bold')} title="加粗">
                    <Bold className="w-4 h-4 text-text-secondary" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertMarkdown('italic')} title="斜体">
                    <Italic className="w-4 h-4 text-text-secondary" />
                </Button>
                <div className="w-px h-4 bg-border-soft mx-1" />
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertMarkdown('h1')} title="一级标题">
                    <Heading1 className="w-4 h-4 text-text-secondary" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertMarkdown('h2')} title="二级标题">
                    <Heading2 className="w-4 h-4 text-text-secondary" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertMarkdown('h3')} title="三级标题">
                    <Heading3 className="w-4 h-4 text-text-secondary" />
                </Button>
                <div className="w-px h-4 bg-border-soft mx-1" />
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertMarkdown('list')} title="无序列表">
                    <List className="w-4 h-4 text-text-secondary" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertMarkdown('code')} title="代码块">
                    <CodeIcon className="w-4 h-4 text-text-secondary" />
                </Button>
                <div className="w-px h-4 bg-border-soft mx-1" />
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertMarkdown('link')} title="链接">
                    <LinkIcon className="w-4 h-4 text-text-secondary" />
                </Button>

             </div>

             <GlobalErrorBoundary>
                 <CodeMirrorEditor 
                    ref={editorRef}
                    value={content} 
                    onChange={setContent} 
                    onCursorChange={setActiveLine}
                    className="h-full bg-bg-card"
                 />
             </GlobalErrorBoundary>
          </div>

          {/* Right: Preview Region */}
          <div className="w-1/2 bg-bg-page overflow-y-auto transition-colors duration-300 pb-[180px]">
             <ThemeScope className="min-h-full p-8">
                <CHDRenderer 
                  markdown={content} 
                  activeLine={activeLine}
                  onCardClick={(line) => {
                    console.log('[EditorPage] onCardClick received line:', line);
                    setActiveLine(line);
                    
                    // Direct Selection Logic (Force selection update)
                    try {
                        const blocks = parseCHDBlocks(content);
                        // Find block containing the clicked line
                        const currentBlock = blocks.find(b => line >= b.startLine && line <= b.endLine);
                        console.log('[EditorPage] Direct Selection - Found block:', currentBlock?.type, currentBlock?.id);

                        if (currentBlock) {
                            if (currentBlock.type === 'section') {
                                setSelectedBlockIndex(null); // Deselect any card
                                const { cleanText, props: sProps } = parseAttributes(currentBlock.title);
                                console.log('[EditorPage] Selecting Section Title:', cleanText);
                                setSelectedSectionTitle(cleanText);
                                setActiveSectionProps({
                                    layout: sProps.layout || 'grid',
                                    color: sProps['section-color'] || 'default',
                                    columns: parseInt(sProps.columns || sProps.cols || '2'),
                                    titleSpacing: sProps['title-spacing'] || '2',
                                    blockIndex: blocks.indexOf(currentBlock)
                                });
                                // Reset card props
                                setActiveCardProps({ shape: 'rect', style: 'normal', badge: '' });
                            } else if (currentBlock.type === 'card' || currentBlock.type === 'code') {
                                // Find index
                                const idx = blocks.indexOf(currentBlock);
                                setSelectedBlockIndex(idx);
                                // Parse props
                                const lines = content.split('\n');
                                const titleLine = lines[currentBlock.startLine];
                                const { props } = parseAttributes(titleLine.replace(/^(#+)\s+/, ''));
                                setActiveCardProps({
                                    shape: (props.shape as CardShape) || 'rect',
                                    style: (props['card-style'] as CardStyle) || 'normal',
                                    badge: props.badge || ''
                                });
                                // Find parent section for context
                                let sectionBlock = null;
                                let sectionIdx = -1;
                                for (let i = idx - 1; i >= 0; i--) {
                                    if (blocks[i].type === 'section') {
                                        sectionBlock = blocks[i];
                                        sectionIdx = i;
                                        break;
                                    }
                                }
                                if (sectionBlock) {
                                    const { cleanText, props: sProps } = parseAttributes(sectionBlock.title);
                                    setSelectedSectionTitle(cleanText);
                                    setActiveSectionProps({
                                        layout: sProps.layout || 'grid',
                                        color: sProps['section-color'] || 'default',
                                        columns: parseInt(sProps.columns || sProps.cols || '2'),
                                        titleSpacing: sProps['title-spacing'] || '2',
                                        blockIndex: sectionIdx
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        console.error('[EditorPage] Direct Selection Failed', e);
                    }

                    // Also scroll editor to this line
                    if (editorRef.current) {
                      editorRef.current.scrollToLine(line);
                    }
                  }}
                  editMode={true}
                  selectedBlockIndex={selectedBlockIndex}
                  activeSectionBlockIndex={activeSectionProps.blockIndex}
                  onSelectBlock={(index) => {
                      setSelectedBlockIndex(index);
                      // Optionally scroll to block
                      // We need to map block index to line number if we want to scroll
                  }}
                  onSelectSection={(blockIndex, title, layoutProps) => {
                      console.log('[EditorPage] Explicit Section Selection:', { blockIndex, title });
                      
                      // 1. Set Title Directly (Robust against parsing failures)
                      setSelectedSectionTitle(title || '未命名分区');
                      
                      // 2. Set Props Directly (Robust against stale closures)
                      setActiveSectionProps({
                          layout: layoutProps.layout || 'grid',
                          color: layoutProps['section-color'] || 'default',
                          columns: parseInt(layoutProps.columns || layoutProps.cols || '2'),
                          titleSpacing: layoutProps['title-spacing'] || '2',
                          blockIndex: blockIndex
                      });

                      // 3. Clear Card Selection
                      setSelectedBlockIndex(null); 
                      setActiveCardProps({ shape: 'rect', style: 'normal', badge: '' });

                      // 4. Sync Editor Cursor (Optional, for context)
                      try {
                          const blocks = parseCHDBlocks(content);
                          const sectionBlock = blocks[blockIndex];
                          if (sectionBlock) {
                               setActiveLine(sectionBlock.startLine);
                          }
                      } catch (e) {
                          console.warn('Failed to sync cursor to section', e);
                      }
                  }}
                  onCardUpdate={(idx, attrs) => {
                      Object.entries(attrs).forEach(([key, value]) => {
                          updateAttribute(idx, key, value);
                      });
                  }}
                  onBatchCardUpdate={batchUpdateAttributes}
                  onContentUpdate={updateContent}
                  onTitleUpdate={updateTitle}
                  onCardMove={moveCard}
                  onCardDelete={deleteCard}
                  onCardAdd={addCard}
                />
             </ThemeScope>
          </div>

          {/* Floating Export Button Removed - Moved to Top Bar */}
       </div>

    {/* Bottom Toolbar */}
    <BottomToolbar
         currentThemeIndex={AVAILABLE_THEMES.findIndex(t => t.id === theme) !== -1 ? AVAILABLE_THEMES.findIndex(t => t.id === theme) : 0}
         onThemeChange={(index) => {
             if (AVAILABLE_THEMES[index]) {
                 setTheme(AVAILABLE_THEMES[index].id);
             }
         }}
         selectedBlockIndex={selectedBlockIndex}
         selectedSectionTitle={selectedSectionTitle}
         sections={sections}
         onSelectSection={handleToolbarSectionSelect}
         
         // Section Props
         sectionLayout={activeSectionProps.layout}
         onSectionLayoutChange={(layout) => {
             if (activeSectionProps.blockIndex !== -1) {
                 updateAttribute(activeSectionProps.blockIndex, 'layout', layout);
             }
         }}
         sectionColor={activeSectionProps.color}
         onSectionColorChange={(color) => {
             if (activeSectionProps.blockIndex !== -1) {
                 updateAttribute(activeSectionProps.blockIndex, 'section-color', color);
             }
         }}
         sectionColumns={activeSectionProps.columns}
         onSectionColumnsChange={(cols) => {
             if (activeSectionProps.blockIndex !== -1) {
                 updateAttribute(activeSectionProps.blockIndex, 'columns', cols.toString());
             }
         }}
         sectionTitleSpacing={activeSectionProps.titleSpacing}
         onSectionTitleSpacingChange={(spacing) => {
             try {
                 const blocks = parseCHDBlocks(content);
                 const updates: Array<{blockIndex: number, key: string, value: any}> = [];
                 
                 // Apply spacing to ALL sections globally
                 blocks.forEach((block, idx) => {
                     if (block.type === 'section') {
                         updates.push({
                             blockIndex: idx,
                             key: 'title-spacing',
                             value: spacing
                         });
                     }
                 });
                 
                 if (updates.length > 0) {
                     console.log('[Global Spacing Update] Applying to', updates.length, 'sections');
                     batchUpdateAttributes(updates);
                 }
                 
                 // Update local state immediately for feedback
                 setActiveSectionProps(prev => ({ ...prev, titleSpacing: spacing }));
             } catch (e) {
                 console.error('Failed to update global spacing', e);
             }
         }}
         
         // Card Props
         cardShape={activeCardProps.shape}
         onCardShapeChange={(shape) => {
             if (selectedBlockIndex !== null) {
                 updateAttribute(selectedBlockIndex, 'shape', shape);
             }
         }}
         cardStyle={activeCardProps.style}
         onCardStyleChange={(style) => {
             if (selectedBlockIndex !== null) {
                 updateAttribute(selectedBlockIndex, 'card-style', style);
             }
         }}
         cardBadge={activeCardProps.badge}
         onCardBadgeChange={(badge) => {
             if (selectedBlockIndex !== null) {
                 updateAttribute(selectedBlockIndex, 'badge', badge);
             }
         }}

         // Actions
         onCardAdd={() => {
             // Add card to current section
             // We need to find the section index. 
             // If a card is selected, use its parent section.
             // If a section is selected, use it.
             if (selectedBlockIndex !== null) {
                 // Card selected -> find parent section
                 // We need to traverse back from selectedBlockIndex
                 // But CHDRenderer handles onCardAdd with section index.
                 // Here we just trigger add to current section.
                 // Since we don't have easy access to blocks here without parsing again,
                 // let's rely on CHDRenderer's onCardAdd or pass a generic "add" that handles it.
                 // Actually BottomToolbar calls onCardAdd without args.
                 // We should probably pass the section index if we know it.
                 if (activeSectionProps.blockIndex !== -1) {
                     addCard(activeSectionProps.blockIndex);
                 }
             } else if (activeSectionProps.blockIndex !== -1) {
                 addCard(activeSectionProps.blockIndex);
             }
         }}
         onCardDelete={() => {
             if (selectedBlockIndex !== null) {
                 deleteCard(selectedBlockIndex);
                 setSelectedBlockIndex(null);
             }
         }}
    />
    </div>
  );
}
