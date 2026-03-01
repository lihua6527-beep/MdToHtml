import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NavigationHeader from '../NavigationHeader';

// Mock TextEncoder for test environment
global.TextEncoder = class {
  encode(input: string) {
    return new Uint8Array(Buffer.from(input));
  }
};

// Mock Blob for test environment
global.Blob = class {
  constructor(parts: any[], options: any) {
    this.parts = parts;
    this.options = options;
  }
  parts: any[];
  options: any;
};

const mockScoreResult = {
  totalScore: 95,
  dimensions: {
    structure: 90,
    atomicity: 100,
    metadata: 95,
    syntax: 100,
    styling: 90
  },
  issues: []
};

describe('NavigationHeader', () => {
  const defaultProps = {
    decodedSlug: 'test-document',
    theme: 'light',
    documentType: 'project',
    showTypeDropdown: false,
    setShowTypeDropdown: jest.fn(),
    handleTypeChange: jest.fn(),
    docStatus: 'incomplete',
    isStatusUpdating: false,
    handleStatusChange: jest.fn(),
    scoreResult: mockScoreResult,
    showScoreDetails: false,
    setShowScoreDetails: jest.fn(),
    isEditing: false,
    setIsEditing: jest.fn(),
    isSaving: false,
    saveSuccess: false,
    handleSave: jest.fn(),
    content: '# Test',
    isExporting: false,
    setIsExporting: jest.fn(),
    handleBack: jest.fn(),
    isSavingRef: { current: false }
  };
  
  test('renders navigation header', () => {
    render(<NavigationHeader {...defaultProps} />);
    
    expect(screen.getByText('test-document')).toBeInTheDocument();
    expect(screen.getByText('项目')).toBeInTheDocument();
  });
  
  test('renders back button', () => {
    render(<NavigationHeader {...defaultProps} />);
    
    const backButton = screen.getByTitle('Go back');
    expect(backButton).toBeInTheDocument();
  });
  
  test('renders score indicator', () => {
    render(<NavigationHeader {...defaultProps} />);
    
    expect(screen.getByText('95分')).toBeInTheDocument();
  });
  
  test('renders status buttons', () => {
    render(<NavigationHeader {...defaultProps} />);
    
    expect(screen.getByText('未完成')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });
  
  test('renders export button', () => {
    render(<NavigationHeader {...defaultProps} />);
    
    expect(screen.getByText('导出 HTML')).toBeInTheDocument();
  });
  
  test('renders edit button when not editing', () => {
    render(<NavigationHeader {...defaultProps} />);
    
    expect(screen.getByText('编辑页面')).toBeInTheDocument();
  });
  
  test('renders save and cancel buttons when editing', () => {
    render(<NavigationHeader {...defaultProps} isEditing={true} />);
    
    expect(screen.getByText('取消/预览')).toBeInTheDocument();
    expect(screen.getByText('保存修改')).toBeInTheDocument();
  });
  
  test('renders save success state', () => {
    render(<NavigationHeader {...defaultProps} isEditing={true} saveSuccess={true} />);
    
    expect(screen.getByText('已保存')).toBeInTheDocument();
  });
  
  test('renders saving state', () => {
    render(<NavigationHeader {...defaultProps} isEditing={true} isSaving={true} />);
    
    expect(screen.getByText('保存中...')).toBeInTheDocument();
  });
  
  test('handles document type dropdown toggle', () => {
    const setShowTypeDropdown = jest.fn();
    render(
      <NavigationHeader 
        {...defaultProps} 
        setShowTypeDropdown={setShowTypeDropdown}
      />
    );
    
    fireEvent.click(screen.getByText('项目'));
    expect(setShowTypeDropdown).toHaveBeenCalledWith(true);
  });
  
  test('handles status change', () => {
    const handleStatusChange = jest.fn();
    render(
      <NavigationHeader 
        {...defaultProps} 
        handleStatusChange={handleStatusChange}
      />
    );
    
    fireEvent.click(screen.getByText('已完成'));
    expect(handleStatusChange).toHaveBeenCalledWith('completed');
  });
  
  test('handles back button click', () => {
    const handleBack = jest.fn();
    render(
      <NavigationHeader 
        {...defaultProps} 
        handleBack={handleBack}
      />
    );
    
    const backButton = screen.getByTitle('Go back');
    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalled();
  });
  
  test('handles edit toggle', () => {
    const setIsEditing = jest.fn();
    render(
      <NavigationHeader 
        {...defaultProps} 
        setIsEditing={setIsEditing}
      />
    );
    
    fireEvent.click(screen.getByText('编辑页面'));
    expect(setIsEditing).toHaveBeenCalledWith(true);
  });
  
  test('handles save', () => {
    const handleSave = jest.fn();
    render(
      <NavigationHeader 
        {...defaultProps} 
        isEditing={true}
        handleSave={handleSave}
      />
    );
    
    fireEvent.click(screen.getByText('保存修改'));
    expect(handleSave).toHaveBeenCalled();
  });
});
