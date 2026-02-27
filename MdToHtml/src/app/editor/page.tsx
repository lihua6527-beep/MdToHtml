'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { INITIAL_CONTENT } from '@/data/editor-defaults';
import { CodeMirrorEditor, CodeMirrorEditorHandle } from '@/components/Editor/CodeMirrorEditor';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { loadFromStorage } from '@/hooks/useAutoSave';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { FileCode, Save, Download, Bold, Italic, List, Link as LinkIcon, Heading1, Heading2, Heading3, Code as CodeIcon, Upload, Home, ExternalLink, Check } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { parseCHDBlocks } from '@/lib/chdParser';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useTheme } from '@/components/ThemeProvider';
import { CHDRenderer } from '@/components/CHD/CHDRenderer';
import { ThemeScope } from '@/components/ThemeScope';
import { useMarkdownInteraction } from '@/hooks/useMarkdownInteraction';
import { HtmlBundler } from '@/lib/export/HtmlBundler';
import { BottomToolbar } from '@/components/CHD/BottomToolbar';
import { AVAILABLE_THEMES } from '@/lib/themes';
import { parseAttributes } from '@/lib/attributeParser';
import { CardShape } from '@/lib/shapes';
import { useCHDSelection } from '@/hooks/useCHDSelection';
import { CardStyle } from '@/types/chd';
import { TagStyleType } from '@/components/CHD/TagRenderer';
import matter from 'gray-matter';
import { FileService } from '@/services/FileService';

