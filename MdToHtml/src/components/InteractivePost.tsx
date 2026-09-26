'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Layout } from 'lucide-react';
import { CHDRenderer } from '@/components/CHD/CHDRenderer';
import { useVisitHistory } from '@/hooks/useVisitHistory';
import { FloatingUndoRedo } from '@/components/FloatingUndoRedo';
import { parseCHDBlocks } from '@/lib/chdParser';
import { useTheme } from '@/components/ThemeProvider';
import { BottomToolbar } from '@/components/CHD/BottomToolbar';
import { AVAILABLE_THEMES } from '@/lib/themes';
import { parseAttributes } from '@/lib/attributeParser';
import { useCHDSelection } from '@/hooks/useCHDSelection';
import { TagStyleType } from '@/components/CHD/TagRenderer';
import { useDocumentState } from '@/hooks/useDocumentState';
import NavigationHeader from '@/components/ui/NavigationHeader';
import { clsx } from 'clsx';
import { ConfigService } from '@/services/ConfigService';
import { AIInlineToolbar } from '@/components/AIInlineToolbar';
import type { AIActionType } from '@/components/AIInlineToolbar';
import { AIInlineResultDialog } from '@/components/AIInlineResultDialog';
import { AIService } from '@/services/ai/AIService';
import { OperationBuilder } from '@/lib/OperationBuilder';
import { OperationType } from '@/types/operation';

interface InteractivePostProps {
  initialContent: string;
  slug: string;
  decodedSlug: string;
  initialStatus?: string | null;
  historyCount?: number;
}

