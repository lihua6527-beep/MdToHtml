'use client';

import React, { useMemo, useState, useEffect } from 'react';
import matter from 'gray-matter';
import { Section } from './Section';
import { parseCHDBlocks } from '@/lib/chdParser';
import { parseAttributes } from '@/lib/attributeParser';
import { useTheme } from '@/components/ThemeProvider';

// --- Types ---

export interface CHDRendererProps {
  markdown: string;
  activeLine?: number;
  onCardClick?: (lineIndex: number) => void;
  onError?: (error: string) => void;
  editMode?: boolean;
  selectedBlockIndex?: number | null;
  onSelectBlock?: (index: number | null) => void;
  onCardUpdate?: (lineIndex: number, newAttrs: Record<string, any>) => void;
  onBatchCardUpdate?: (updates: Array<{blockIndex: number, key: string, value: any}>) => void;
  onContentUpdate?: (lineIndex: number, newContent: string) => void;
  onTitleUpdate?: (lineIndex: number, newTitle: string) => void;
  onCardMove?: (lineIndex: number, direction: 'left' | 'right' | 'up' | 'down') => void;
  onCardDelete?: (lineIndex: number) => void;
  onCardAdd?: (sectionBlockIndex: number) => void;
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
  onSelectBlock,
  onCardUpdate,
  onBatchCardUpdate,
  onContentUpdate,
  onTitleUpdate,
  onCardMove,
  onCardDelete,
  onCardAdd
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
                    blockIndex: index
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
                    
                    const contentBody = lines.slice(block.startLine + 1, block.endLine + 1).join('\n').trim();
                    // Decode HTML entities and clean content
                    const cleanBody = contentBody
                        .replace(/&gt;/g, '>')
                        .replace(/&lt;/g, '<')
                        .replace(/&amp;/g, '&')
                        .replace(/&quot;/g, '"')
                        .replace(/&apos;/g, "'");

                    cleanContent = cleanBody.replace(/\n\s*---\s*$/, ''); 
                    
                    if (currentSection.layoutProps['card-style']) {
                        cardProps['card-style'] = currentSection.layoutProps['card-style'];
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
                
                // Only add card if it has content or is a code block
                // This prevents empty headings (like '### ' without text) from rendering as empty cards
                if (cleanContent.length > 0 || block.type === 'code') {
                    currentSection.cards.push(card);
                }
            }
        });

        if (currentSection) {
            result.push(currentSection);
        }

        // [Smart Sizing Logic] - DISABLED
        // This legacy logic assumes a 2/4 column grid and conflicts with the new 12-column system.
        // It prevents the Section component from applying correct default widths.
        /*
        result.forEach(section => {
            const relationship = section.layoutProps['relation'] || 'parallel';
            
            section.cards.forEach((card: any, index: number) => {
                if (!card.props['col-span']) {
                    // [Fix] Summary cards should default to full width (own line)
                    if (card.props['card-style'] === 'summary') {
                        card.props['col-span'] = '4';
                        return;
                    }

                    const textLen = card.content.length;
                    
                    if (relationship === 'parallel') {
                        if (textLen > 800) {
                            card.props['col-span'] = '2';
                        } else {
                            card.props['col-span'] = '1';
                        }
                    } else if (relationship === 'total-part') {
                        if (index === 0) {
                            card.props['col-span'] = '2';
                            card.props['row-span'] = '2';
                        } else {
                            card.props['col-span'] = '1';
                        }
                    } else {
                        // Mosaic
                        if (textLen > 600) {
                            card.props['col-span'] = '2';
                        } else {
                            if (index % 3 === 2) {
                                card.props['col-span'] = '2';
                            } else {
                                card.props['col-span'] = '1';
                            }
                        }
                    }
                }
            });
        });
        */

        return { sections: result, frontmatter: fm, error: null, blockMap: blockIndices };
    } catch (e: any) {
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
      <div className="px-8 space-y-12">
        {sections.map((section, index) => (
          <Section 
            key={index} 
            title={section.title} 
            layoutProps={section.layoutProps}
            cards={section.cards}
            blockIndex={section.blockIndex}
            editMode={editMode}
            selectedBlockIndex={selectedBlockIndex}
            onSelectBlock={onSelectBlock}
            onCardClick={onCardClick}
            activeLine={activeLine}
            onCardUpdate={onCardUpdate}
            onBatchCardUpdate={onBatchCardUpdate}
            onContentUpdate={onContentUpdate}
            onTitleUpdate={onTitleUpdate}
            onCardMove={onCardMove}
            onCardDelete={onCardDelete}
            onCardAdd={onCardAdd}
          />
        ))}
      </div>
    </div>
  );
};
