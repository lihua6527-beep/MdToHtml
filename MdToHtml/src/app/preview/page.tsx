/**
 * Preview 页面（无 slug 版本）— 兼容旧版 localStorage 方式
 * 
 * 用于从 AIArea 等地方通过 localStorage 传递内容预览
 * 但推荐使用 /preview/__temp__{fileName} 方式
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye } from 'lucide-react';
import { CHDRenderer } from '@/components/CHD/CHDRenderer';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useTheme } from '@/components/ThemeProvider';
import { ApiClient } from '@/services/core/ApiClient';

export default function PreviewPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [content, setContent] = useState<string>('');
  const [tempFileName, setTempFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      try {
        // 1. 尝试从 URL 参数获取 fileName
        const params = new URLSearchParams(window.location.search);
        const fileNameParam = params.get('file');
        
        if (fileNameParam) {
          const result = await ApiClient.post<any>('/api/load-temp', { fileName: fileNameParam });
          if (result && result.content) {
            setContent(result.content);
            setTempFileName(fileNameParam);
            setIsLoading(false);
            return;
          }
        }
        
        // 2. 回退：从 localStorage 读取（旧方式兼容）
        const savedContent = localStorage.getItem('ai_preview_content');
        if (savedContent) {
          setContent(savedContent);
          setIsLoading(false);
          return;
        }
        
        setError('没有可预览的内容');
      } catch (e: any) {
        console.error('Preview load error:', e);
        setError(e.message || '加载失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  const handleSave = useCallback(async () => {
    if (!tempFileName || !content) return;
    setIsSaving(true);
    
    try {
      const defaultSlug = tempFileName.replace(/_temp_\d+\.md$/, '');
      const userSlug = prompt('保存为文件（不含 .md 后缀）:', defaultSlug);
      if (!userSlug) {
        setIsSaving(false);
        return;
      }
      
      await ApiClient.post<any>('/api/confirm-save', { 
        id: tempFileName.replace('.md', ''),
        slug: userSlug
      });
      
      setTimeout(() => router.push(`/editor/${userSlug}`), 500);
    } catch (e: any) {
      alert('保存失败: ' + (e.message || '未知错误'));
    } finally {
      setIsSaving(false);
    }
  }, [tempFileName, content, router]);

  const handleBack = useCallback(() => router.back(), [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">😵</div>
          <h2 className="text-lg font-bold mb-2">预览加载失败</h2>
          <p className="text-text-muted text-sm mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      {/* 独立导航栏 */}
      <div className="h-10 bg-bg-card border-b border-border-soft flex items-center justify-between px-4 text-text-primary shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="flex items-center gap-1.5 hover:text-primary transition-colors text-xs font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </button>
          <div className="w-px h-4 bg-border-soft" />
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm">预览</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
        </div>
      </div>

      {/* 临时文件保存提示 */}
      {tempFileName && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
          <span className="text-amber-700 text-sm">📄 预览模式 — 这是临时文件</span>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {isSaving ? '保存中...' : '💾 保存为正式文档'}
          </button>
        </div>
      )}

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-8">
        <CHDRenderer markdown={content} editMode={false} />
      </div>
    </div>
  );
}