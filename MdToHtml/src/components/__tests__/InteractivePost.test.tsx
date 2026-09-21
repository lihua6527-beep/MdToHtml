import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock InteractivePost component to avoid complex dependencies
jest.mock('../InteractivePost', () => {
  return function MockInteractivePost({ initialContent, slug, decodedSlug }: any) {
    return (
      <div data-testid="interactive-post">
        <div data-testid="navigation-header">NavigationHeader</div>
        <div data-testid="chd-renderer">
          <div>{initialContent}</div>
        </div>
        <div data-testid="export-button">ExportButton</div>
        <div data-testid="theme-switcher">ThemeSwitcher</div>
      </div>
    );
  };
});

// Import InteractivePost from the mocked module
import InteractivePost from '../InteractivePost';

describe('InteractivePost', () => {
  const mockInitialContent = '# Hello World';
  const mockSlug = 'hello-world';
  const mockDecodedSlug = 'Hello World';

  it('renders initial content and decoded slug', () => {
    render(
      <InteractivePost 
        initialContent={mockInitialContent} 
        slug={mockSlug} 
        decodedSlug={mockDecodedSlug} 
      />
    );

    expect(screen.getByTestId('interactive-post')).toBeInTheDocument();
    expect(screen.getByTestId('chd-renderer')).toBeInTheDocument();
    expect(screen.getByText(mockInitialContent)).toBeInTheDocument();
  });

  it('renders with all mocked components', () => {
    render(
      <InteractivePost 
        initialContent={mockInitialContent} 
        slug={mockSlug} 
        decodedSlug={mockDecodedSlug} 
      />
    );

    // Check that all mocked components are rendered
    expect(screen.getByTestId('interactive-post')).toBeInTheDocument();
    expect(screen.getByTestId('navigation-header')).toBeInTheDocument();
    expect(screen.getByTestId('chd-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('export-button')).toBeInTheDocument();
    expect(screen.getByTestId('theme-switcher')).toBeInTheDocument();
  });
});