export default function EditorPage() {
  const { theme, setTheme } = useTheme();
  
  // Editor State
  const [content, setContent] = useState<string>('');
  const [currentFilename, setCurrentFilename] = useState<string>('示例1.md');
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeLine, setActiveLine] = useState<number>(0);
  // Track last saved content for diff logging
  const [lastSavedContent, setLastSavedContent] = useState<string>('');
  
  // Selection State for BottomToolbar
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  
  // Tag Style from Frontmatter
  const tagStyle = useMemo<TagStyleType>(() => {
      try {
          const { data } = matter(content);
          return (data['tag-style'] as TagStyleType) || 'glass';
      } catch {
          return 'glass';
      }
  }, [content]);
  
  // Use useCHDSelection hook for derived state
  const { activeSectionProps, activeCardProps, selectedSectionTitle } = useCHDSelection(content, selectedBlockIndex);

  const [activeCardProps_Legacy, setActiveCardProps_Legacy] = useState<any>(null); // Placeholder to avoid breaking other code if any
  
  const [activeSectionProps_Legacy, setActiveSectionProps_Legacy] = useState<any>(null); // Placeholder

  // Interaction Hook
  const { updateAttribute, updateContent, updateTitle, updateFrontmatter, moveCard, batchUpdateAttributes, addCard, deleteCard } = useMarkdownInteraction(content, setContent);
  
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
                    setSelectedBlockIndex(idx);
                 }
             } else if (currentBlock.type === 'section') {
                 // Switch to Section Selection
                 const idx = blocks.indexOf(currentBlock);
                 // Note: activeSectionProps comes from hook now. 
                 // We need to check if the section block index matches.
                 if (idx !== activeSectionProps.blockIndex || selectedBlockIndex !== null) {
                    console.log('[Selection Update] Switching to Section:', idx);
                    setSelectedBlockIndex(null); // No card selected, but we need to signal section selection?
                    // Wait, if selectedBlockIndex is null, useCHDSelection resets?
                    // No, useCHDSelection takes selectedBlockIndex.
                    // If selectedBlockIndex is null, it resets.
                    // BUT EditorPage logic was: if section selected, selectedBlockIndex is NULL, but activeSectionProps has blockIndex.
                    
                    // My hook implementation relies on selectedBlockIndex pointing to the selected block.
                    // If I select a section, selectedBlockIndex should be the SECTION's index.
                    // But EditorPage previously set selectedBlockIndex = null when section is selected.
                    
                    // I need to change this behavior. 
                    // Let's set selectedBlockIndex to the section index.
                    setSelectedBlockIndex(idx);
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
  // This effect is no longer needed as useCHDSelection handles it

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
              console.log('[EditorPage] Toolbar Selection:', sectionBlock.title);
              setSelectedBlockIndex(blockIndex);
              
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
  const handleSaveToWorkspace = React.useCallback(async (forcePrompt: boolean | React.MouseEvent = true) => {
    let slug = currentFilename.replace(/\.md$/i, '') || 'my-document';
    
    // Determine if we need to prompt
    // Always prompt if:
    // 1. Explicitly requested (forcePrompt === true)
    // 2. File is the default template ('示例1')
    // 3. File is 'my-document' (default fallback)
    const isDefault = slug === '示例1' || slug === 'my-document';
    const shouldPrompt = (forcePrompt === true) || isDefault;

    if (shouldPrompt) {
        const input = prompt('请输入文件名 (不含 .md):', slug);
        if (!input) return;
        slug = input;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const success = await FileService.saveFile(slug, content);
      
      if (success) {
        // Log Training Data
        try {
            const blocks = parseCHDBlocks(content);
            await FileService.logTrainingData({ 
                input: content, 
                output: blocks,
                previous_content: lastSavedContent,
                current_content: content,
                metadata: { slug }
            });
            setLastSavedContent(content);
        } catch (err) {
            console.error('Failed to log training data', err);
        }

        if (shouldPrompt) {
            alert('保存成功！数据已自动录入训练集。');
        } else {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
            console.log('Saved successfully');
        }
        
        setCurrentFilename(slug.endsWith('.md') ? slug : `${slug}.md`);
      } else {
        alert('保存失败');
      }
    } catch (e) {
      alert('保存出错');
    } finally {
      setIsSaving(false);
    }
  }, [currentFilename, content, lastSavedContent]);

  // Keyboard Shortcuts (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            // Silent save unless it's a new file
            handleSaveToWorkspace(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveToWorkspace]);

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
                            
                            // Parse frontmatter
                            const { data: frontmatter } = matter(content);
                            
                            await FileService.saveExport({
                                filename: `${title}.html`,
                                content: htmlContent,
                                metadata: {
                                    id: title,
                                    type: frontmatter.type || 'project',
                                    title: frontmatter.title || title,
                                    brief: frontmatter.brief || '',
                                    date: frontmatter.date ? new Date(frontmatter.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                                    tags: frontmatter.tags || [],
                                    chdVersion: '2.4',
                                    htmlFile: `${title}.html`
                                }
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
                className={clsx("gap-2 h-7 text-xs transition-all", saveSuccess && "bg-green-600 hover:bg-green-700")}
                onClick={handleSaveToWorkspace} 
                disabled={isSaving}
             >
                {saveSuccess ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                {isSaving ? '保存中...' : (saveSuccess ? '已保存' : '保存')}
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
                <div 
                    className="flex items-center gap-2 mr-4 pl-2 border-r border-border-soft pr-4 cursor-pointer hover:bg-slate-100 rounded px-1 transition-colors"
                    onClick={() => handleSaveToWorkspace(true)}
                    title="点击重命名"
                >
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
                            const idx = blocks.indexOf(currentBlock);
                            setSelectedBlockIndex(idx);
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
                      
                      // Just update the selected block index.
                      // useCHDSelection will handle parsing the props from content.
                      setSelectedBlockIndex(blockIndex);

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
                  tagStyle={tagStyle}
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
         tagStyle={tagStyle}
          onTagStyleChange={(s) => updateFrontmatter('tag-style', s)}
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
             } catch (e) {
                 console.error('Failed to update global spacing', e);
             }
         }}
         sectionShowDivider={activeSectionProps.showDivider}
         onSectionShowDividerChange={(show) => {
             if (activeSectionProps.blockIndex !== -1) {
                 updateAttribute(activeSectionProps.blockIndex, 'show-divider', String(show));
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
