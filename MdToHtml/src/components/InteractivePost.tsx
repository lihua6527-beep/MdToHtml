'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Edit, Save, Eye, Layout, ArrowLeft, CheckCircle, AlertTriangle, X, Download, Loader2 } from 'lucide-react';
import { CHDRenderer } from '@/components/CHD/CHDRenderer';
import { useMarkdownInteraction } from '@/hooks/useMarkdownInteraction';
import { useHistory } from '@/hooks/useHistory';
import { useScoring } from '@/hooks/useScoring';
import { useVisitHistory } from '@/hooks/useVisitHistory';
import { Button } from '@/components/ui/button';
import { FloatingUndoRedo } from '@/components/FloatingUndoRedo';
import { parseCHDBlocks } from '@/lib/chdParser';
import { clsx } from 'clsx';
import { HtmlBundler } from '@/lib/export/HtmlBundler';
import { useTheme } from '@/components/ThemeProvider';
import { BottomToolbar } from '@/components/CHD/BottomToolbar';
import { CardStyle } from '@/types/chd';
import { AVAILABLE_THEMES } from '@/lib/themes';
import { parseAttributes } from '@/lib/attributeParser';
import { CardShape } from '@/lib/shapes';
import { useCHDSelection } from '@/hooks/useCHDSelection';
import matter from 'gray-matter';
import { TagStyleType } from '@/components/CHD/TagRenderer';

interface InteractivePostProps {
  initialContent: string;
  slug: string;
  decodedSlug: string;
  initialStatus?: string | null;
  historyCount?: number;
}

