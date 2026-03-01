import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DocumentItem from '../DocumentItem';

const mockPost = {
  slug: 'test-document',
  type: 'project',
  status: 'incomplete',
  mtime: Date.now(),
  birthtime: Date.now() - 3600000
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
  
  test('renders document item', () => {
    render(<DocumentItem {...defaultProps} />);
    
    expect(screen.getByText('test-document')).toBeInTheDocument();
    expect(screen.getByText('项目')).toBeInTheDocument();
  });
  
  test('renders document type label', () => {
    render(<DocumentItem {...defaultProps} />);
    
    expect(screen.getByText('项目')).toBeInTheDocument();
  });
  
  test('renders status icon for incomplete', () => {
    render(<DocumentItem {...defaultProps} />);
    
    expect(screen.getByTitle('未完成')).toBeInTheDocument();
  });
  
  test('renders status icon for completed', () => {
    render(
      <DocumentItem 
        {...defaultProps} 
        post={{ ...mockPost, status: 'completed' }}
      />
    );
    
    expect(screen.getByTitle('已完成')).toBeInTheDocument();
  });
  
  test('renders status icon for modified', () => {
    render(
      <DocumentItem 
        {...defaultProps} 
        post={{ ...mockPost, status: 'modified' }}
      />
    );
    
    expect(screen.getByTitle('已修改')).toBeInTheDocument();
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
  
  test('renders different document types', () => {
    const types = ['project', 'paper', 'knowledge', 'other'];
    const labels = ['项目', '论文', '知识', '其他'];
    
    types.forEach((type, index) => {
      const { container, unmount } = render(
        <DocumentItem 
          {...defaultProps} 
          post={{ ...mockPost, type }}
        />
      );
      
      expect(screen.getByText(labels[index])).toBeInTheDocument();
      unmount();
    });
  });
});
