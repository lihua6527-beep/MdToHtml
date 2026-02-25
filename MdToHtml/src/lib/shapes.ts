export type CardShape = 'rect' | 'round' | 'pill' | 'leaf' | 'diamond' | 'hexagon' | 'ticket' | 'message' | 'cut' | 'arrow' | 'circle' | 'floating';

export const SHAPE_PATHS: Record<CardShape, string> = {
  rect: '', // Default (uses border-radius)
  round: 'circle(50% at 50% 50%)',
  pill: 'inset(0% 0% 0% 0% round 9999px)', // Fully rounded ends
  // Leaf: Top-Left and Bottom-Right rounded (50% radius), others sharp
  leaf: 'inset(0% 0% 0% 0% round 50% 0% 50% 0%)', 
  diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  ticket: 'inset(0% 0% 0% 0% round 10px)', // Simple rounded for now
  message: 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)',
  
  // New Shapes
  cut: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0% 100%, 0% 20px)', // Cyberpunk double cut
  arrow: 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%, 15% 50%)', // Chevron Arrow
  circle: 'circle(50% at 50% 50%)', // Same as round
  floating: '', // Uses absolute positioning, no clip-path on wrapper usually
};

export const getShapeStyle = (shape: string): React.CSSProperties => {
  const s = shape as CardShape;
  if (!s || s === 'rect') return {};
  
  if (SHAPE_PATHS[s]) {
     return { clipPath: SHAPE_PATHS[s] };
  }
  return {};
};
