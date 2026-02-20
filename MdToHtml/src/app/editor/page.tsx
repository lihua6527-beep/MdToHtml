'use client';

import React, { useState, useRef, useEffect } from 'react';
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

export default function EditorPage() {
  const { theme } = useTheme();
  
  // Editor State
  const [content, setContent] = useState<string>('');
  const [currentFilename, setCurrentFilename] = useState<string>('示例1.md');
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeLine, setActiveLine] = useState<number>(0);
  // Track last saved content for diff logging
  const [lastSavedContent, setLastSavedContent] = useState<string>('');
  
  // Interaction Hook
  const { updateAttribute, updateContent, moveCard, batchUpdateAttributes } = useMarkdownInteraction(content, setContent);
  
  // Drag & Drop State
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
          <div className="w-1/2 bg-bg-page overflow-y-auto transition-colors duration-300">
             <ThemeScope className="min-h-full p-8">
                <CHDRenderer 
                  markdown={content} 
                  activeLine={activeLine}
                  onCardClick={(line) => {
                    setActiveLine(line);
                    // Also scroll editor to this line
                    if (editorRef.current) {
                      editorRef.current.scrollToLine(line);
                    }
                  }}
                  editMode={true}
                  onCardUpdate={(idx, attrs) => {
                      Object.entries(attrs).forEach(([key, value]) => {
                          updateAttribute(idx, key, value);
                      });
                  }}
                  onBatchCardUpdate={batchUpdateAttributes}
                  onContentUpdate={updateContent}
                  onCardMove={moveCard}
                />
             </ThemeScope>
          </div>

          {/* Floating Export Button Removed - Moved to Top Bar */}
       </div>
    </div>
  );
}