const InteractivePost: React.FC<InteractivePostProps> = ({ initialContent, slug, decodedSlug, initialStatus, historyCount = 0 }) => {
  const { theme, setTheme } = useTheme();
  const [globalConfig, setGlobalConfig] = useState<any>(null);
  
  // Record Visit History
  useVisitHistory(decodedSlug);
  
  // Use custom hook for document state management
  const {
    content,
    setContent,
    undo,
    redo,
    canUndo,
    canRedo,
    getCheckpoints,
    goToCheckpoint,
    setCheckpoint,
    isEditing,
    setIsEditing,
    selectedBlockIndex,
    setSelectedBlockIndex,
    isSaving,
    saveSuccess,
    handleSave,
    isExporting,
    setIsExporting,
    frontmatter,
    updateAttribute,
    updateContent,
    updateTitle,
    updateFrontmatter,
    moveCard,
    deleteCard,
    addCard,
    batchUpdateAttributes,
    handleBack
  } = useDocumentState({
    initialContent,
    decodedSlug,
    initialStatus,
    historyCount
  });
  
  // Fetch global config on component mount and when app-paths-updated event is triggered
  useEffect(() => {
    const fetchGlobalConfig = async () => {
      const appInfo = await ConfigService.getAppInfo();
      if (appInfo) {
        setGlobalConfig(appInfo.config);
      }
    };
    
    fetchGlobalConfig();
    
    const handleConfigUpdated = () => {
      fetchGlobalConfig();
    };
    
    window.addEventListener('app-paths-updated', handleConfigUpdated);
    return () => {
      window.removeEventListener('app-paths-updated', handleConfigUpdated);
    };
  }, []);
  
  // Active line state for section selection
  const [activeLine, setActiveLine] = useState<number | null>(null);
  
  // Toolbar State - Replaced with useCHDSelection hook
  const { activeSectionProps, activeCardProps, selectedSectionTitle } = useCHDSelection(content, activeLine);
  
  // Extract Sections for BottomToolbar
  const sections = React.useMemo(() => {
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
  
  // Ref for isSaving state (needed for NavigationHeader)
  const isSavingRef = useRef(false);
  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  // ── AI 内联编辑状态 ──
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiOriginalText, setAiOriginalText] = useState('');
  const [aiResultText, setAiResultText] = useState('');

  // 获取选中文本（从浏览器 DOM Selection）
  const getEditorSelection = useCallback((): string => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      return sel.toString().trim();
    }
    return '';
  }, []);

  // 占位函数：通过 AIInlineToolbar 的 replaceSelection prop
  // 当前流程使用 onAIAction + 弹窗替换，不走直接替换路径
  const replaceEditorSelection = useCallback((_text: string) => {
    // 无操作 — 替换通过 AIInlineResultDialog 的 onReplace 回调完成
  }, []);

  // 处理 AI 操作：调用 AI 服务并显示结果弹窗
  const handleAIAction = useCallback(async (action: AIActionType, selectedText: string, customPrompt?: string) => {
    setAiOriginalText(selectedText);
    setAiDialogOpen(true);
    setAiLoading(true);

    try {
      // 构建 prompt
      let promptText = '';
      switch (action) {
        case 'polish':
          promptText = `请润色以下文本，修正语法和表达：\n\n${selectedText}`;
          break;
        case 'expand':
          promptText = `请扩充以下文本，补充更多细节：\n\n${selectedText}`;
          break;
        case 'summarize':
          promptText = `请总结以下文本，提取要点：\n\n${selectedText}`;
          break;
        case 'to_card':
          promptText = `请将以下文本转为 CHD 卡片格式：\n\n${selectedText}`;
          break;
        case 'custom':
          promptText = `${customPrompt}\n\n${selectedText}`;
          break;
      }

      const result = await AIService.generate({
        text: promptText,
        config: {
          model: 'deepseek-chat',
          promptVariant: 'default',
        },
      });

      if (result.error) {
        setAiResultText(`错误：${result.error}`);
      } else {
        setAiResultText(result.markdown);
      }
    } catch (err: any) {
      setAiResultText(`AI 调用失败：${err.message || '未知错误'}`);
    } finally {
      setAiLoading(false);
    }
  }, []);

  // 处理替换操作：直接调用 setContent 推入撤销引擎
  const handleAIReplace = useCallback((newText: string) => {
    const selectedText = aiOriginalText;
    if (!selectedText) return;

    // 在 content 中查找选中文本的位置
    const idx = content.indexOf(selectedText);
    if (idx === -1) return;

    // 构建新内容
    const newContent = content.slice(0, idx) + newText + content.slice(idx + selectedText.length);

    // 创建 AI 操作（用于日志记录，后续可通过扩展 useHistory 接入完整撤销链）
    const aiOp = OperationBuilder.aiOperation({
      type: OperationType.AI_REPLACE,
      prompt: `AI 替换：${selectedText.slice(0, 30)}...`,
      tokensUsed: 0,
      diff: {
        before: selectedText,
        after: newText,
        position: idx,
      },
      producer: 'ai',
      description: `AI 内联编辑：替换文本`,
    });
    console.log('[AI] Operation created:', aiOp.id);

    // 使用 useDocumentState 暴露的 setContent 直接推入撤销引擎
    setContent(newContent);

    // 关闭弹窗并清空状态
    setAiDialogOpen(false);
    setAiOriginalText('');
    setAiResultText('');
  }, [content, aiOriginalText, setContent]);

  return (
    <div className="flex flex-col min-h-screen">
       {/* Navigation Header */}
       <NavigationHeader
         decodedSlug={decodedSlug}
         theme={theme}
         isEditing={isEditing}
         setIsEditing={setIsEditing}
         isSaving={isSaving}
         saveSuccess={saveSuccess}
         handleSave={handleSave}
         content={content}
         isExporting={isExporting}
         setIsExporting={setIsExporting}
         handleBack={handleBack}
         isSavingRef={isSavingRef}
       />


       {/* Floating Undo/Redo */}
       {isEditing && (
          <FloatingUndoRedo
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            getCheckpoints={getCheckpoints}
            goToCheckpoint={goToCheckpoint}
            setCheckpoint={setCheckpoint}
          />
       )}

       {/* AI 内联编辑工具栏 */}
       {isEditing && (
          <AIInlineToolbar
            getSelection={getEditorSelection}
            replaceSelection={replaceEditorSelection}
            onAIAction={handleAIAction}
            isLoading={aiLoading}
          />
       )}

       {/* AI 结果对比弹窗 */}
       <AIInlineResultDialog
         open={aiDialogOpen}
         onClose={() => {
           setAiDialogOpen(false);
           setAiOriginalText('');
           setAiResultText('');
         }}
         originalText={aiOriginalText}
         aiResult={aiResultText}
         isLoading={aiLoading}
         onReplace={handleAIReplace}
       />

       {/* Content */}
       <div className={clsx("flex-1 relative", isEditing && "pb-[180px]")}>
          <CHDRenderer 
            markdown={content}  
            editMode={isEditing}
            selectedBlockIndex={selectedBlockIndex}
            onSelectBlock={(blockIndex) => {
                setSelectedBlockIndex(blockIndex);
                try {
                    const blocks = parseCHDBlocks(content);
                    if (blockIndex !== null && blockIndex >= 0 && blockIndex < blocks.length) {
                        const block = blocks[blockIndex];
                        if (block) {
                            setActiveLine(block.startLine);
                        }
                    }
                } catch (e) {
                    console.warn('Failed to sync activeLine to block', e);
                }
            }}
            onCardClick={(line) => {
                setActiveLine(line);
                try {
                    const blocks = parseCHDBlocks(content);
                    const cardBlockIndex = blocks.findIndex(block => {
                        return (block.type === 'card' || block.type === 'code') && 
                               block.startLine <= line && 
                               block.endLine >= line;
                    });
                    if (cardBlockIndex !== -1) {
                        setSelectedBlockIndex(cardBlockIndex);
                    }
                } catch (e) {
                    console.warn('Failed to sync cursor to card', e);
                }
            }}
            onSelectSection={(blockIndex, title, layoutProps) => {
                try {
                    const blocks = parseCHDBlocks(content);
                    if (blockIndex >= 0 && blockIndex < blocks.length) {
                        const sectionBlock = blocks[blockIndex];
                        if (sectionBlock && sectionBlock.type === 'section') {
                            setActiveLine(sectionBlock.startLine);
                            setSelectedBlockIndex(blockIndex);
                        }
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
            onContentUpdate={(blockIndex, newContent) => updateContent(blockIndex, newContent)}
            onTitleUpdate={(blockIndex, newTitle) => updateTitle(blockIndex, newTitle)}
            onCardMove={(blockIndex, direction) => moveCard(blockIndex, direction)}
            onCardDelete={deleteCard}
            onCardAdd={(sectionBlockIndex) => addCard(sectionBlockIndex)}
            tagStyle={(frontmatter['tag-style'] as TagStyleType) || 'glass'}
            globalTitleSpacing={String(frontmatter['title-spacing'] || globalConfig?.renderOptions?.titleSpacing || '2')}
            globalShowDivider={(frontmatter['show-divider'] === true || frontmatter['show-divider'] === 'true') || globalConfig?.renderOptions?.showDivider || true}
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
                sectionTitleSpacing={String(frontmatter['title-spacing'] || globalConfig?.renderOptions?.titleSpacing || '2')}
                onSectionTitleSpacingChange={(spacing) => {
                    updateFrontmatter('title-spacing', spacing);
                }}
                sectionShowDivider={(frontmatter['show-divider'] === true || frontmatter['show-divider'] === 'true') || globalConfig?.renderOptions?.showDivider}
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
            />
       )}
    </div>
  );
};

export default React.memo(InteractivePost);