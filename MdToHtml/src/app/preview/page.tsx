'use client';

import React, { useEffect, useState } from 'react';
import { CHDRenderer } from '@/components/CHD/CHDRenderer';
import { loadFromStorage } from '@/hooks/useAutoSave';

export default function PreviewPage() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 尝试从 AI 预览专用 key 读取（纯文本，非JSON）
    const aiContent = localStorage.getItem('ai_preview_content');
    if (aiContent) {
      setContent(aiContent);
      setLoading(false);
      return;
    }

    // 尝试从编辑器自动保存读取（JSON格式）
    const savedContent = loadFromStorage('chd_md_content', '');
    setContent(savedContent);
    setLoading(false);

    // Listen for storage changes to update preview in real-time if multiple tabs are open
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chd_md_content' && e.newValue) {
        try {
          setContent(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Failed to parse storage update:', error);
          setContent(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading Preview...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Content Found</h2>
          <p className="text-gray-500 mb-4">
            Please go back to the editor and add some content first.
          </p>
          <button 
            onClick={() => window.close()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto p-4">
        <div className="bg-white shadow-sm border border-gray-200 min-h-[calc(100vh-2rem)]">
          <CHDRenderer markdown={content} />
        </div>
      </div>
    </div>
  );
}
