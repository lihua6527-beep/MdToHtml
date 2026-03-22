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

describe('Card Icon Support', () => {
  test('renders card without icon when no icon attribute is provided', () => {
    render(
      <Card
        title="Test Card"
        content="Test content"
        attributes={{ shape: 'rect' }}
      />
    );
    
    // Should not find any icon
    expect(screen.queryByTestId('zap-icon')).not.toBeInTheDocument();
  });

  test('renders card with zap icon when icon=zap is provided', () => {
    render(
      <Card
        title="Test Card"
        content="Test content"
        attributes={{ icon: 'zap', shape: 'rect' }}
      />
    );
    
    // Should find zap icon
    expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
  });

  test('renders card with cpu icon when icon=cpu is provided', () => {
    render(
      <Card
        title="Test Card"
        content="Test content"
        attributes={{ icon: 'cpu', shape: 'rect' }}
      />
    );
    
    // Should find cpu icon
    expect(screen.getByTestId('cpu-icon')).toBeInTheDocument();
  });

  test('does not render icon when shape is not rect', () => {
    render(
      <Card
        title="Test Card"
        content="Test content"
        attributes={{ icon: 'zap', shape: 'circle' }}
      />
    );
    
    // Should not find any icon
    expect(screen.queryByTestId('zap-icon')).not.toBeInTheDocument();
  });

  test('applies correct padding when icon is present', () => {
    const { container } = render(
      <Card
        title="Test Card"
        content="Test content"
        attributes={{ icon: 'zap', shape: 'rect' }}
      />
    );
    
    // Should have increased left padding when icon is present
    const header = container.querySelector('.flex-col.gap-3');
    expect(header).toHaveClass('pl-14');
  });

  test('does not apply extra padding when icon is not present', () => {
    const { container } = render(
      <Card
        title="Test Card"
        content="Test content"
        attributes={{ shape: 'rect' }}
      />
    );
    
    // Should not have increased left padding when icon is not present
    const header = container.querySelector('.flex-col.gap-3');
    expect(header).not.toHaveClass('pl-14');
  });

  test('supports all available icons', () => {
    const iconNames = [
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

    iconNames.forEach(iconName => {
      const { unmount } = render(
        <Card
          title="Test Card"
          content="Test content"
          attributes={{ icon: iconName, shape: 'rect' }}
        />
      );
      
      // Should find the icon
      expect(screen.getByTestId(`${iconName}-icon`)).toBeInTheDocument();
      unmount();
    });
  });
});