const InteractivePost: React.FC<InteractivePostProps> = ({ initialContent, slug, decodedSlug, initialStatus, historyCount = 0 }) => {
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
  
  const triggerSaveRef = useRef<((content: string) => void) | null>(null);

  // Wrapper for content updates to ensure auto-save works even in View Mode
  const handleContentUpdate = useCallback((newContent: string) => {
    setContent(newContent);
    // If not in edit mode (e.g. status toggle, drag & drop), trigger save immediately
    if (!isEditing) {
        triggerSaveRef.current?.(newContent);
    }
  }, [setContent, isEditing]);

  // Note: We use useHistory's undo, so we ignore the ones from useMarkdownInteraction
  const { updateAttribute, updateContent, updateTitle, updateFrontmatter, moveCard, deleteCard, addCard, operationLog, batchUpdateAttributes } = useMarkdownInteraction(content, handleContentUpdate);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Record Visit History
  useVisitHistory(decodedSlug);

  // Real-time Scoring
  // Combine initial history count with current session operations for immediate feedback
  const effectiveHistoryCount = historyCount + operationLog.length;
  const { scoreResult, showScoreDetails, setShowScoreDetails } = useScoring(content, effectiveHistoryCount);

  // Toolbar State - Replaced with useCHDSelection hook
  const { activeSectionProps, activeCardProps, selectedSectionTitle } = useCHDSelection(content, selectedBlockIndex);

  // Parse Frontmatter for Global Settings
  const frontmatter = useMemo(() => {
    try {
        const { data } = matter(content);
        return data || {};
    } catch (e) {
        console.warn('Frontmatter parsing failed', e);
        return {};
    }
  }, [content]);

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
  const [docStatus, setDocStatus] = useState<string | null>(initialStatus || null);
  
  // Use a ref to track if content has been modified by user
  const isContentModified = useRef(false);

  // Auto-transition Logic Removed
  // We trust the user to set the status manually. No auto-reset to 'incomplete'.
  // This prevents the "flash and revert" bug where existing status is overwritten.

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
        // Unified Save Logic: Call /api/save with content AND operations
        // This replaces the old /api/save-session + /api/save dual call
        const res = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                slug, 
                content: contentToSave,
                operations: operationLog
            })
        });

        if (res.ok) {
            console.log('Save successful');
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
            router.refresh();
        } else {
            console.error('Save failed');
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

  // Keep triggerSaveRef up to date
  useEffect(() => {
    triggerSaveRef.current = triggerDebouncedSave;
  });

  // Status Update Loading State
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  const handleStatusChange = (newStatus: string) => {
      // Prevent rapid clicks
      if (isStatusUpdating) return;
      
      // 1. Immediately update UI state (Optimistic)
      setDocStatus(newStatus);
      setIsStatusUpdating(true);

      // 2. Update via robust updateFrontmatter (batch update)
      // Use setTimeout to allow UI to render the loading state first
      setTimeout(() => {
          const isDone = ['done', 'completed'].includes(newStatus);
          
          updateFrontmatter({
              status: newStatus,
              training_sample: isDone
          });
          
          // Keep loading state for a moment to provide visual feedback
          setTimeout(() => {
              setIsStatusUpdating(false);
          }, 800);
      }, 50);
      
      // Note: triggerDebouncedSave is handled by handleContentUpdate wrapper passed to useMarkdownInteraction
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
     await debouncedSave(decodedSlug, contentToSave, initialContent, operationLog, router);
  };

  const handleSave = async () => {
      await saveFile(false);
      setIsEditing(false); // Exit edit mode after save
  };

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
                                <div className="text-xs text-text-secondary flex justify-between">样式布局: <span className="font-mono font-bold text-text-primary">{scoreResult.dimensions.styling}</span></div>
                                
                                <div className="col-span-2 h-px bg-border-soft my-1" />
                                
                                <div className="text-xs text-text-secondary flex justify-between">静态基准: <span className="font-mono font-bold text-text-primary">{scoreResult.baseScore || 0}</span></div>
                                <div className="text-xs text-text-secondary flex justify-between">过程加分: <span className="font-mono font-bold text-green-600">+{scoreResult.processBonus || 0}</span></div>
                                <div className="col-span-2 text-[10px] text-text-muted text-right mt-1">
                                    基于 {scoreResult.historyCount || 0} 次有效编辑
                                </div>
                            </div>

                            {/* Issues List */}
                            {scoreResult.totalScore < 80 && (
                                <div className="mb-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs text-blue-700">
                                    <div className="flex items-center gap-2 mb-1 font-bold">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        <span>AI 优化建议</span>
                                    </div>
                                    <p className="leading-relaxed opacity-90">
                                        当前文档评分较低 ({scoreResult.totalScore}分)。建议使用 AI 重新生成文档内容，通常可以获得 85+ 的基准分，再进行人工微调效率更高。
                                    </p>
                                </div>
                            )}

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
                      disabled={isStatusUpdating}
                      className={clsx(
                          "flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all",
                          ['pending', 'modified', 'incomplete', ''].includes(docStatus || '')
                            ? "bg-amber-100 text-amber-700 shadow-sm" 
                            : "text-text-secondary hover:bg-secondary/20",
                          isStatusUpdating && "opacity-70 cursor-wait"
                      )}
                      title="文档需要修改"
                  >
                      {isStatusUpdating && ['pending', 'modified', 'incomplete', ''].includes(docStatus || '') && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                      )}
                      未完成
                  </button>
                  <button
                      onClick={() => handleStatusChange('completed')}
                      disabled={isStatusUpdating}
                      className={clsx(
                          "flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all",
                          ['done', 'completed'].includes(docStatus || '')
                            ? "bg-green-100 text-green-700 shadow-sm" 
                            : "text-text-secondary hover:bg-secondary/20",
                          isStatusUpdating && "opacity-70 cursor-wait"
                      )}
                      title="文档已完成并锁定"
                  >
                      {isStatusUpdating && ['done', 'completed'].includes(docStatus || '') && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                      )}
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
                        className={clsx("gap-2 transition-all", saveSuccess && "bg-green-600 hover:bg-green-700")}
                        disabled={isSaving}
                    >
                        {saveSuccess ? <CheckCircle size={14} /> : <Save size={14} />} 
                        {isSaving ? '保存中...' : (saveSuccess ? '已保存' : '保存修改')}
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
            tagStyle={(frontmatter['tag-style'] as TagStyleType) || 'glass'}
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
                tagStyle={(frontmatter['tag-style'] as TagStyleType) || 'glass'}
                onTagStyleChange={(style) => updateFrontmatter('tag-style', style)}
                selectedBlockIndex={selectedBlockIndex}
                
                // Section Props
                sectionLayout={activeSectionProps.layout}
                onSectionLayoutChange={(layout) => {
                    if (activeSectionProps.blockIndex !== -1) {
                        updateAttribute(activeSectionProps.blockIndex, 'layout', layout);
                    }
                }}
                sectionColor={activeSectionProps.color || 'default'}
                onSectionColorChange={(color) => {
                    if (activeSectionProps.blockIndex !== -1) {
                        updateAttribute(activeSectionProps.blockIndex, 'section-color', color);
                    }
                }}
                sectionColumns={parseInt(String(activeSectionProps.columns || '2'), 10)}
                onSectionColumnsChange={(cols) => {
                    if (activeSectionProps.blockIndex !== -1) {
                        // Batch update for all cards in the section to maintain grid consistency
                        const blocks = parseCHDBlocks(content);
                        const updates: Array<{blockIndex: number, key: string, value: any}> = [];
                        
                        // 1. Update Section columns
                        updates.push({
                            blockIndex: activeSectionProps.blockIndex,
                            key: 'columns',
                            value: String(cols)
                        });

                        // 2. Update Section layout (if switching from non-grid)
                        if (activeSectionProps.layout === 'list' || activeSectionProps.layout === 'stack' || activeSectionProps.layout === 'single') {
                            updates.push({
                                blockIndex: activeSectionProps.blockIndex,
                                key: 'layout',
                                value: ''
                            });
                        }

                        // 3. Update ALL child cards to match new column count
                        const newSpan = Math.floor(12 / cols);
                        
                        // Find cards belonging to this section
                        // They start after the section block and end before the next section
                        for (let i = activeSectionProps.blockIndex + 1; i < blocks.length; i++) {
                            const block = blocks[i];
                            if (block.type === 'section') break; // Next section found
                            
                            if (block.type === 'card' || block.type === 'code') {
                                updates.push({
                                    blockIndex: i,
                                    key: 'col-span',
                                    value: String(newSpan)
                                });
                            }
                        }

                        batchUpdateAttributes(updates);
                    }
                }}
                sectionTitleSpacing={String(frontmatter['title-spacing'] || '2')}
                onSectionTitleSpacingChange={(spacing) => {
                    updateFrontmatter('title-spacing', spacing);
                }}
                sectionShowDivider={frontmatter['show-divider'] === true || frontmatter['show-divider'] === 'true'}
                onSectionShowDividerChange={(show) => {
                    updateFrontmatter('show-divider', String(show));
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
