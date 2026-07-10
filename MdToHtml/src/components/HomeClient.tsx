'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import { Settings, Upload, FileText, Sparkles, RefreshCw } from 'lucide-react';
import { mutate } from 'swr';
import { DocumentList } from './DocumentList';
import { SettingsPanel } from './SettingsPanel';
import { AIArea } from '@/components/AI/AIArea';
import { FileItem } from '../types/file-system';
import { QUERY_KEYS } from '@/constants/query-keys';

interface HomeClientProps {
  initialPosts: FileItem[];
}

type SettingsType = 'file' | 'render' | 'protocol' | 'ai';

export const HomeClient: React.FC<HomeClientProps> = ({ initialPosts }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsType, setSettingsType] = useState<SettingsType>('file');
  const [activeMode, setActiveMode] = useState<'welcome' | 'ai'>('ai');

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // 经典模式仅接受 Markdown 文件
    const validFiles = files.filter(f => f.name.endsWith('.md') || f.name.endsWith('.markdown'));
    if (validFiles.length === 0) return;

    setIsUploading(true);
    
    // Upload files sequentially or parallel
    for (const file of validFiles) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                console.error('Failed to upload', file.name);
            }
        } catch (err) {
            console.error('Error uploading', file.name, err);
        }
    }
    
    // Refresh list
    mutate('/api/files');
    setIsUploading(false);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden transition-colors duration-300">
      {/* Left Sidebar */}
      <DocumentList 
        initialPosts={initialPosts} 
        onOpenSettings={(type) => {
          setSettingsType(type);
          setShowSettings(true);
        }} 
        className="shrink-0 border-r border-border-soft"
      />

      {/* Main Content Area */}
      <div 
        className="flex-1 overflow-y-auto p-8 relative"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        {isDragging && (
            <div className="absolute inset-0 bg-primary/10 border-4 border-primary border-dashed z-50 flex flex-col items-center justify-center backdrop-blur-sm m-4 rounded-xl pointer-events-none">
                <Upload className="w-20 h-20 text-primary mb-4 animate-bounce" />
                <p className="text-2xl font-bold text-primary">松开鼠标上传文件</p>
                <p className="text-primary/70 mt-2">支持 Markdown (.md) 格式</p>
            </div>
        )}

        <div className={`mx-auto h-full flex flex-col ${activeMode === 'ai' ? 'max-w-4xl' : 'max-w-5xl'}`}>
          {activeMode === 'ai' ? (
            <AIArea 
              onClose={() => setActiveMode('welcome')}
            />
          ) : (
            <>
              <header className="mb-8 flex justify-between items-start shrink-0">
                <div className="flex items-start gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">欢迎使用 CHD Renderer</h1>
                    <p className="text-text-secondary">请从左侧选择文档进行预览。</p>
                  </div>
                  <button
                    onClick={() => {
                      mutate(QUERY_KEYS.FILES);
                      mutate(QUERY_KEYS.CAPACITY);
                    }}
                    className="mt-1 p-1.5 text-text-muted hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="刷新文档列表"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveMode('ai')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI 转换
                  </button>
                </div>
              </header>
              
              {/* Empty State / Drop Target */}
              <div className="flex-1 min-h-[200px] flex flex-col gap-4 items-center justify-center text-text-secondary/50 border-2 border-dashed border-border-soft rounded-xl transition-colors hover:border-primary/50 hover:bg-bg-card/50">
                {isUploading ? (
                  <>
                    <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
                    <p className="text-lg text-primary font-medium">正在上传并处理文件...</p>
                  </>
                ) : (
                  <>
                    <FileText className="w-16 h-16 opacity-50" />
                    <div className="text-center">
                      <p className="text-lg font-medium mb-1">拖拽 Markdown 文件到此处</p>
                      <p className="text-sm opacity-70">自动复制到项目并添加到列表</p>
                    </div>
                    <div className="mt-4 px-4 py-2 bg-secondary/50 rounded-lg text-xs">
                      支持 .md / .markdown 格式
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        settingsType={settingsType} 
      />
    </div>
  );
};
