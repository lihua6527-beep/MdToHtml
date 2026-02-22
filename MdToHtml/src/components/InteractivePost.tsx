'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Edit, Save, Eye, Layout, ArrowLeft, CheckCircle, AlertTriangle, X, Download } from 'lucide-react';
import { CHDRenderer } from '@/components/CHD/CHDRenderer';
import { useMarkdownInteraction } from '@/hooks/useMarkdownInteraction';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { parseCHDBlocks } from '@/lib/chdParser';
import { RuleBasedScorer } from '@/lib/scorer';
import { ScoreResponse } from '@/types/model-interface';
import { clsx } from 'clsx';
import { HtmlBundler } from '@/lib/export/HtmlBundler';
import { useTheme } from '@/components/ThemeProvider';

interface InteractivePostProps {
  initialContent: string;
  slug: string;
  decodedSlug: string;
}

const InteractivePost: React.FC<InteractivePostProps> = ({ initialContent, slug, decodedSlug }) => {
  const { theme } = useTheme();
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const { updateAttribute, updateContent, updateTitle, updateFrontmatter, moveCard, deleteCard, addCard, undo, canUndo, operationLog, batchUpdateAttributes } = useMarkdownInteraction(content, setContent);
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

    // If status is 'pending' and content changes, switch to 'modified'
    // But we need to distinguish user edits from status updates themselves
    // We check the last operation in operationLog
    if (operationLog.length > 0) {
        const lastOp = operationLog[operationLog.length - 1];
        // If last op was updateFrontmatter, it might be us changing status, so ignore to prevent loop if we were strict
        // But here we only auto-switch if status is 'pending'.
        // If we change status to 'modified', this effect runs again, but status is 'modified', so no op.
        if (docStatus === 'pending' && lastOp.type !== 'updateFrontmatter') {
            // Auto switch to modified
            updateFrontmatter('status', 'modified');
        }
    }
  }, [content, docStatus, operationLog, updateFrontmatter]);

  // Clear selection when exiting edit mode
  React.useEffect(() => {
    if (!isEditing) {
        setSelectedBlockIndex(null);
    }
  }, [isEditing]);

  const router = useRouter();

  const handleStatusChange = (newStatus: string) => {
      // 1. Immediately update UI state for responsiveness
      setDocStatus(newStatus);

      let newContent = content;
      const lines = newContent.split('\n');
      
      // Manual Frontmatter Update to ensure batching and immediate save
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
              const trainIndex = fmLines.findIndex(l => l.trim().startsWith('training_sample:'));
              const isDone = newStatus === 'done';
              if (trainIndex >= 0) {
                  fmLines[trainIndex] = `training_sample: ${isDone}`;
              } else {
                  fmLines.push(`training_sample: ${isDone}`);
              }
              
              lines.splice(1, fmEnd - 1, ...fmLines);
              newContent = lines.join('\n');
          }
      }
      
      // 2. Update content state
      setContent(newContent);
      
      // 3. Trigger Save immediately with the overridden content
      // Note: We pass contentOverride to ensure saveFile uses the fresh content 
      // even if setContent (async) hasn't completed.
      saveFile(true, newContent);
  };

  const saveFile = async (silent = false, contentOverride?: string) => {
     let contentToSave = contentOverride || content;

     // Auto-update status from 'pending'/empty to 'modified' on manual save
     if (!contentOverride && (docStatus === 'pending' || !docStatus)) {
        const lines = contentToSave.split('\n');
        // Simple frontmatter check
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
                    fmLines[statusIndex] = `status: modified`;
                } else {
                    fmLines.push(`status: modified`);
                }
                
                lines.splice(1, fmEnd - 1, ...fmLines);
                contentToSave = lines.join('\n');
                
                // Update local state immediately so UI reflects it
                setContent(contentToSave);
            }
        }
     }

     setIsSaving(true);
     try {
        // Save to file (local dev) and Archive Session
        const res = await fetch('/api/save-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                slug: decodedSlug, 
                input: initialContent,
                output: contentToSave,
                operations: operationLog
            })
        });

        if (res.ok) {
            await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: decodedSlug, content: contentToSave })
            });

            if (!silent) {
                alert('保存并归档成功');
                setIsEditing(false);
            }
            router.refresh();
        } else {
            if (!silent) alert('保存失败');
        }
     } catch(e) {
        console.error(e);
        if (!silent) alert('保存请求出错');
     } finally {
        setIsSaving(false);
     }
  };

  const handleSave = () => saveFile(false);

  return (
    <div className="flex flex-col min-h-screen">
       {/* Navigation Header */}
       <div className="sticky top-0 z-50 h-14 bg-bg-card/80 backdrop-blur-md border-b border-border-soft flex items-center px-4 justify-between shadow-sm print:hidden">
          <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-primary transition-colors px-3 py-1.5 rounded-md hover:bg-secondary/20"
              >
                <ChevronLeft className="w-4 h-4" />
                返回首页
              </Link>
              
              <div className="h-4 w-px bg-border-soft/50" />
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

              {/* Status Toggle Group (After Score) */}
              {isEditing && (
                  <div className="flex items-center gap-1 mx-4 bg-secondary/10 p-1 rounded-lg border border-border-soft">
                      <button
                          onClick={() => handleStatusChange('pending')}
                          className={clsx(
                              "px-3 py-1 text-xs font-medium rounded-md transition-all",
                              (docStatus === 'pending' || !docStatus) 
                                ? "bg-amber-100 text-amber-700 shadow-sm" 
                                : "text-text-secondary hover:bg-secondary/20"
                          )}
                          title="文档需要修改"
                      >
                          未修改
                      </button>
                      <button
                          onClick={() => handleStatusChange('modified')}
                          className={clsx(
                              "px-3 py-1 text-xs font-medium rounded-md transition-all",
                              docStatus === 'modified' 
                                ? "bg-blue-100 text-blue-700 shadow-sm" 
                                : "text-text-secondary hover:bg-secondary/20"
                          )}
                          title="文档已进行修改"
                      >
                          修改中
                      </button>
                      <button
                          onClick={() => handleStatusChange('done')}
                          className={clsx(
                              "px-3 py-1 text-xs font-medium rounded-md transition-all",
                              docStatus === 'done' 
                                ? "bg-green-100 text-green-700 shadow-sm" 
                                : "text-text-secondary hover:bg-secondary/20"
                          )}
                          title="文档已完成并标记为训练样本"
                      >
                          已完成
                      </button>
                  </div>
              )}

              {/* Undo Button - Top Left Area */}
              {isEditing && (
                  <Button
                    onClick={undo}
                    disabled={!canUndo}
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-text-secondary hover:text-primary disabled:opacity-30"
                    title="撤销 (Undo)"
                  >
                    <ArrowLeft className="w-4 h-4" /> 撤销
                  </Button>
              )}
          </div>
          
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
             <div className="text-sm font-bold text-text-primary truncate max-w-[200px]">
                {decodedSlug}
             </div>
             <ThemeSwitcher />
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

       {/* Floating Export Button Removed - Moved to Top Bar */}
       {/* 
       <div className="absolute top-16 right-6 z-50">
          ...
       </div>
       */}

       {/* Content */}
       <div className="flex-1">
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
    </div>
  );
};

export default InteractivePost;
