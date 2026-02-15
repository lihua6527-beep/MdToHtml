// Mock ReactMarkdown and plugins to avoid ESM issues
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="markdown-content">{children}</div>,
}));
jest.mock('remark-gfm', () => ({}));
jest.mock('remark-math', () => ({}));
jest.mock('remark-breaks', () => ({}));
jest.mock('rehype-katex', () => ({}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '../Card';

describe('Card Component', () => {
  const defaultProps = {
    title: 'Test Card',
    content: 'Test Content',
    attributes: {},
    colSpan: 1,
    rowSpan: 1,
  };

  it('renders title and content', () => {
    render(<Card {...defaultProps} />);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('Test Content');
  });

  it('applies default style (white background)', () => {
    const { container } = render(<Card {...defaultProps} />);
    // Check for base classes or default style classes
    // normal: "bg-white shadow-sm border border-border-soft ..."
    const cardDiv = container.firstChild;
    expect(cardDiv).toHaveClass('bg-white');
  });

  it('ignores card-color attribute and stays white', () => {
    const { container } = render(<Card {...defaultProps} attributes={{ 'card-color': 'chart-1' }} />);
    
    const cardDiv = container.firstChild as HTMLElement;

    // 1. Should still be white
    expect(cardDiv).toHaveClass('bg-white');
    
    // 2. Should NOT have chart color border
    expect(cardDiv).not.toHaveClass('border-chart-1');

    // 3. Should NOT have overlay div
    // The content wrapper is usually the first child if no overlay exists
    // But let's check children count or class
    // In our new implementation, the overlay div is conditionally rendered: {cardColor !== 'default' && ...}
    // Since cardColor is forced to 'default', the overlay should not be there.
    
    // The first child should be the content wrapper "relative z-10..."
    const firstChild = cardDiv.children[0];
    expect(firstChild).toHaveClass('relative');
    expect(firstChild).toHaveClass('z-10');
    expect(firstChild).not.toHaveClass('absolute'); // Overlay is absolute
  });
  
  /* Removed per user request: Color picker UI is gone
  it('displays Chinese color labels in edit mode', () => {
    ...
  });
  */
});
