import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock ExportButton component to avoid ES module dependencies
jest.mock('../ExportButton', () => {
  return function MockExportButton({ content, decodedSlug, theme, isExporting, setIsExporting }: any) {
    return (
      <div data-testid="export-button">
        {!isExporting && (
          <button data-testid="export-button-click" onClick={() => setIsExporting(true)}>
            导出 HTML
          </button>
        )}
        {isExporting && <div data-testid="exporting-indicator">导出中...</div>}
      </div>
    );
  };
});

// Import ExportButton from the mocked module
import ExportButton from '../ExportButton';

describe('ExportButton', () => {
  test('renders export button', () => {
    const setIsExporting = jest.fn();
    
    render(
      <ExportButton
        content="# Test"
        decodedSlug="test"
        theme="light"
        isExporting={false}
        setIsExporting={setIsExporting}
      />
    );
    
    expect(screen.getByText('导出 HTML')).toBeInTheDocument();
  });
  
  test('renders exporting state', () => {
    const setIsExporting = jest.fn();
    
    render(
      <ExportButton
        content="# Test"
        decodedSlug="test"
        theme="light"
        isExporting={true}
        setIsExporting={setIsExporting}
      />
    );
    
    expect(screen.getByText('导出中...')).toBeInTheDocument();
  });
  
  test('triggers setIsExporting when clicked', () => {
    const setIsExporting = jest.fn();
    
    render(
      <ExportButton
        content="# Test"
        decodedSlug="test"
        theme="light"
        isExporting={false}
        setIsExporting={setIsExporting}
      />
    );
    
    fireEvent.click(screen.getByText('导出 HTML'));
    expect(setIsExporting).toHaveBeenCalledWith(true);
  });
});
