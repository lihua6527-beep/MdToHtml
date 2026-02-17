export type ThemeId = 'ocean' | 'mint' | 'lavender' | 'earth' | 'caramel';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  color: string;
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: '现代商务 | 皇家蓝',
    color: '#2C6CFF',
  },
  {
    id: 'mint',
    name: 'Mint Fresh',
    description: '清新自然 | 薄荷绿',
    color: '#6BD0CC',
  },
  {
    id: 'lavender',
    name: 'Lavender Dream',
    description: '优雅梦幻 | 紫罗兰',
    color: '#6C53B3',
  },
  {
    id: 'earth',
    name: 'Earth Organic',
    description: '温暖有机 | 翡翠绿',
    color: '#41C187',
  },
  {
    id: 'caramel',
    name: 'Caramel Vintage',
    description: '复古优雅 | 焦糖棕',
    color: '#855D36',
  },
];

export const DEFAULT_THEME = 'ocean';
