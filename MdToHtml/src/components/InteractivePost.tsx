'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Edit, Save, Eye, Layout, ArrowLeft, CheckCircle, AlertTriangle, X, Download } from 'lucide-react';
import { CHDRenderer } from '@/components/CHD/CHDRenderer';
import { useMarkdownInteraction } from '@/hooks/useMarkdownInteraction';
import { useHistory } from '@/hooks/useHistory';
import { Button } from '@/components/ui/button';
import { FloatingUndoRedo } from '@/components/FloatingUndoRedo';
import { parseCHDBlocks } from '@/lib/chdParser';
import { RuleBasedScorer } from '@/lib/scorer';
import { ScoreResponse } from '@/types/model-interface';
import { clsx } from 'clsx';
import { HtmlBundler } from '@/lib/export/HtmlBundler';
import { useTheme } from '@/components/ThemeProvider';
import { BottomToolbar, CardStyle } from '@/components/CHD/BottomToolbar';
import { AVAILABLE_THEMES } from '@/lib/themes';
import { parseAttributes } from '@/lib/attributeParser';
import { CardShape } from '@/lib/shapes';

interface InteractivePostProps {
  initialContent: string;
  slug: string;
  decodedSlug: string;
}

const InteractivePost: React.FC<InteractivePostProps> = ({ initialContent, slug, decodedSlug }) => {
  const { theme, setTheme } = useTheme();
  // Use useHistory for state management instead of simple useState
  const { 
    state: content, 
    pushState: setContent, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useHistory(initialContent, { sessionId: decodedSlug });
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  
  // Note: We use useHistory's undo/redo, so we ignore the ones from useMarkdownInteraction
  const { updateAttribute, updateContent, updateTitle, updateFrontmatter, moveCard, deleteCard, addCard, operationLog, batchUpdateAttributes } = useMarkdownInteraction(content, setContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Record Visit History
  useEffect(() => {
    try {
        const visitedStr = localStorage.getItem('visited_docs');
        const visitedMap = visitedStr ? JSON.parse(visitedStr) : {};
        
        visitedMap[decodedSlug] = Date.now();
        localStorage.setItem('visited_docs', JSON.stringify(visitedMap));
    } catch (e) {
        console.error('Failed to update visit history', e);
    }
  }, [decodedSlug]);

  // Real-time Scoring
  const [scoreResult, setScoreResult] = useState<ScoreResponse | null>(null);
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  // Evaluate on initial load and content change
  useEffect(() => {
    // Only evaluate if content is present
    if (content) {
       const result = RuleBasedScorer.evaluate(content);
       setScoreResult(result);
       
       // Auto-show score details if critical errors found or score is very low
       if (result.totalScore === 0 || result.issues.some(i => i.severity === 'error')) {
           setShowScoreDetails(true);
       }
    } else {
        // Handle empty content specifically
        const result = RuleBasedScorer.evaluate('');
        setScoreResult(result);
        setShowScoreDetails(true);
    }
  }, [content]);

  // Toolbar State
  const [activeSectionProps, setActiveSectionProps] = useState<{
      layout: string;
      color: string;
      columns: number;
      titleSpacing: string;
      showDivider: boolean;
      blockIndex: number;
  }>({ layout: 'grid', color: 'default', columns: 2, titleSpacing: '2', showDivider: false, blockIndex: -1 });

  const [activeCardProps, setActiveCardProps] = useState<{
      shape: CardShape;
      style: CardStyle;
      badge: string;
      blockIndex: number;
  }>({ shape: 'rect', style: 'normal', badge: '', blockIndex: -1 });
  
  const [selectedSectionTitle, setSelectedSectionTitle] = useState('');

  // Sync Toolbar State with Selection
  useEffect(() => {
    if (!content || selectedBlockIndex === null) {
        setActiveSectionProps(prev => ({ ...prev, blockIndex: -1 }));
        setActiveCardProps(prev => ({ ...prev, blockIndex: -1 }));
        setSelectedSectionTitle('');
        return;
    }

    const blocks = parseCHDBlocks(content);
    const currentBlock = blocks[selectedBlockIndex];
    
    if (!currentBlock) return;

    if (currentBlock.type === 'section') {
        // Section Selected
        // Regex to extract props from title line
        const lines = content.split('\n');
        const titleLine = lines[currentBlock.startLine];
        const { props, cleanText } = parseAttributes(titleLine.replace(/^#+\s+/, ''));
        
        setActiveSectionProps({
            layout: props.layout || 'grid',
            color: props['section-color'] || 'default',
            columns: parseInt(props.columns || '2'),
            titleSpacing: props['title-spacing'] || '2',
            showDivider: props['show-divider'] === 'true',
            blockIndex: selectedBlockIndex
        });
        setSelectedSectionTitle(cleanText || '无标题分区');
        setActiveCardProps(prev => ({ ...prev, blockIndex: -1 }));
    } else if (currentBlock.type === 'card' || currentBlock.type === 'code') {
        // Card Selected
        const lines = content.split('\n');
        const titleLine = lines[currentBlock.startLine];
        const { props } = parseAttributes(titleLine.replace(/^#+\s+/, ''));
        
        setActiveCardProps({
            shape: (props.shape as CardShape) || 'rect',
            style: (props['card-style'] as CardStyle) || 'normal',
            badge: props.badge || '',
            blockIndex: selectedBlockIndex
        });

        // Find Parent Section
        let parentSectionIndex = -1;
        for (let i = selectedBlockIndex - 1; i >= 0; i--) {
            if (blocks[i].type === 'section') {
                parentSectionIndex = i;
                break;
            }
        }

        if (parentSectionIndex !== -1) {
            const parentBlock = blocks[parentSectionIndex];
            const pTitleLine = lines[parentBlock.startLine];
            const { props: sectionProps, cleanText } = parseAttributes(pTitleLine.replace(/^#+\s+/, ''));
            
            setActiveSectionProps({
                layout: sectionProps.layout || 'grid',
                color: sectionProps['section-color'] || 'default',
                columns: parseInt(sectionProps.columns || '2'),
                titleSpacing: sectionProps['title-spacing'] || '2',
                showDivider: sectionProps['show-divider'] === 'true',
                blockIndex: parentSectionIndex
            });
            setSelectedSectionTitle(cleanText || '无标题分区');
        } else {
             setActiveSectionProps(prev => ({ ...prev, blockIndex: -1 }));
             setSelectedSectionTitle('');
        }
    } else {
        setActiveSectionProps(prev => ({ ...prev, blockIndex: -1 }));
        setActiveCardProps(prev => ({ ...prev, blockIndex: -1 }));
        setSelectedSectionTitle('');
    }
  }, [content, selectedBlockIndex]);

  // Extract Sections for BottomToolbar
  const sections = useMemo(() => {
    if (!content) return [];
    const blocks = parseCHDBlocks(content);
    const lines = content.split('\n');
    return blocks
        .map((b, idx) => ({ block: b, index: idx }))
        .filter(item => item.block.type === 'section')
        .map(item => {
            const titleLine = lines[item.block.startLine];
            const { cleanText } = parseAttributes(titleLine.replace(/^#+\s+/, ''));
            return {
                title: cleanText || '无标题分区',
                blockIndex: item.index
            };
        });
  }, [content]);

  // Parse Document Status from Frontmatter
  const [docStatus, setDocStatus] = useState('');
  useEffect(() => {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
        const fm = match[1];
        const statusMatch = fm.match(/status:\s*(.*)/);
        if (statusMatch) {
            setDocStatus(statusMatch[1].trim());
        } else {
            setDocStatus('');
        }
    }
  }, [content]);

  // Auto-transition Logic
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
    }

    // Simplified Status Logic:
    // If status is empty, set to 'incomplete'
    // If status is 'completed', do NOT auto-switch back to 'incomplete' on edit (User request)
    // Only manual toggle changes status between 'incomplete' and 'completed'
    if (!docStatus) {
        updateFrontmatter('status', 'incomplete');
    }
  }, [content, docStatus, updateFrontmatter]);

  // Clear selection when exiting edit mode
  React.useEffect(() => {
    if (!isEditing) {
        setSelectedBlockIndex(null);
    }
  }, [isEditing]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, undo, redo]);

  const router = useRouter();

  const isSavingRef = useRef(false);
  const contentRef = useRef(content);
  
  // Update ref when content changes
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Debounced save function
  const debouncedSave = useRef(
    (async (slug: string, contentToSave: string, initialContent: string, operationLog: any[], router: any) => {
      isSavingRef.current = true;
      setIsSaving(true);
      try {
        console.log('Executing save for:', slug);
        const res = await fetch('/api/save-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                slug, 
                input: initialContent,
                output: contentToSave,
                operations: operationLog
            })
        });

        if (res.ok) {
            await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, content: contentToSave })
            });
            console.log('Save successful');
            router.refresh();
        } else {
            console.error('Save session failed');
        }
      } catch(e) {
        console.error('Save error:', e);
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    })
  ).current;

  // Debounce wrapper
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerDebouncedSave = (newContent: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    // Set saving state immediately to block navigation
    isSavingRef.current = true;
    setIsSaving(true);

    saveTimeoutRef.current = setTimeout(() => {
        debouncedSave(decodedSlug, newContent, initialContent, operationLog, router);
    }, 500);
  };

  const handleStatusChange = (newStatus: string) => {
      // 1. Immediately update UI state
      setDocStatus(newStatus);

      // 2. Calculate new content based on REF to avoid closure staleness
      let newContent = contentRef.current;
      const lines = newContent.split('\n');
      
      if (lines[0].trim() === '---') {
          let fmEnd = -1;
          for (let i = 1; i < lines.length; i++) {
              if (lines[i].trim() === '---') {
                  fmEnd = i;
                  break;
              }
          }
          
          if (fmEnd > 0) {
              const fmLines = lines.slice(1, fmEnd);
              
              // Update status
              const statusIndex = fmLines.findIndex(l => l.trim().startsWith('status:'));
              if (statusIndex >= 0) {
                  fmLines[statusIndex] = `status: ${newStatus}`;
              } else {
                  fmLines.push(`status: ${newStatus}`);
              }
              
              // Update training_sample
              const isDone = ['done', 'completed'].includes(newStatus);
              const trainIndex = fmLines.findIndex(l => l.trim().startsWith('training_sample:'));
              if (trainIndex >= 0) {
                  fmLines[trainIndex] = `training_sample: ${isDone}`;
              } else {
                  fmLines.push(`training_sample: ${isDone}`);
              }
              
              lines.splice(1, fmEnd - 1, ...fmLines);
              newContent = lines.join('\n');
          }
      }
      
      // 3. Update content state and ref
      setContent(newContent);
      contentRef.current = newContent;
      
      // 4. Trigger Debounced Save
      triggerDebouncedSave(newContent);
  };

  const handleBack = async () => {
    if (isSavingRef.current) {
        // Wait for save to complete
        const checkSave = setInterval(() => {
            if (!isSavingRef.current) {
                clearInterval(checkSave);
                router.push('/');
            }
        }, 100);
    } else {
        router.push('/');
    }
  };

  const saveFile = async (silent = false, contentOverride?: string) => {
     // Legacy direct save, kept for manual save button if needed
     const contentToSave = contentOverride || contentRef.current;
     debouncedSave(decodedSlug, contentToSave, initialContent, operationLog, router);
  };

  const handleSave = () => saveFile(false);

  // Auto-save
  useEffect(() => {
    if (!isEditing || !content) return;

    const timer = setTimeout(() => {
        saveFile(true); // Silent save
    }, 5000); // 5 seconds debounce

    return () => clearTimeout(timer);
  }, [content, isEditing]);

  return (
    <div className="flex flex-col min-h-screen">
       {/* Navigation Header */}
       <div className="sticky top-0 z-50 h-14 bg-bg-card/80 backdrop-blur-md border-b border-border-soft flex items-center px-4 justify-between shadow-sm print:hidden">
          <div className="flex items-center gap-4">
              {/* Back Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-text-secondary hover:text-primary"
                onClick={handleBack}
                disabled={isSaving}
              >
                  <ArrowLeft size={20} />
              </Button>

              {/* Score Indicator */}
              {scoreResult && (
                <div className="relative flex items-center">
                    <button 
                        onClick={() => setShowScoreDetails(!showScoreDetails)}
                        className="flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-secondary/10 border border-border-soft hover:bg-secondary/20 transition-colors"
                    >
                        {scoreResult.totalScore >= 90 ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className={clsx("text-sm font-semibold", 
                            scoreResult.totalScore >= 90 ? 'text-green-600' : 'text-yellow-600'
                        )}>
                            {scoreResult.totalScore}分
                        </span>
                    </button>

                    {showScoreDetails && (
                        <div className="absolute top-full left-0 mt-2 w-80 bg-bg-card border border-border-soft rounded-xl shadow-lg p-4 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-sm text-text-primary">评分详情</h4>
                                <button onClick={() => setShowScoreDetails(false)} className="text-text-muted hover:text-text-primary">
                                    <X size={14} />
                                </button>
                            </div>
                            
                            {/* Dimensions Breakdown */}
                            <div className="grid grid-cols-2 gap-2 mb-4 p-2 bg-bg-page rounded-lg">
                                <div className="text-xs text-text-secondary flex justify-between">结构规范: <span className="font-mono font-bold text-text-primary">{scoreResult.dimensions.structure}</span></div>
                                <div className="text-xs text-text-secondary flex justify-between">内容原子: <span className="font-mono font-bold text-text-primary">{scoreResult.dimensions.atomicity}</span></div>
                                <div className="text-xs text-text-secondary flex justify-between">元数据: <span className="font-mono font-bold text-text-primary">{scoreResult.dimensions.metadata}</span></div>
                                <div className="text-xs text-text-secondary flex justify-between">语法正确: <span className="font-mono font-bold text-text-primary">{scoreResult.dimensions.syntax}</span></div>
                            </div>

                            {/* Issues List */}
                            {scoreResult.issues.length > 0 ? (
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                    {scoreResult.issues.map((issue, idx) => (
                                        <div key={idx} className="bg-bg-page rounded p-3 text-xs border border-border-soft">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <span className={clsx(
                                                    "w-2 h-2 rounded-full flex-shrink-0",
                                                    issue.severity === 'error' ? "bg-red-500" : 
                                                    issue.severity === 'warning' ? "bg-amber-500" : "bg-blue-500"
                                                )} />
                                                <span className="font-bold text-text-primary">Line {issue.line}</span>
                                                <span className={clsx(
                                                    "ml-auto text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider",
                                                    issue.severity === 'error' ? "bg-red-100 text-red-600" : 
                                                    issue.severity === 'warning' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                                                )}>{issue.severity}</span>
                                            </div>
                                            <p className="text-text-secondary leading-relaxed break-words whitespace-pre-wrap">{issue.message}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-text-muted text-xs">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500/50" />
                                    完美！没有发现扣分项。
                                </div>
                            )}
                        </div>
                    )}
                </div>
              )}

              {/* Status Toggle Group (Always Visible) */}
              <div className="flex items-center gap-1 mx-4 bg-secondary/10 p-1 rounded-lg border border-border-soft">
                  <button
                      onClick={() => handleStatusChange('incomplete')}
                      className={clsx(
                          "px-3 py-1 text-xs font-medium rounded-md transition-all",
                          ['pending', 'modified', 'incomplete', ''].includes(docStatus || '')
                            ? "bg-amber-100 text-amber-700 shadow-sm" 
                            : "text-text-secondary hover:bg-secondary/20"
                      )}
                      title="文档需要修改"
                  >
                      未完成
                  </button>
                  <button
                      onClick={() => handleStatusChange('completed')}
                      className={clsx(
                          "px-3 py-1 text-xs font-medium rounded-md transition-all",
                          ['done', 'completed'].includes(docStatus || '')
                            ? "bg-green-100 text-green-700 shadow-sm" 
                            : "text-text-secondary hover:bg-secondary/20"
                      )}
                      title="文档已完成并锁定"
                  >
                      已完成
                  </button>
              </div>
          </div>
          
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
             <div className="text-sm font-bold text-text-primary truncate max-w-[200px]">
                {decodedSlug}
             </div>
          </div>

          <div className="flex items-center gap-2">
            
            <div className="h-4 w-px bg-border-soft mx-2" />

            {/* Export Button (Top Bar) */}
            <Button 
                variant="outline" 
                size="sm"
                className="gap-2 text-text-secondary hover:text-primary mr-2"
                onClick={async () => {
                    setIsExporting(true);
                    try {
                    const title = decodedSlug || 'Untitled';
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

            {isEditing ? (
                <>
                    <Button 
                        onClick={() => setIsEditing(false)} 
                        variant="ghost" 
                        size="sm"
                        className="gap-2 text-text-secondary"
                    >
                        <Eye size={14} /> 取消/预览
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        variant="default" 
                        size="sm"
                        className="gap-2"
                        disabled={isSaving}
                    >
                        <Save size={14} /> {isSaving ? '保存中...' : '保存修改'}
                    </Button>
                </>
            ) : (
                <Button 
                    onClick={() => setIsEditing(true)} 
                    variant="outline" 
                    size="sm"
                    className="gap-2"
                >
                    <Edit size={14} /> 编辑页面
                </Button>
            )}
          </div>
       </div>

       {/* Floating Undo/Redo */}
       {isEditing && (
          <FloatingUndoRedo 
            onUndo={undo} 
            onRedo={redo} 
            canUndo={canUndo} 
            canRedo={canRedo} 
          />
       )}

       {/* Content */}
       <div className={clsx("flex-1", isEditing && "pb-[180px]")}>
          <CHDRenderer 
            markdown={content}  
            editMode={isEditing}
            selectedBlockIndex={selectedBlockIndex}
            onSelectBlock={setSelectedBlockIndex}
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
       </div>

       {/* Bottom Toolbar */}
       {isEditing && (
            <BottomToolbar
                currentThemeIndex={AVAILABLE_THEMES.findIndex(t => t.id === theme) !== -1 ? AVAILABLE_THEMES.findIndex(t => t.id === theme) : 0}
                onThemeChange={(index) => {
                    if (AVAILABLE_THEMES[index]) {
                        setTheme(AVAILABLE_THEMES[index].id);
                    }
                }}
                selectedBlockIndex={selectedBlockIndex}
                
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
                    console.log('[Global Spacing] Updating to:', spacing);
                    // [Global Update] Update all sections with the new spacing
                    const blocks = parseCHDBlocks(content);
                    const updates = blocks
                        .filter(b => b.type === 'section')
                        .map(b => ({
                            blockIndex: blocks.indexOf(b),
                            key: 'title-spacing',
                            value: spacing
                        }));
                    
                    if (updates.length > 0) {
                        batchUpdateAttributes(updates);
                        // Optimistically update local state to reflect change immediately
                        setActiveSectionProps(prev => ({ ...prev, titleSpacing: spacing }));
                    }
                }}
                sectionShowDivider={activeSectionProps.showDivider}
                onSectionShowDividerChange={(show) => {
                    console.log('[Global Divider] Updating to:', show);
                    // [Global Update] Update all sections with the new divider setting
                    const blocks = parseCHDBlocks(content);
                    const updates = blocks
                        .filter(b => b.type === 'section')
                        .map(b => ({
                            blockIndex: blocks.indexOf(b),
                            key: 'show-divider',
                            value: String(show) // Convert boolean to string for markdown attribute
                        }));
                    
                    if (updates.length > 0) {
                        batchUpdateAttributes(updates);
                        // Optimistically update local state
                        setActiveSectionProps(prev => ({ ...prev, showDivider: show }));
                    }
                }}
                selectedSectionTitle={selectedSectionTitle}
                onCardAdd={() => {
                    if (activeSectionProps.blockIndex !== -1) {
                         addCard(activeSectionProps.blockIndex);
                    } else {
                         addCard(content.split('\n').length); 
                    }
                }}

                // Card Props
                cardShape={activeCardProps.shape}
                onCardShapeChange={(shape) => {
                    if (activeCardProps.blockIndex !== -1) {
                        updateAttribute(activeCardProps.blockIndex, 'shape', shape);
                    }
                }}
                cardStyle={activeCardProps.style}
                onCardStyleChange={(style) => {
                    if (activeCardProps.blockIndex !== -1) {
                        updateAttribute(activeCardProps.blockIndex, 'card-style', style);
                    }
                }}
                cardBadge={activeCardProps.badge}
                onCardBadgeChange={(badge) => {
                    if (activeCardProps.blockIndex !== -1) {
                        updateAttribute(activeCardProps.blockIndex, 'badge', badge);
                    }
                }}
                
                // Section List for Fallback Selection
                sections={sections}
                onSelectSection={(idx) => setSelectedBlockIndex(idx)}
                activeCardBlockIndex={activeCardProps.blockIndex}
            />
       )}
    </div>
  );
};

export default InteractivePost;
