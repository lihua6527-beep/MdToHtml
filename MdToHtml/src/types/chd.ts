
import { CardShape } from '@/lib/shapes';

export type CardStyle = 'normal' | 'highlight' | 'quote' | 'code';

export interface CHDSectionProps {
  layout: string;
  color: string;
  columns: number;
  titleSpacing: string;
  showDivider: boolean;
  blockIndex: number;
  titleAlign?: 'left' | 'center' | 'right'; // Added for new prop
}

export interface CHDCardProps {
  shape: CardShape;
  style: CardStyle;
  badge: string;
  blockIndex: number;
}

export interface CHDSelectionState {
  activeSectionProps: CHDSectionProps;
  activeCardProps: CHDCardProps;
  selectedSectionTitle: string;
  parentSectionIndex: number;
  selectedBlockIndex: number | null;
}
