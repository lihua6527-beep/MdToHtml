
import { useState, useEffect } from 'react';
import { parseCHDBlocks, CHDBlock } from '@/lib/chdParser';
import { parseAttributes } from '@/lib/attributeParser';
import { CHDSectionProps, CHDCardProps, CHDSelectionState, CardStyle } from '@/types/chd';
import { CardShape } from '@/lib/shapes';

const DEFAULT_SECTION_PROPS: CHDSectionProps = {
  layout: 'grid',
  color: 'default',
  columns: 2,
  titleSpacing: '2',
  showDivider: false,
  blockIndex: -1,
  titleAlign: 'left'
};

const DEFAULT_CARD_PROPS: CHDCardProps = {
  shape: 'rect',
  style: 'normal',
  badge: '',
  blockIndex: -1
};

const DEFAULT_SELECTION_STATE: CHDSelectionState = {
  activeSectionProps: DEFAULT_SECTION_PROPS,
  activeCardProps: DEFAULT_CARD_PROPS,
  selectedSectionTitle: '',
  parentSectionIndex: -1,
  selectedBlockIndex: null
};

export function useCHDSelection(content: string, activeLine: number | null): CHDSelectionState {
  const [state, setState] = useState<CHDSelectionState>(DEFAULT_SELECTION_STATE);

  useEffect(() => {
    if (!content || activeLine === null) {
      setState(DEFAULT_SELECTION_STATE);
      return;
    }

    try {
      const blocks = parseCHDBlocks(content);
      console.log('[useCHDSelection] Blocks parsed:', blocks.length);
      blocks.forEach((block, idx) => {
        console.log('[useCHDSelection] Block', idx, ':', block.type, 'startLine:', block.startLine, 'endLine:', block.endLine, 'title:', block.title);
      });
      
      // 找到包含activeLine的block
      let currentBlock = blocks.find(b => activeLine >= b.startLine && activeLine <= b.endLine);
      
      // 如果没有找到，尝试找到最接近的section
      if (!currentBlock) {
        console.log('[useCHDSelection] No block found for activeLine:', activeLine);
        // 找到最后一个startLine小于等于activeLine的section
        const sections = blocks.filter(b => b.type === 'section');
        const closestSection = sections.reduce<CHDBlock | null>((prev, current) => {
          return (current.startLine <= activeLine && current.startLine > (prev?.startLine || -1)) ? current : prev;
        }, null);
        
        if (closestSection) {
          console.log('[useCHDSelection] Using closest section:', closestSection.title, 'startLine:', closestSection.startLine);
          currentBlock = closestSection;
        } else {
          // 没有找到任何section，保留当前选择
          return;
        }
      }
      
      const blockIndex = blocks.indexOf(currentBlock);
      console.log('[useCHDSelection] Active line:', activeLine, 'Block:', currentBlock.type, 'Block index:', blockIndex);
      
      if (currentBlock.type === 'section') {
        // Section Selected
        const lines = content.split('\n');
        const titleLine = lines[currentBlock.startLine];
        const { props, cleanText } = parseAttributes(titleLine.replace(/^#+\s+/, ''));
        
        console.log('[useCHDSelection] Section selected:', { blockIndex, title: cleanText, startLine: currentBlock.startLine });
        
        setState({
          activeSectionProps: {
            layout: props.layout || 'grid',
            color: props['section-color'] || 'default',
            columns: parseInt(props.columns || '2'),
            titleSpacing: props['title-spacing'] || '2',
            showDivider: props['show-divider'] === 'true',
            blockIndex,
            titleAlign: (props['title-align'] as 'left' | 'center' | 'right') || 'left'
          },
          activeCardProps: DEFAULT_CARD_PROPS,
          selectedSectionTitle: cleanText || '无标题分区',
          parentSectionIndex: -1,
          selectedBlockIndex: blockIndex
        });
      } else if (currentBlock.type === 'card' || currentBlock.type === 'code') {
        // Card Selected
        const lines = content.split('\n');
        const titleLine = lines[currentBlock.startLine];
        const { props } = parseAttributes(titleLine.replace(/^#+\s+/, ''));
        
        // Find Parent Section
        let parentSectionIndex = -1;
        for (let i = blockIndex - 1; i >= 0; i--) {
            if (blocks[i].type === 'section') {
                parentSectionIndex = i;
                break;
            }
        }

        let sectionPropsToUse = DEFAULT_SECTION_PROPS;
        let sectionTitleToUse = '';

        if (parentSectionIndex !== -1) {
            const parentBlock = blocks[parentSectionIndex];
            const pTitleLine = lines[parentBlock.startLine];
            const { props: sectionProps, cleanText } = parseAttributes(pTitleLine.replace(/^#+\s+/, ''));
            
            sectionPropsToUse = {
                layout: sectionProps.layout || 'grid',
                color: sectionProps['section-color'] || 'default',
                columns: parseInt(sectionProps.columns || '2'),
                titleSpacing: sectionProps['title-spacing'] || '2',
                showDivider: sectionProps['show-divider'] === 'true',
                blockIndex: parentSectionIndex,
                titleAlign: (sectionProps['title-align'] as 'left' | 'center' | 'right') || 'left'
            };
            sectionTitleToUse = cleanText || '无标题分区';
        }

        setState({
          activeSectionProps: sectionPropsToUse,
          activeCardProps: {
            shape: (props.shape as CardShape) || 'rect',
            style: (props['card-style'] as CardStyle) || 'normal',
            badge: props.badge || '',
            blockIndex
          },
          selectedSectionTitle: '',
          parentSectionIndex: parentSectionIndex,
          selectedBlockIndex: blockIndex
        });
      } else {
        setState(DEFAULT_SELECTION_STATE);
      }
    } catch (e) {
      console.warn('Selection parsing failed', e);
    }
  }, [content, activeLine]);

  return state;
}
