'use client';

import React, { useRef, useEffect, useState } from 'react';
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
    undo,
    redo,
    canUndo,
    canRedo,
    isEditing,
    setIsEditing,
    selectedBlockIndex,
    setSelectedBlockIndex,
    isSaving,
    saveSuccess,
    handleSave,
    isExporting,
    setIsExporting,
    documentType,
    showTypeDropdown,
    setShowTypeDropdown,
    handleTypeChange,
    docStatus,
    isStatusUpdating,
    handleStatusChange,
    frontmatter,
    updateAttribute,
    updateContent,
    updateTitle,
    updateFrontmatter,
    moveCard,
    deleteCard,
    addCard,
    batchUpdateAttributes,
    scoreResult,
    showScoreDetails,
    setShowScoreDetails,
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
  
  // Toolbar State - Replaced with useCHDSelection hook
  const { activeSectionProps, activeCardProps, selectedSectionTitle } = useCHDSelection(content, selectedBlockIndex);
  
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
  
  // Type to color mapping for document type display
  const typeColors: Record<string, string> = {
    project: 'bg-blue-100 text-blue-700',
    paper: 'bg-green-100 text-green-700',
    knowledge: 'bg-purple-100 text-purple-700',
    other: 'bg-gray-100 text-gray-700'
  };
  
  // Type to label mapping
  const typeLabels: Record<string, string> = {
    project: '项目',
    paper: '论文',
    knowledge: '知识',
    other: '其他'
  };
  
  // Ref for isSaving state (needed for NavigationHeader)
  const isSavingRef = useRef(false);
  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  return (
    <div className="flex flex-col min-h-screen">
       {/* Navigation Header */}
       <NavigationHeader
         decodedSlug={decodedSlug}
         theme={theme}
         documentType={documentType}
         showTypeDropdown={showTypeDropdown}
         setShowTypeDropdown={setShowTypeDropdown}
         handleTypeChange={handleTypeChange}
         docStatus={docStatus}
         isStatusUpdating={isStatusUpdating}
         handleStatusChange={handleStatusChange}
         scoreResult={scoreResult}
         showScoreDetails={showScoreDetails}
         setShowScoreDetails={setShowScoreDetails}
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
          />
       )}

       {/* Content */}
       <div className={clsx("flex-1 relative", isEditing && "pb-[180px]")}>
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
            onContentUpdate={(lineIndex, newContent) => updateContent(lineIndex, newContent)}
            onTitleUpdate={(lineIndex, newTitle) => updateTitle(lineIndex, newTitle)}
            onCardMove={(lineIndex, direction) => moveCard(lineIndex, direction)}
            onCardDelete={deleteCard}
            onCardAdd={(sectionBlockIndex) => addCard(sectionBlockIndex)}
            tagStyle={(frontmatter['tag-style'] as TagStyleType) || 'glass'}
            globalTitleSpacing={String(frontmatter['title-spacing'] || globalConfig?.renderOptions?.titleSpacing || '2')}
            globalShowDivider={(frontmatter['show-divider'] === true || frontmatter['show-divider'] === 'true') || globalConfig?.renderOptions?.showDivider || true}
          />
          {/* Document Type Label in Bottom Right */}
          <div className={`absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${typeColors[documentType] || typeColors.project} shadow-md`}>
            {typeLabels[documentType] || typeLabels.project}
          </div>
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
                activeCardBlockIndex={activeCardProps.blockIndex}
            />
       )}
    </div>
  );
};

export default React.memo(InteractivePost);
