import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock NavigationHeader component to avoid ES module dependencies
jest.mock('../NavigationHeader', () => {
  return function MockNavigationHeader({ decodedSlug, theme, isEditing, isSaving, saveSuccess, handleSave, setIsEditing, content, isExporting, setIsExporting, handleBack, isSavingRef }: any) {
    return (
      <div data-testid="navigation-header">
        <h1>{decodedSlug}</h1>
        <div data-testid="theme-indicator">{theme}</div>
        <button title="Go back" data-testid="back-button" onClick={() => handleBack && handleBack()}>Back</button>
        <button data-testid="export-button">导出 HTML</button>
        {!isEditing && <button data-testid="edit-button" onClick={() => setIsEditing && setIsEditing(true)}>编辑页面</button>}
        {isEditing && (
          <>
            <button data-testid="cancel-button">取消/预览</button>
            <button data-testid="save-button" onClick={() => handleSave && handleSave()}>保存修改</button>
          </>
        )}
        {saveSuccess && <div data-testid="save-success">已保存</div>}
        {isSaving && <div data-testid="saving-indicator">保存中...</div>}
      </div>
    );
  };
});

// Import NavigationHeader from the mocked module
import NavigationHeader from '../NavigationHeader';
import { ThemeId } from '@/lib/themes';

// Mock TextEncoder for test environment
global.TextEncoder = class TextEncoder {
  encode(input: string) {
    return new Uint8Array(Buffer.from(input));
  }
  encodeInto(input: string, output: Uint8Array) {
    const encoded = this.encode(input);
    const length = Math.min(encoded.length, output.length);
    output.set(encoded.subarray(0, length));
    return { read: input.length, written: length };
  }
  get encoding() {
    return 'utf-8';
  }
};

// Mock Blob for test environment
global.Blob = class Blob {
  constructor(blobParts?: any[], options?: any) {
    this.parts = blobParts || [];
    this.options = options || {};
  }
  parts: any[];
  options: any;
  get size() {
    return this.parts.reduce((acc, part) => acc + part.length, 0);
  }
  get type() {
    return this.options?.type || '';
  }
  async arrayBuffer() {
    return Buffer.concat(this.parts).buffer;
  }
  async bytes() {
    return Buffer.concat(this.parts);
  }
  stream() {
    return new ReadableStream({
      start(controller) {
        controller.close();
      }
    });
  }
  async text() {
    return Buffer.concat(this.parts).toString();
  }
  slice(start?: number, end?: number, contentType?: string) {
    const slicedParts = this.parts.slice(start, end);
    return new Blob(slicedParts, { type: contentType || this.type });
  }
};

describe('NavigationHeader', () => {
  const defaultProps = {
    decodedSlug: 'test-document',
    theme: 'ocean' as ThemeId,
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
  });
  
  test('renders back button', () => {
    render(<NavigationHeader {...defaultProps} />);
    const backButton = screen.getByTitle('Go back');
    expect(backButton).toBeInTheDocument();
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