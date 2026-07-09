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
import { ApiClient } from '@/services/core/ApiClient';
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
  

  
  // Tag Style from Frontmatter
  const tagStyle = useMemo<TagStyleType>(() => {
      try {
          const { data } = matter(content);
          return (data['tag-style'] as TagStyleType) || 'glass';
      } catch {
          return 'glass';
      }
  }, [content]);
  
  // Use useCHDSelection hook for derived state - now handles activeLine to block selection mapping
  const { activeSectionProps, activeCardProps, selectedSectionTitle, selectedBlockIndex } = useCHDSelection(content, activeLine);

  const [activeCardProps_Legacy, setActiveCardProps_Legacy] = useState<any>(null); // Placeholder to avoid breaking other code if any
  
  const [activeSectionProps_Legacy, setActiveSectionProps_Legacy] = useState<any>(null); // Placeholder

  // Interaction Hook
  const { updateAttribute, updateContent, updateTitle, updateFrontmatter, moveCard, batchUpdateAttributes, addCard, deleteCard } = useMarkdownInteraction(content, setContent);

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
              // 通过设置 activeLine 来更新选择，useCHDSelection 会自动处理
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
            alert('编辑器仅支持 Markdown (.md) 文件。如需使用其他格式（如 .docx），请使用首页的 AI 转换功能。');
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
                onClick={async () => {
                    const slug = currentFilename.replace(/\.md$/i, '') || 'my-document';
                    try {
                        // 先保存到临时文件，确保预览用的最新内容
                        const result = await ApiClient.post<any>('/api/save-temp', { 
                            slug,
                            content
                        });
                        if (result && result.fileName) {
                            window.open(`/preview/__temp__${result.fileName}`, '_blank');
                        } else {
                            // 回退：直接打开 slug 预览（适合已保存的文件）
                            window.open(`/preview/${slug}`, '_blank');
                        }
                    } catch (e) {
                        // 出错时尝试直接打开
                        console.error('预览失败:', e);
                        window.open(`/preview/${slug}`, '_blank');
                    }
                }}
                title="在新窗口预览当前内容"
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
                    
                    // Also scroll editor to this line
                    if (editorRef.current) {
                      editorRef.current.scrollToLine(line);
                    }
                  }}
                  editMode={true}
                  selectedBlockIndex={selectedBlockIndex}
                  activeSectionBlockIndex={activeSectionProps.blockIndex}
                  onSelectBlock={(index) => {
                      // 选择通过 activeLine 自动管理，此处无需操作
                  }}
                  onSelectSection={(blockIndex, title, layoutProps) => {
                      console.log('[EditorPage] Explicit Section Selection:', { blockIndex, title });
                      
                      // 直接使用传递的blockIndex设置activeLine
                      // 避免再次解析导致的blockIndex不一致问题
                      try {
                          const blocks = parseCHDBlocks(content);
                          console.log('[EditorPage] Blocks parsed in onSelectSection:', blocks.length);
                          blocks.forEach((block, idx) => {
                              console.log('[EditorPage] Block', idx, ':', block.type, 'startLine:', block.startLine, 'title:', block.title);
                          });
                          
                          if (blockIndex >= 0 && blockIndex < blocks.length) {
                              const sectionBlock = blocks[blockIndex];
                              if (sectionBlock && sectionBlock.type === 'section') {
                                  console.log('[EditorPage] Setting activeLine to:', sectionBlock.startLine);
                                  setActiveLine(sectionBlock.startLine);
                              } else {
                                  console.log('[EditorPage] Block at index', blockIndex, 'is not a section:', sectionBlock?.type);
                                  // 尝试通过标题查找section
                                  const sectionByTitle = blocks.find(b => b.type === 'section' && b.title.includes(title));
                                  if (sectionByTitle) {
                                      console.log('[EditorPage] Found section by title:', sectionByTitle.title, 'startLine:', sectionByTitle.startLine);
                                      setActiveLine(sectionByTitle.startLine);
                                  }
                              }
                          } else {
                              console.log('[EditorPage] Block index', blockIndex, 'is out of range, total blocks:', blocks.length);
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
                 console.log('[EditorPage] Updating section layout:', { blockIndex: activeSectionProps.blockIndex, layout });
                 updateAttribute(activeSectionProps.blockIndex, 'layout', layout);
             }
         }}
         sectionColor={activeSectionProps.color}
         onSectionColorChange={(color) => {
             if (activeSectionProps.blockIndex !== -1) {
                 console.log('[EditorPage] Updating section color:', { blockIndex: activeSectionProps.blockIndex, color });
                 updateAttribute(activeSectionProps.blockIndex, 'section-color', color);
             }
         }}
         sectionColumns={activeSectionProps.columns}
         onSectionColumnsChange={(cols) => {
             if (activeSectionProps.blockIndex !== -1) {
                 try {
                     const blocks = parseCHDBlocks(content);
                     const updates: Array<{blockIndex: number, key: string, value: any}> = [];
                     
                     // 1. Update Section 'columns' prop
                     updates.push({
                         blockIndex: activeSectionProps.blockIndex,
                         key: 'columns',
                         value: String(cols)
                     });
                     
                     // 2. Batch update ALL child cards to match the new column count
                     // This enforces the layout on all cards, overriding any individual col-span settings
                     const newSpan = Math.floor(12 / cols);
                     
                     // Find all cards in the current section
                     let inCurrentSection = false;
                     blocks.forEach((block, idx) => {
                         if (block.type === 'section' && idx === activeSectionProps.blockIndex) {
                             inCurrentSection = true;
                         } else if (block.type === 'section' && inCurrentSection) {
                             inCurrentSection = false;
                         } else if (inCurrentSection && (block.type === 'card' || block.type === 'code')) {
                             updates.push({
                                 blockIndex: idx,
                                 key: 'col-span',
                                 value: String(newSpan)
                             });
                         }
                     });
                     
                     if (updates.length > 0) {
                         console.log('[Columns Update] Applying to section and', updates.length - 1, 'cards');
                         batchUpdateAttributes(updates);
                     }
                 } catch (e) {
                     console.error('Failed to update columns', e);
                 }
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
             if (activeSectionProps.blockIndex !== -1) {
                 addCard(activeSectionProps.blockIndex);
             }
         }}
         onCardDelete={() => {
             if (selectedBlockIndex !== null) {
                 deleteCard(selectedBlockIndex);
                 // 选择会通过 activeLine 自动更新
             }
         }}
    />
    </div>
  );
}
