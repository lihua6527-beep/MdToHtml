import { useCallback, useState, useEffect } from 'react';
import { parseCHDBlocks, CHDBlock } from '@/lib/chdParser';
import matter from 'gray-matter';

export interface OperationLogEntry {
  type: string;
  args: any[];
  timestamp: number;
}

import { parseAttributes } from '@/lib/attributeParser';

export interface MarkdownUpdater {
  updateAttribute: (blockIndex: number, key: string, value: any) => void;
  updateContent: (blockIndex: number, newContent: string) => void;
  updateTitle: (blockIndex: number, newTitle: string) => void;
  batchUpdateAttributes: (updates: Array<{blockIndex: number, key: string, value: any}>) => void;
  updateFrontmatter: (updates: Record<string, any> | string, value?: any) => void; // Robust & Batch
  moveCard: (blockIndex: number, direction: 'left' | 'right' | 'up' | 'down') => void;
  deleteCard: (blockIndex: number) => void;
  addCard: (sectionBlockIndex: number) => void;
  undo: () => void;
  canUndo: boolean;
  operationLog: OperationLogEntry[];
}

// Helper: Serialize attributes robustly
const serializeAttributes = (attrs: Record<string, string>) => {
  return Object.entries(attrs)
    .map(([k, v]) => {
      // If value contains spaces and not already quoted, quote it
      if (/\s/.test(v) && !/^["'].*["']$/.test(v)) {
        return `${k}="${v}"`;
      }
      return `${k}=${v}`;
    })
    .join(' '); // Use space as separator, not comma
};

export function useMarkdownInteraction(
  markdown: string,
  onUpdate: (newMarkdown: string) => void
): MarkdownUpdater {
  const [operationLog, setOperationLog] = useState<OperationLogEntry[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const logOperation = useCallback((type: string, ...args: any[]) => {
    setOperationLog(prev => [...prev, { type, args, timestamp: Date.now() }]);
  }, []);

  const handleUpdate = useCallback((newMarkdown: string) => {
    // Simple history tracking - improve later for robust undo/redo
    onUpdate(newMarkdown);
  }, [onUpdate]);

  // Auto-sanitize card styles: Enforce strict style rules
  useEffect(() => {
    if (!markdown) return;

    const lines = markdown.split('\n');
    let hasChanges = false;
    const validStyles = ['normal', 'highlight', 'quote', 'code'];

    const newLines = lines.map(line => {
      // Only check Card headers (Level 3+)
      const levelMatch = line.match(/^(###+)\s/);
      if (levelMatch) {
        const level = levelMatch[1];
        // Extract content after ####
        const contentWithAttrs = line.substring(levelMatch[0].length);
        const { cleanText, props } = parseAttributes(contentWithAttrs);

        if (props['card-style'] && !validStyles.includes(props['card-style'])) {
           hasChanges = true;
           // Auto-fix: Reset to normal
           props['card-style'] = 'normal';
           
           // Reconstruct
           const attrString = serializeAttributes(props);
           return attrString 
             ? `${level} ${cleanText} {${attrString}}`
             : `${level} ${cleanText}`;
        }
      }
      return line;
    });

    if (hasChanges) {
      console.log('[AutoFix] Sanitized invalid card styles in markdown input');
      // Use a timeout to break render cycle if necessary, but handleUpdate is safe here if stable
      handleUpdate(newLines.join('\n'));
    }
  }, [markdown, handleUpdate]);

  const undo = useCallback(() => {
    // Placeholder for undo logic
    console.warn('Undo not fully implemented');
  }, []);

  const canUndo = historyIndex > 0;

  const updateTitle = useCallback((blockIndex: number, newTitle: string) => {
      logOperation('updateTitle', blockIndex, newTitle);
      const blocks = parseCHDBlocks(markdown);
      const block = blocks[blockIndex];
      if (!block) return;
      
      const lines = markdown.split('\n');
      const line = lines[block.startLine];
      
      // Preserve level and attributes
      const levelMatch = line.match(/^(#+)\s/);
      const level = levelMatch ? levelMatch[1] : '###';
      
      // Parse attributes to preserve them
      const { props: attrs } = parseAttributes(line.replace(/^(#+)\s+/, ''));
      const attrString = serializeAttributes(attrs);
      
      if (attrString) {
          lines[block.startLine] = `${level} ${newTitle} {${attrString}}`;
      } else {
          lines[block.startLine] = `${level} ${newTitle}`;
      }
      
      handleUpdate(lines.join('\n'));
  }, [markdown, handleUpdate, logOperation]);

  // New: Update Frontmatter (Robust & Batch)
  const updateFrontmatter = useCallback((updates: Record<string, any> | string, value?: any) => {
    // Normalize input: updates can be Key(string)+Value(any) OR Map(object)
    const updatesMap: Record<string, any> = typeof updates === 'string' 
        ? { [updates]: value } 
        : updates;

    logOperation('updateFrontmatter', updatesMap);
    
    let lines = markdown.split('\n');
    let hasFrontmatter = lines[0]?.trim() === '---';
    let fmEnd = -1;

    // 保存现有的 type 字段值
    let existingType: string | undefined;
    if (hasFrontmatter) {
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '---') {
                fmEnd = i;
                break;
            }
            const match = lines[i].trim().match(/^type:\s*(.*)$/);
            if (match) {
                existingType = match[1].trim();
            }
        }
        // If no end found, treat as no frontmatter (broken)
        if (fmEnd === -1) hasFrontmatter = false;
    }

    if (!hasFrontmatter) {
        // Create Frontmatter
        const newFm = ['---'];
        // 保留现有的 type 字段（如果有）
        if (existingType) {
            newFm.push(`type: ${existingType}`);
        }
        // 添加其他更新的字段
        Object.entries(updatesMap).forEach(([k, v]) => {
            if (k !== 'type' || !existingType) { // 只有当没有现有 type 时才添加
                newFm.push(`${k}: ${v}`);
            }
        });
        newFm.push('---');
        newFm.push(''); // Empty line after
        
        // Insert frontmatter at the beginning, but preserve the rest of the content
        lines = [...newFm, ...lines];
    } else {
        // Update existing - first clean up any duplicate keys
        const fmLines = lines.slice(1, fmEnd);
        const existingKeys = new Set<string>();
        const cleanedFmLines: string[] = [];
        
        // First pass: remove duplicate keys, keeping only the last occurrence
        for (let i = fmLines.length - 1; i >= 0; i--) {
            const line = fmLines[i].trim();
            if (line) {
                const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
                if (match) {
                    const key = match[1];
                    if (!existingKeys.has(key)) {
                        existingKeys.add(key);
                        cleanedFmLines.unshift(line);
                    }
                } else {
                    // Keep non-key-value lines (comments, empty lines, etc.)
                    cleanedFmLines.unshift(line);
                }
            } else {
                // Keep empty lines
                cleanedFmLines.unshift(line);
            }
        }
        
        // Now update or add new keys
        Object.entries(updatesMap).forEach(([key, val]) => {
            // 跳过 type 字段，除非明确要更新它
            if (key === 'type' && existingType && !updatesMap.hasOwnProperty('type')) {
                return;
            }
            
            let found = false;
            for (let i = 0; i < cleanedFmLines.length; i++) {
                const line = cleanedFmLines[i].trim();
                const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
                if (match && match[1] === key) {
                    cleanedFmLines[i] = `${key}: ${val}`;
                    found = true;
                    break;
                }
            }
            if (!found) {
                cleanedFmLines.push(`${key}: ${val}`);
            }
        });
        
        // Reassemble
        lines = [lines[0], ...cleanedFmLines, ...lines.slice(fmEnd)];
    }

    // Ensure the frontmatter is properly formatted
    const updatedContent = lines.join('\n');
    
    // Validate the updated content to prevent breaking changes
    try {
        // Try to parse the updated content to ensure it's valid
        const { data } = matter(updatedContent);
        // If parsing succeeds, update the content
        handleUpdate(updatedContent);
    } catch (e) {
        console.warn('Frontmatter update failed, trying to clean up and retry:', e);
        // If parsing fails, try to clean up the content and retry
        try {
            const lines = updatedContent.split('\n');
            let inFrontmatter = false;
            const frontmatterLines: string[] = [];
            const contentLines: string[] = [];
            const seenKeys = new Set<string>();
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                if (line.trim() === '---') {
                    if (!inFrontmatter) {
                        inFrontmatter = true;
                        frontmatterLines.push(line);
                    } else {
                        frontmatterLines.push(line);
                        inFrontmatter = false;
                    }
                } else if (inFrontmatter) {
                    const match = line.trim().match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
                    if (match) {
                        const key = match[1];
                        if (!seenKeys.has(key)) {
                            seenKeys.add(key);
                            frontmatterLines.push(line);
                        }
                    } else {
                        frontmatterLines.push(line);
                    }
                } else {
                    contentLines.push(line);
                }
            }
            
            // Reassemble the content with cleaned frontmatter
            const cleanedContent = [...frontmatterLines, ...contentLines].join('\n');
            // Try to parse again
            const { data } = matter(cleanedContent);
            // If parsing succeeds, update the content
            handleUpdate(cleanedContent);
        } catch (e2) {
            console.warn('Failed to clean up frontmatter, reverting changes:', e2);
            // If cleanup also fails, don't update the content
        }
    }
  }, [markdown, handleUpdate, logOperation]);

  const updateAttribute = useCallback((blockIndex: number, key: string, value: any) => {
    logOperation('updateAttribute', blockIndex, key, value);
    console.log('[updateAttribute] Updating block:', blockIndex, 'key:', key, 'value:', value);
    const blocks = parseCHDBlocks(markdown);
    console.log('[updateAttribute] Total blocks:', blocks.length);
    if (blockIndex >= 0 && blockIndex < blocks.length) {
        const block = blocks[blockIndex];
        console.log('[updateAttribute] Block found:', block.type, 'startLine:', block.startLine, 'title:', block.title);
        if (block) {
            const lines = markdown.split('\n');
            const lineIndex = block.startLine;
            let line = lines[lineIndex];
            console.log('[updateAttribute] Updating line:', lineIndex, 'content:', line);

            // Use robust parser
            const { cleanText: prefix, props: attrs } = parseAttributes(line.replace(/^(#+)\s+/, ''));
            
            // Update value
            if (value === undefined || value === null || value === '') {
                delete attrs[key];
            } else {
                attrs[key] = String(value);
            }

            // Reconstruct
            const levelMatch = line.match(/^(#+)\s/);
            const level = levelMatch ? levelMatch[1] : '###';
            
            // Check if we need to add attributes
            const attrString = serializeAttributes(attrs);
            
            if (attrString) {
                lines[lineIndex] = `${level} ${prefix} {${attrString}}`;
            } else {
                lines[lineIndex] = `${level} ${prefix}`;
            }
            
            handleUpdate(lines.join('\n'));
        }
    }
  }, [markdown, handleUpdate, logOperation]);

  const batchUpdateAttributes = useCallback((updates: Array<{blockIndex: number, key: string, value: any}>) => {
    logOperation('batchUpdateAttributes', updates.length);
    const blocks = parseCHDBlocks(markdown);
    const lines = markdown.split('\n');
    
    // Group updates by blockIndex to minimize line parsing
    const updatesByBlock: Record<number, Record<string, any>> = {};
    updates.forEach(u => {
        if (!updatesByBlock[u.blockIndex]) updatesByBlock[u.blockIndex] = {};
        updatesByBlock[u.blockIndex][u.key] = u.value;
    });

    Object.entries(updatesByBlock).forEach(([bIdx, newAttrs]) => {
        const blockIndex = parseInt(bIdx);
        const block = blocks[blockIndex];
        if (!block) return;
        
        const lineIndex = block.startLine;
        const line = lines[lineIndex];
        
        // Parse existing
        const { cleanText: prefix, props: attrs } = parseAttributes(line.replace(/^(#+)\s+/, ''));
        
        // Apply updates
        Object.entries(newAttrs).forEach(([k, v]) => {
            if (v === undefined || v === null || v === '') {
                delete attrs[k];
            } else {
                attrs[k] = String(v);
            }
        });

        // Serialize
        const levelMatch = line.match(/^(#+)\s/);
        const level = levelMatch ? levelMatch[1] : '###';
        const attrString = serializeAttributes(attrs);

        if (attrString) {
            lines[lineIndex] = `${level} ${prefix} {${attrString}}`;
        } else {
            lines[lineIndex] = `${level} ${prefix}`;
        }
    });
    
    handleUpdate(lines.join('\n'));
  }, [markdown, handleUpdate, logOperation]);


  const updateContent = useCallback((blockIndex: number, newContent: string) => {
    logOperation('updateContent', blockIndex, newContent);
    const blocks = parseCHDBlocks(markdown);
    const block = blocks[blockIndex];
    if (!block) return;

    const lines = markdown.split('\n');
    
    // Replace content lines
    // block.startLine is title. content starts at startLine + 1
    // block.endLine is the last line of content
    
    const before = lines.slice(0, block.startLine + 1);
    const after = lines.slice(block.endLine + 1);
    
    // newContent might have multiple lines
    const newLines = newContent.split('\n');
    
    const result = [...before, ...newLines, ...after];
    handleUpdate(result.join('\n'));
  }, [markdown, handleUpdate, logOperation]);

  const moveCard = useCallback((blockIndex: number, direction: 'left' | 'right' | 'up' | 'down') => {
      logOperation('moveCard', blockIndex, direction);
      // Simplified: Swap with prev/next card in the same section
      // We need to identify siblings.
      const blocks = parseCHDBlocks(markdown);
      const block = blocks[blockIndex];
      if (!block || block.type !== 'card') return;

      // Find siblings in the same section
      // Sections start with ##
      // We can iterate blocks to find the section this card belongs to
      let sectionIndex = -1;
      let cardIndicesInThisSection: number[] = [];
      
      // Re-scan for siblings
      // Find the enclosing section range
      let sectionStartLine = -1;
      let sectionEndLine = Infinity;
      
      // Find section header before
      for (let i = blockIndex - 1; i >= 0; i--) {
          if (blocks[i].type === 'section') {
              sectionStartLine = blocks[i].startLine;
              break;
          }
      }
      
      // Find section header after
      for (let i = blockIndex + 1; i < blocks.length; i++) {
          if (blocks[i].type === 'section') {
              sectionEndLine = blocks[i].startLine;
              break;
          }
      }
      
      // Now gather all cards strictly between sectionStartLine and sectionEndLine
      cardIndicesInThisSection = blocks
          .map((b, idx) => ({ b, idx }))
          .filter(({ b }) => b.type === 'card' && b.startLine > sectionStartLine && b.startLine < sectionEndLine)
          .map(({ idx }) => idx);

      const currentPos = cardIndicesInThisSection.indexOf(blockIndex);
      if (currentPos === -1) return;

      let targetPos = -1;
      if (direction === 'left' || direction === 'up') {
          targetPos = currentPos - 1;
      } else {
          targetPos = currentPos + 1;
      }

      if (targetPos < 0 || targetPos >= cardIndicesInThisSection.length) return;

      const targetBlockIndex = cardIndicesInThisSection[targetPos];
      const targetBlock = blocks[targetBlockIndex];

      // Perform Swap
      const lines = markdown.split('\n');
      
      const firstIndex = Math.min(blockIndex, targetBlockIndex);
      const secondIndex = Math.max(blockIndex, targetBlockIndex);
      
      const firstBlock = blocks[firstIndex];
      const secondBlock = blocks[secondIndex];
      
      const chunk1 = lines.slice(firstBlock.startLine, firstBlock.endLine + 1);
      const chunk2 = lines.slice(secondBlock.startLine, secondBlock.endLine + 1);
      
      const middle = lines.slice(firstBlock.endLine + 1, secondBlock.startLine);
      
      const before = lines.slice(0, firstBlock.startLine);
      const after = lines.slice(secondBlock.endLine + 1);
      
      const newLines = [...before, ...chunk2, ...middle, ...chunk1, ...after];
      
      handleUpdate(newLines.join('\n'));

  }, [markdown, handleUpdate, logOperation]);

  const deleteCard = useCallback((blockIndex: number) => {
      logOperation('deleteCard', blockIndex);
      const blocks = parseCHDBlocks(markdown);
      const block = blocks[blockIndex];
      if (!block) return;

      const lines = markdown.split('\n');
      // Remove lines from startLine to endLine
      // Also maybe remove the preceding empty line if it exists to keep it clean?
      // For now, just remove the block lines.
      
      const before = lines.slice(0, block.startLine);
      const after = lines.slice(block.endLine + 1);
      
      handleUpdate([...before, ...after].join('\n'));
  }, [markdown, handleUpdate, logOperation]);

  const addCard = useCallback((sectionBlockIndex: number) => {
      logOperation('addCard', sectionBlockIndex);
      const blocks = parseCHDBlocks(markdown);
      const lines = markdown.split('\n');
      
      // If sectionBlockIndex is -1, we append to the end of the file or first implicit section
      // If valid index, we append at the end of that section
      
      let insertLine = lines.length;

      if (sectionBlockIndex >= 0 && sectionBlockIndex < blocks.length) {
          const sectionBlock = blocks[sectionBlockIndex];
          // Find the next section to define the boundary
          let nextSectionStart = lines.length;
          for (let i = sectionBlockIndex + 1; i < blocks.length; i++) {
              if (blocks[i].type === 'section') {
                  nextSectionStart = blocks[i].startLine;
                  break;
              }
          }
          insertLine = nextSectionStart;
      } else {
           // Implicit first section (Overview) or no sections
           // Find the first explicit section
           let firstSectionStart = lines.length;
           for (let i = 0; i < blocks.length; i++) {
               if (blocks[i].type === 'section') {
                   firstSectionStart = blocks[i].startLine;
                   break;
               }
           }
           insertLine = firstSectionStart;
      }

      // Check if we need to add a newline before
      const newCardTemplate = [
          "",
          "### New Card {col-span=1}",
          "Enter content here..."
      ];
      
      const before = lines.slice(0, insertLine);
      const after = lines.slice(insertLine);
      
      handleUpdate([...before, ...newCardTemplate, ...after].join('\n'));
  }, [markdown, handleUpdate, logOperation]);

  return { updateAttribute, batchUpdateAttributes, updateContent, updateTitle, updateFrontmatter, moveCard, deleteCard, addCard, undo, canUndo, operationLog };
}
