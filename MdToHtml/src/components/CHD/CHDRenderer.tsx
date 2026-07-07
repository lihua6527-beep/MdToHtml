'use client';

import React, { useMemo, useState, useEffect } from 'react';
import matter from 'gray-matter';
import { Section } from './Section';
import { parseCHDBlocks } from '@/lib/chdParser';
import { parseAttributes } from '@/lib/attributeParser';
import { useTheme } from '@/components/ThemeProvider';
import { Cpu, Zap, TrendingUp, Award, Layers, Box, Globe, Tag } from 'lucide-react';
import { clsx } from 'clsx';
import { TagRenderer, TagStyleType } from './TagRenderer';

// --- Types ---

export interface CHDRendererProps {
  markdown: string;
  activeLine?: number;
  onCardClick?: (blockIndex: number) => void;
  onError?: (error: string) => void;
  editMode?: boolean;
  selectedBlockIndex?: number | null;
  activeSectionBlockIndex?: number; // Added for robust section selection
  onSelectBlock?: (index: number | null) => void;
  onSelectSection?: (index: number, title: string, layoutProps: Record<string, any>) => void; // Enhanced handler
  onCardUpdate?: (blockIndex: number, newAttrs: Record<string, any>) => void;
  onBatchCardUpdate?: (updates: Array<{blockIndex: number, key: string, value: any}>) => void;
  onContentUpdate?: (blockIndex: number, newContent: string) => void;
  onTitleUpdate?: (blockIndex: number, newTitle: string) => void;
  onCardMove?: (blockIndex: number, direction: 'left' | 'right' | 'up' | 'down') => void;
  onCardDelete?: (blockIndex: number) => void;
  onCardAdd?: (sectionBlockIndex: number) => void;
  tagStyle?: TagStyleType;
  globalTitleSpacing?: string;
  globalShowDivider?: boolean;
}

// --- Helper: Parse Attributes {key="val"} ---
// Moved to @/lib/attributeParser


// --- Component: Renderer ---

