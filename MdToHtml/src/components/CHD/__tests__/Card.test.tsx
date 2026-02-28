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

  it('applies card-color attribute', () => {
    const { container } = render(<Card {...defaultProps} attributes={{ 'card-color': 'chart-1' }} />);
    
    const cardDiv = container.firstChild as HTMLElement;

    // Should have chart color class (bg-chart-1/10 and border-chart-1/20 based on implementation)
    expect(cardDiv).toHaveClass('bg-chart-1/10');
    expect(cardDiv).toHaveClass('border-chart-1/20');
  });
  
  /* Removed per user request: Color picker UI is gone
  it('displays Chinese color labels in edit mode', () => {
    ...
  });
  */
});
