import { useState, useCallback } from 'react';

interface UseEditorDragDropProps {
  setContent: (content: string) => void;
  setFilePath: (update: (prev: string) => string) => void;
  setStatus: (status: string) => void;
}

export const useEditorDragDrop = ({ setContent, setFilePath, setStatus }: UseEditorDragDropProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    
    const validExtensions = ['.md', '.txt', '.markdown'];
    const isMarkdown = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isMarkdown && file.type !== 'text/plain' && file.type !== 'text/markdown') {
      setStatus('Error: Only Markdown/Text files allowed');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    try {
      const text = await file.text();
      if (text.includes('\0')) {
        throw new Error("Binary file detected");
      }
      
      setContent(text);
      setFilePath((prev: string) => {
         const dir = prev.includes('/') ? prev.substring(0, prev.lastIndexOf('/') + 1) : '';
         return dir + file.name;
      });
      setStatus(`Loaded: ${file.name}`);
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      console.error(err);
      setStatus('Error reading file');
    }
  }, [setContent, setFilePath, setStatus]);

  return {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};
