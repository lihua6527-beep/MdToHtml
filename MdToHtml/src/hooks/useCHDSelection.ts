
import { useState, useEffect } from 'react';
import { parseCHDBlocks } from '@/lib/chdParser';
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
      const currentBlock = blocks.find(b => activeLine >= b.startLine && activeLine <= b.endLine);
      
      if (!currentBlock) {
        // In gap - preserve current selection
        return;
      }
      
      const blockIndex = blocks.indexOf(currentBlock);
      
      if (currentBlock.type === 'section') {
        // Section Selected
        const lines = content.split('\n');
        const titleLine = lines[currentBlock.startLine];
        const { props, cleanText } = parseAttributes(titleLine.replace(/^#+\s+/, ''));
        
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
          selectedSectionTitle: sectionTitleToUse,
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
