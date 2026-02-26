export type CardShape = 'rect' | 'round' | 'pill' | 'leaf' | 'diamond' | 'hexagon' | 'ticket' | 'message' | 'cut' | 'arrow' | 'circle' | 'floating';

export const SHAPE_CLASSES: Record<CardShape, string> = {
  rect: '',
  round: 'shape-round',
  pill: 'shape-pill',
  leaf: 'shape-leaf',
  diamond: 'shape-diamond',
  hexagon: 'shape-hexagon',
  ticket: 'rounded-[10px]', // Use utility class directly
  message: 'shape-message',
  cut: 'shape-cut',
  arrow: 'shape-arrow',
  circle: 'shape-circle',
  floating: '',
};

export const getShapeClass = (shape: string): string => {
  const s = shape as CardShape;
  return SHAPE_CLASSES[s] || '';
};

export const getShapeStyle = (shape: string): React.CSSProperties => {
  // Deprecated: We now use CSS classes for better performance and customization
  return {};
};
