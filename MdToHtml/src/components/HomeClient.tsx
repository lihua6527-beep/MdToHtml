'use client';

import React, { useState, useCallback, useEffect, lazy, Suspense, useRef } from 'react';
import { clsx } from 'clsx';
import { Sparkles, Upload, FileText, RefreshCw } from 'lucide-react';
import { mutate } from 'swr';
import { DocumentList } from './DocumentList';
import { useSearch } from '@/hooks/useSearch';
import { FileItem } from '../types/file-system';
import { QUERY_KEYS } from '@/constants/query-keys';

// ★ 懒加载重型面板组件：避免首屏打包不必要的 JS
const SettingsPanel = lazy(() => import('./SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const AIArea = lazy(() => import('@/components/AI/AIArea').then(m => ({ default: m.AIArea })));
const SearchPanel = lazy(() => import('@/components/SearchPanel').then(m => ({ default: m.SearchPanel })));

function LazyFallback() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs text-text-muted">加载模块中...</p>
      </div>
    </div>
  );
}

interface HomeClientProps {
  initialPosts: FileItem[];
}

type SettingsType = 'file' | 'render' | 'protocol' | 'ai';

export const HomeClient: React.FC<HomeClientProps> = ({ initialPosts }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsType, setSettingsType] = useState<SettingsType>('file');
  const [activeMode, setActiveMode] = useState<'welcome' | 'ai' | 'search'>('welcome');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 搜索状态
  const { query, results, search, clearSearch } = useSearch(initialPosts);

  // 监听 AIArea 触发的 "打开设置" 自定义事件
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const type = e.detail?.type || 'ai';
      setSettingsType(type);
      setShowSettings(true);
    };
    window.addEventListener('open-settings', handler as EventListener);
    return () => window.removeEventListener('open-settings', handler as EventListener);
  }, []);

  // ===== 拖拽上传逻辑 =====
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

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const validFiles = fileArr.filter(f => f.name.endsWith('.md') || f.name.endsWith('.markdown'));
    if (validFiles.length === 0) return;

    setIsUploading(true);
    for (const file of validFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) console.error('Failed to upload', file.name);
      } catch (err) {
        console.error('Error uploading', file.name, err);
      }
    }
    mutate('/api/files');
    setIsUploading(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(e.target.files);
      e.target.value = '';
    }
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
        onSearch={() => setActiveMode('search')}
        searchQuery={query}
        className="shrink-0 border-r border-border-soft"
      />

      {/* Main Content Area */}
      <div 
        className="flex-1 overflow-y-auto relative bg-gradient-to-br from-indigo-50/30 via-white to-blue-50/20"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-indigo-500/10 border-4 border-indigo-500 border-dashed z-50 flex flex-col items-center justify-center backdrop-blur-sm m-4 rounded-xl pointer-events-none">
            <Upload className="w-20 h-20 text-indigo-500 mb-4 animate-bounce" />
            <p className="text-2xl font-bold text-indigo-600">松开鼠标上传文件</p>
            <p className="text-indigo-400 mt-2">支持 Markdown (.md) 格式</p>
          </div>
        )}

        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 z-40 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-base text-indigo-600 font-medium mt-4">正在上传并处理文件...</p>
          </div>
        )}

        <div className={`mx-auto h-full flex flex-col ${activeMode === 'ai' ? 'max-w-4xl' : 'max-w-5xl'}`}>
          {activeMode === 'search' ? (
            <Suspense fallback={<LazyFallback />}>
              <SearchPanel
                query={query}
                results={results}
                onSearch={search}
                onClear={clearSearch}
                onClose={() => setActiveMode('welcome')}
              />
            </Suspense>
          ) : activeMode === 'ai' ? (
            <Suspense fallback={<LazyFallback />}>
              <AIArea 
                onClose={() => setActiveMode('welcome')}
              />
            </Suspense>
          ) : (
            /* ======== 全新 Welcome 页面：双大按钮设计 ======== */
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
              {/* Logo */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <span className="text-2xl font-bold text-white">C</span>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-800 mb-2">CHD Document Renderer</h1>
              <p className="text-gray-500 mb-12 text-center max-w-md">
                在左侧文档列表选择已有文档，或通过下方方式开始工作
              </p>

              {/* === AI 编辑按钮（C 位大按钮） === */}
              <button
                onClick={() => setActiveMode('ai')}
                className="group relative w-full max-w-md py-5 px-8 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all duration-200 active:scale-[0.98] mb-5"
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold">使用 AI 编辑器</p>
                    <p className="text-sm text-indigo-100 mt-0.5">智能转换与文档编辑</p>
                  </div>
                </div>
                {/* 右下角小光晕 */}
                <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-white/5 rounded-full blur-xl" />
              </button>

              {/* === 导入本地文件按钮 === */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group w-full max-w-md py-4 px-8 border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center transition-colors">
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-semibold text-gray-700 group-hover:text-indigo-700 transition-colors">
                      导入本地文件
                    </p>
                    <p className="text-sm text-gray-400 group-hover:text-indigo-400 transition-colors">
                      支持拖拽或点击选择 .md / .markdown 文件
                    </p>
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* 底部小提示 */}
              <p className="mt-8 text-xs text-gray-400">
                当前文档数：{initialPosts.length} 篇
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Settings Panel（懒加载） */}
      <Suspense fallback={null}>
        <SettingsPanel 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
          settingsType={settingsType} 
        />
      </Suspense>
    </div>
  );
};