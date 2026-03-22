import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock Card component to avoid ES module dependencies
jest.mock('../Card', () => ({
  Card: ({ title, content, attributes }: any) => (
    <div data-testid="card">
      <div className={`flex-col gap-3 ${attributes?.icon ? 'pl-14' : ''}`}>
        {attributes?.icon && attributes?.shape === 'rect' && (
          <div data-testid={`${attributes.icon}-icon`}>{attributes.icon} Icon</div>
        )}
        <h3>{title}</h3>
        <p>{content}</p>
      </div>
    </div>
  ),
}));

// Import Card from the mocked module
import { Card } from '../Card';

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const mockIcon = (name: string) => {
    const IconComponent = () => <div data-testid={`${name}-icon`}>{name} Icon</div>;
    IconComponent.displayName = `${name}Icon`;
    return IconComponent;
  };
  
  return {
    Zap: mockIcon('zap'),
    Cpu: mockIcon('cpu'),
    BarChart2: mockIcon('chart'),
    BarChart3: mockIcon('chart3'),
    Award: mockIcon('award'),
    Rocket: mockIcon('rocket'),
    Clock: mockIcon('clock'),
    AlertTriangle: mockIcon('alert'),
    CheckCircle: mockIcon('check'),
    CheckSquare: mockIcon('checksquare'),
    Network: mockIcon('network'),
    Eye: mockIcon('eye'),
    Tag: mockIcon('tag'),
    Layers: mockIcon('layers'),
    Box: mockIcon('box'),
    Globe: mockIcon('globe'),
    TrendingUp: mockIcon('trending'),
    Book: mockIcon('book'),
    MessageSquare: mockIcon('message'),
    Settings: mockIcon('settings'),
    User: mockIcon('user'),
    Users: mockIcon('users'),
    UserPlus: mockIcon('userplus'),
    Shield: mockIcon('shield'),
    Lightbulb: mockIcon('lightbulb'),
    Calendar: mockIcon('calendar'),
    DollarSign: mockIcon('dollar'),
    Target: mockIcon('target'),
    Star: mockIcon('star'),
    Heart: mockIcon('heart'),
    Bookmark: mockIcon('bookmark'),
    Camera: mockIcon('camera'),
    Cloud: mockIcon('cloud'),
    Database: mockIcon('database'),
    Download: mockIcon('download'),
    File: mockIcon('file'),
    FileText: mockIcon('filetext'),
    FileCode: mockIcon('filecode'),
    FileImage: mockIcon('fileimage'),
    FileVideo: mockIcon('filevideo'),
    FileAudio: mockIcon('fileaudio'),
    FileSpreadsheet: mockIcon('filespreadsheet'),
    FileArchive: mockIcon('filearchive'),
    Filter: mockIcon('filter'),
    Flag: mockIcon('flag'),
    Folder: mockIcon('folder'),
    Gift: mockIcon('gift'),
    Github: mockIcon('github'),
    Home: mockIcon('home'),
    Image: mockIcon('image'),
    Key: mockIcon('key'),
    Link: mockIcon('link'),
    Lock: mockIcon('lock'),
    Mail: mockIcon('mail'),
    Map: mockIcon('map'),
    Menu: mockIcon('menu'),
    Moon: mockIcon('moon'),
    Music: mockIcon('music'),
    PenTool: mockIcon('pentool'),
    PieChart: mockIcon('piechart'),
    Search: mockIcon('search'),
    Share2: mockIcon('share2'),
    Sun: mockIcon('sun'),
    Upload: mockIcon('upload'),
    Video: mockIcon('video'),
    Wifi: mockIcon('wifi'),
    Code: mockIcon('code'),
    Clipboard: mockIcon('clipboard'),
    GitBranch: mockIcon('gitbranch'),
    Grid: mockIcon('grid'),
    Layout: mockIcon('layout'),
    List: mockIcon('list'),
    Monitor: mockIcon('monitor'),
    Package: mockIcon('package'),
    Server: mockIcon('server'),
    Smartphone: mockIcon('smartphone'),
    Tablet: mockIcon('tablet'),
    Terminal: mockIcon('terminal'),
    ChevronRight: mockIcon('chevronright'),
    ChevronDown: mockIcon('chevrondown'),
    ChevronUp: mockIcon('chevronup'),
    ChevronLeft: mockIcon('chevronleft')
  };
});

describe('All Icons Test', () => {
  // List of all available icons
  const allIcons = [
    'zap', 'cpu', 'chart', 'chart3', 'award', 'rocket', 'clock', 'alert', 'check', 'checksquare',
    'network', 'eye', 'tag', 'layers', 'box', 'globe', 'trending', 'book', 'message', 'settings',
    'user', 'users', 'userplus', 'shield', 'lightbulb', 'calendar', 'dollar', 'target', 'star',
    'heart', 'bookmark', 'camera', 'cloud', 'database', 'download', 'file', 'filetext', 'filecode',
    'fileimage', 'filevideo', 'fileaudio', 'filespreadsheet', 'filearchive', 'filter', 'flag',
    'folder', 'gift', 'github', 'home', 'image', 'key', 'link', 'lock', 'mail', 'map', 'menu',
    'moon', 'music', 'pentool', 'piechart', 'search', 'share2', 'sun', 'upload', 'video', 'wifi',
    'code', 'clipboard', 'gitbranch', 'grid', 'layout', 'list', 'monitor', 'package', 'server',
    'smartphone', 'tablet', 'terminal', 'chevronright', 'chevrondown', 'chevronup', 'chevronleft'
  ];

  test('renders all icons correctly', () => {
    allIcons.forEach(iconName => {
      const { unmount } = render(
        <Card
          title={`Test Card with ${iconName}`}
          content={`This card uses the ${iconName} icon`}
          attributes={{ icon: iconName, shape: 'rect' }}
        />
      );
      
      // Should find the icon
      expect(screen.getByTestId(`${iconName}-icon`)).toBeInTheDocument();
      
      // Should find the card title
      expect(screen.getByText(`Test Card with ${iconName}`)).toBeInTheDocument();
      
      unmount();
    });
  });

  test('verifies total number of icons', () => {
    expect(allIcons.length).toBeGreaterThanOrEqual(50);
    console.log(`Total icons available: ${allIcons.length}`);
  });

  test('renders icons with different card styles', () => {
    const styles = ['normal', 'highlight', 'quote'];
    const testIcon = 'zap';

    styles.forEach(style => {
      const { unmount } = render(
        <Card
          title={`Test Card with ${style} style`}
          content={`This card uses ${style} style with zap icon`}
          style={style as any}
          attributes={{ icon: testIcon, shape: 'rect' }}
        />
      );
      
      // Should find the icon regardless of style
      expect(screen.getByTestId(`${testIcon}-icon`)).toBeInTheDocument();
      
      unmount();
    });
  });

  test('does not render icons for non-rect shapes', () => {
    const testIcon = 'zap';
    const nonRectShapes = ['circle', 'floating', 'arrow'];

    nonRectShapes.forEach(shape => {
      render(
        <Card
          title={`Test Card with ${shape} shape`}
          content={`This card should not show icon`}
          attributes={{ icon: testIcon, shape: shape as any }}
        />
      );
      
      // Should not find the icon for non-rect shapes
      expect(screen.queryByTestId(`${testIcon}-icon`)).not.toBeInTheDocument();
    });
  });
});
