import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DocumentItem from '../DocumentItem';

const mockPost = {
  slug: 'test-document',
  status: 'incomplete',
  mtime: Date.now(),
  birthtime: Date.now() - 3600000,
  isFavorited: false,
  isPinned: false,
  tags: [],
  title: '',
  excerpt: ''
};

describe('DocumentItem', () => {
  const defaultProps = {
    post: mockPost,
    isSelected: false,
    isSelectionMode: false,
    sortMethod: 'modified',
    onToggleSelection: jest.fn(),
    onDragStart: jest.fn(),
    onContextMenu: jest.fn()
  };
  
  test('renders document item with slug', () => {
    render(<DocumentItem {...defaultProps} />);
    expect(screen.getByText('test-document')).toBeInTheDocument();
  });
  
  test('renders in selection mode', () => {
    render(
      <DocumentItem 
        {...defaultProps} 
        isSelectionMode={true}
      />
    );
    
    expect(screen.getByText('test-document')).toBeInTheDocument();
  });
  
  test('renders selected state', () => {
    render(
      <DocumentItem 
        {...defaultProps} 
        isSelectionMode={true}
        isSelected={true}
      />
    );
    
    expect(screen.getByText('test-document')).toBeInTheDocument();
  });
  
  test('handles selection toggle', () => {
    const onToggleSelection = jest.fn();
    render(
      <DocumentItem 
        {...defaultProps} 
        isSelectionMode={true}
        onToggleSelection={onToggleSelection}
      />
    );
    
    fireEvent.click(screen.getByText('test-document').closest('div')!);
    expect(onToggleSelection).toHaveBeenCalledWith('test-document');
  });
  
  test('handles drag start', () => {
    const onDragStart = jest.fn();
    const { container } = render(
      <DocumentItem 
        {...defaultProps} 
        onDragStart={onDragStart}
      />
    );
    
    const item = container.firstChild as HTMLElement;
    fireEvent.dragStart(item);
    expect(onDragStart).toHaveBeenCalled();
  });
  
  test('handles context menu', () => {
    const onContextMenu = jest.fn();
    const { container } = render(
      <DocumentItem 
        {...defaultProps} 
        onContextMenu={onContextMenu}
      />
    );
    
    const item = container.firstChild as HTMLElement;
    fireEvent.contextMenu(item);
    expect(onContextMenu).toHaveBeenCalled();
  });
  
  test('renders favorited and pinned indicators', () => {
    render(
      <DocumentItem 
        {...defaultProps} 
        post={{ 
          ...mockPost, 
          isFavorited: true, 
          isPinned: true 
        }}
      />
    );
    
    expect(screen.getByTitle('已收藏')).toBeInTheDocument();
    expect(screen.getByTitle('已置顶')).toBeInTheDocument();
  });
  
  test('renders date with modified sort', () => {
    render(<DocumentItem {...defaultProps} />);
    
    // Date should be displayed (format depends on locale)
    const dateElement = screen.getByText(new Date(mockPost.mtime).toLocaleDateString());
    expect(dateElement).toBeInTheDocument();
  });
});