export const CHDRenderer: React.FC<CHDRendererProps> = ({ 
  markdown = '', 
  activeLine, 
  onCardClick, 
  onError, 
  editMode = false, 
  selectedBlockIndex,
  activeSectionBlockIndex,
  onSelectBlock,
  onSelectSection,
  onCardUpdate,
  onBatchCardUpdate,
  onContentUpdate,
  onTitleUpdate,
  onCardMove,
  onCardDelete,
  onCardAdd,
  tagStyle = 'glass',
  globalTitleSpacing,
  globalShowDivider
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);

  // Consolidated parsing logic with error handling
  const { sections, frontmatter, error, blockMap } = useMemo(() => {
    try {
        // 1. Parse Frontmatter
        let fm: any = {};
        try {
            const parsed = matter(markdown);
            fm = parsed.data;
        } catch (e) {
            console.warn('Frontmatter parsing failed', e);
        }

        // 2. Parse Blocks
        const blocks = parseCHDBlocks(markdown);
        
        // 3. Build Sections
        const result: any[] = [];
        let currentSection: any = null;
        const lines = markdown.split('\n');
        
        // Map to store block index for each card
        // We need to pass the block index to callbacks so we can locate the block in the original array
        const blockIndices: Record<string, number> = {};

        blocks.forEach((block, index) => {
            if (block.type === 'section') {
                if (currentSection) {
                    result.push(currentSection);
                }
                
                const { cleanText: title, props: layoutProps } = parseAttributes(block.title);
                currentSection = {
                    title,
                    layoutProps,
                    cards: [],
                    blockIndex: index,
                    startLine: block.startLine // Pass startLine for click-to-select
                };
            } else if (block.type === 'card' || block.type === 'code') {
                if (!currentSection) {
                     // Create implicit section if needed
                     currentSection = {
                         title: 'Overview',
                         layoutProps: {},
                         cards: [],
                         blockIndex: -1
                     };
                }
                
                let cardTitle = '';
                let cardProps: Record<string, string> = {};
                let cleanContent = '';

                if (block.type === 'code') {
                    cardTitle = block.title || 'Source Code';
                    cardProps = { 'card-style': 'code' };
                    // Content is strictly between the backticks
                    // Handle empty block case
                    if (block.endLine >= block.startLine) {
                        cleanContent = lines.slice(block.startLine, block.endLine + 1).join('\n');
                    }
                } else {
                    const { cleanText, props } = parseAttributes(block.title);
                    cardTitle = cleanText;
                    cardProps = props;
                    
                    // Get content including code blocks
                    const contentBody = lines.slice(block.startLine + 1, block.endLine + 1).join('\n');
                    // Decode HTML entities and clean content
                    const cleanBody = contentBody
                        .replace(/&gt;/g, '>')
                        .replace(/&lt;/g, '<')
                        .replace(/&amp;/g, '&')
                        .replace(/&quot;/g, '"')
                        .replace(/&apos;/g, "'");

                    // Clean content: remove unnecessary format symbols and ensure code blocks are properly preserved
                    cleanContent = cleanBody
                        .replace(/\n\s*---\s*$/, '')
                        .trim();
                    
                    // [Protocol Resolution 2026-02-24]
                    // Enforce Section-Level Consistency: All cards in a section MUST inherit style/color from the section.
                    // This overrides any individual card settings to reduce AI dimensionality.
                    if (currentSection.layoutProps['card-style']) {
                        cardProps['card-style'] = currentSection.layoutProps['card-style'];
                    }
                    if (currentSection.layoutProps['section-color']) {
                        // Map section-color to card-color
                        cardProps['card-color'] = currentSection.layoutProps['section-color'];
                        // Also ensure 'color' prop is set for compatibility
                        cardProps['color'] = currentSection.layoutProps['section-color'];
                    }
                }

                const card = {
                    title: cardTitle,
                    content: cleanContent,
                    props: cardProps,
                    startLine: block.startLine,
                    endLine: block.endLine,
                    blockIndex: index // Store the index in the blocks array
                };
                
                // Always add card regardless of content length
                // This ensures all cards are rendered
                currentSection.cards.push(card);
            }
        });

        if (currentSection) {
            result.push(currentSection);
        }

        // [Smart Sizing Logic] - ENABLED (v2.0)
        // Automatically determine column count based on number of cards if not specified.
        result.forEach(section => {
            // Skip if explicit layout is set
            if (section.layoutProps.columns || 
                section.layoutProps.cols || 
                (section.layoutProps.layout && section.layoutProps.layout !== 'grid' && !section.layoutProps.layout.startsWith('cols-'))) {
                return;
            }

            // [Smart Sizing Logic] - UPDATED (v2.1)
            // User Requirement: 
            // 1. Force equal width for all cards (handled in LayoutStrategies or by removing col-span here).
            // 2. Max 4 cards per row.
            // 3. Logic:
            //    - Count <= 4: columns = Count
            //    - Count >= 5: columns = 3 (e.g. 5 -> 3 cols [3, 2], 6 -> 3 cols [3, 3])
            
            const cardCount = section.cards.length;
            let smartColumns = 2; // Default

            if (cardCount === 1) {
                smartColumns = 1;
            } else if (cardCount === 2) {
                smartColumns = 2;
            } else if (cardCount === 3) {
                smartColumns = 3;
            } else if (cardCount === 4) {
                smartColumns = 4;
            } else if (cardCount >= 5) {
                // User explicitly requested: "If 5, become two 3-cols; if 6, become two 3-cols"
                // This implies a 3-column grid layout for any count >= 5.
                smartColumns = 3;
            }

            // Apply smart columns
            section.layoutProps.columns = String(smartColumns);
            
            // [Protocol Enforcement]
            // Remove 'col-span' from all cards to ensure equal width.
            section.cards.forEach((card: any) => {
                if (card.props['col-span']) {
                    delete card.props['col-span'];
                }
            });
        });

        return { sections: result, frontmatter: fm, error: null, blockMap: blockIndices };
    } catch (e: any) {
        console.error('Error parsing markdown:', e);
        return { sections: [], frontmatter: {}, error: e.message || 'Unknown rendering error', blockMap: {} };
    }
  }, [markdown]);

  // Handle error reporting
  useEffect(() => {
    if (error) {
      setInternalError(error);
      if (onError) onError(error);
    } else {
      setInternalError(null);
    }
  }, [error, onError]);

  if (internalError) {
    return (
      <div className="w-full h-full p-6 bg-bg-page overflow-auto">
         <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <h3 className="font-bold mb-1">渲染失败 (Rendering Failed)</h3>
            <p className="text-sm">{internalError}</p>
         </div>
         <div className="prose max-w-none">
            <h4 className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wider">Raw Content</h4>
            <pre className="whitespace-pre-wrap font-mono text-sm text-text-primary bg-bg-card p-4 rounded border border-border-soft shadow-sm">
              {markdown}
            </pre>
         </div>
      </div>
    );
  }

  // Handle empty state gracefully
  if (!markdown || markdown.trim().length === 0 || (sections.length === 0 && Object.keys(frontmatter).length === 0)) {
     return (
        <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary/50 min-h-[50vh]">
            <div className="w-16 h-16 mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 opacity-50"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">文档为空</h3>
            <p className="text-sm">该文档没有内容。请在编辑器中添加内容。</p>
        </div>
     );
  }

  return (
    <div className="w-full min-h-full pb-20">
      {/* Title / Header */}
      {(frontmatter.title || frontmatter.subtitle) && (
        <div className="px-8 pt-10 pb-6 mb-4 border-b border-border-soft/50 flex flex-col items-center text-center">
           {frontmatter.title && (
             <h1 className="text-4xl font-extrabold tracking-tight text-text-primary mb-3">
               {frontmatter.title}
             </h1>
           )}
           {frontmatter.subtitle && (
             <p className="text-xl text-text-secondary font-light">
               {frontmatter.subtitle}
             </p>
           )}
           {frontmatter.version && (
              <div className="mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                v{frontmatter.version}
              </div>
           )}

           {/* Frontmatter Tags Rendering */}
          <TagRenderer tags={frontmatter.tags} style={tagStyle} />
        </div>
      )}

      {/* Highlights (Legacy Support) */}
      {frontmatter.highlights && Array.isArray(frontmatter.highlights) && frontmatter.highlights.length > 0 && (
        <div className="px-8 mb-10">
           {/* Legacy Notice */}
           <div className="mb-6 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full w-fit border border-amber-100">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"/>
              <span className="font-medium">Legacy Format</span>
              <span className="opacity-80">Frontmatter &apos;highlights&apos; is deprecated in v1.3. Please migrate to Body Cards.</span>
           </div>
           
           {/* Render as Stat Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {frontmatter.highlights.map((h: string, i: number) => {
                  // Smart Split: "Title: Content"
                  let title = h;
                  let content = "";
                  
                  // Try to split by colon (English or Chinese)
                  // Prioritize the first colon found
                  const colonIndex = h.search(/[:：]/);
                  if (colonIndex !== -1 && colonIndex < h.length - 1) {
                      title = h.substring(0, colonIndex).trim();
                      content = h.substring(colonIndex + 1).trim();
                  }
                  
                  // Clean up title (remove quotes if any, though yaml parser handles this)
                  title = title.replace(/^['"]|['"]$/g, '');
                  content = content.replace(/^['"]|['"]$/g, '');

                  return (
                      <div key={i} className="p-6 rounded-xl border bg-bg-card shadow-sm border-border-soft flex flex-col items-center text-center">
                          <h3 className="text-3xl font-bold text-primary mb-2 leading-tight">{title}</h3>
                          {content && <p className="text-sm text-text-secondary font-medium">{content}</p>}
                      </div>
                  );
              })}
           </div>
        </div>
      )}

      {/* Sections */}
      <div className="px-8 max-w-[1600px] mx-auto flex flex-col">
        {sections.map((section, index) => (
          <React.Fragment key={index}>
            <Section 
              {...section} 
              globalTitleSpacing={String(frontmatter['title-spacing'] || globalTitleSpacing || '2')}
              globalShowDivider={(frontmatter['show-divider'] === true || frontmatter['show-divider'] === 'true') || globalShowDivider || true}
              activeLine={activeLine}
              onCardClick={onCardClick}
              editMode={editMode}
              selectedBlockIndex={selectedBlockIndex}
              activeSectionBlockIndex={activeSectionBlockIndex}
              onSelectBlock={onSelectBlock}
              onSelectSection={onSelectSection}
              onCardUpdate={onCardUpdate}
              onBatchCardUpdate={onBatchCardUpdate}
              onContentUpdate={onContentUpdate}
              onTitleUpdate={onTitleUpdate}
              onCardMove={onCardMove}
              onCardDelete={onCardDelete}
              onCardAdd={onCardAdd}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
