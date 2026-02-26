import { useState, useCallback } from 'react';

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
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content })
      });
      if (res.ok) {
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
      const res = await fetch(`/api/read?path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
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
