import { useState, useCallback } from 'react';
import { FileService } from '@/services/FileService';

interface UseEditorIOProps {
  content: string;
  setContent: (content: string) => void;
  initialFilePath?: string;
}

export const useEditorIO = ({ content, setContent, initialFilePath = 'output/my-document.md' }: UseEditorIOProps) => {
  const [filePath, setFilePath] = useState(initialFilePath);
  const [status, setStatus] = useState<string>('');

  const handleSave = useCallback(async () => {
    setStatus('Saving...');
    try {
      // Extract filename from path if needed, but API expects slug
      // If filePath is a full path, we might need to adjust logic.
      // Assuming filePath is just the filename/slug for now based on usage context
      const success = await FileService.saveFile(filePath, content);
      
      if (success) {
        setStatus('Saved!');
        setTimeout(() => setStatus(''), 2000);
      } else {
        setStatus('Error saving');
      }
    } catch (e) {
      console.error(e);
      setStatus('Error');
    }
  }, [content, filePath]);

  const handleLoad = useCallback(async () => {
    setStatus('Loading...');
    try {
      const loadedContent = await FileService.loadFile(filePath);
      if (loadedContent !== null) {
        setContent(loadedContent);
        setStatus('Loaded');
        setTimeout(() => setStatus(''), 2000);
      } else {
        setStatus('File not found');
      }
    } catch (e) {
      console.error(e);
      setStatus('Error');
    }
  }, [filePath, setContent]);

  return {
    filePath,
    setFilePath,
    status,
    setStatus,
    handleSave,
    handleLoad
  };
};
