import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HtmlBundler } from '@/lib/export/HtmlBundler';
import { FileService } from '@/services/FileService';
import ExportButton from '../ExportButton';

// Mock dependencies
jest.mock('@/lib/export/HtmlBundler');
jest.mock('@/services/FileService');
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

const mockHtmlBundler = HtmlBundler as jest.Mocked<typeof HtmlBundler>;
const mockFileService = FileService as jest.Mocked<typeof FileService>;

describe('ExportButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock bundle method
    mockHtmlBundler.bundle = jest.fn().mockResolvedValue(
      new Blob(['<html></html>'], { type: 'text/html' })
    );
    
    // Mock saveExport method
    mockFileService.saveExport = jest.fn().mockResolvedValue(true);
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:http://example.com/test');
    
    // Mock document.createElement
    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn()
    };
    document.createElement = jest.fn().mockReturnValue(mockAnchor);
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    global.URL.revokeObjectURL = jest.fn();
  });
  
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
  
  test('is disabled when exporting', () => {
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
    
    const button = screen.getByText('导出中...').closest('button')!;
    expect(button).toBeDisabled();
  });
  
  test('handles export successfully', async () => {
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
    
    await waitFor(() => {
      expect(mockHtmlBundler.bundle).toHaveBeenCalledWith('# Test', 'test', 'light');
    });
    
    await waitFor(() => {
      expect(mockFileService.saveExport).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(setIsExporting).toHaveBeenCalledWith(false);
    });
  });
  
  test('handles export failure', async () => {
    const setIsExporting = jest.fn();
    mockHtmlBundler.bundle = jest.fn().mockRejectedValue(new Error('Export failed'));
    
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
    
    await waitFor(() => {
      expect(setIsExporting).toHaveBeenCalledWith(false);
    });
  });
  
  test('handles save export failure', async () => {
    const setIsExporting = jest.fn();
    mockFileService.saveExport = jest.fn().mockResolvedValue(false);
    
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
    
    await waitFor(() => {
      expect(setIsExporting).toHaveBeenCalledWith(false);
    });
  });
});
