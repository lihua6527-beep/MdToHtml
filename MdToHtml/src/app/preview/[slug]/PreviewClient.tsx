/**
 * PreviewClient — 预览页面的客户端组件
 * 
 * 职责：
 * - 从临时文件 API 或正式文件 API 加载内容
 * - 使用 CHDRenderer 渲染 Markdown
 * - 显示独立预览导航栏，提供「保存为正式文档」按钮
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye } from 'lucide-react';
import { CHDRenderer } from '@/components/CHD/CHDRenderer';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useTheme } from '@/components/ThemeProvider';
import { ApiClient } from '@/services/core/ApiClient';

interface PreviewClientProps {
  slug: string;
  tempFileName?: string;
  initialContent?: string;
  isTempFile: boolean;
  loadFromServer?: boolean;
}

const PreviewClient: React.FC<PreviewClientProps> = ({ 
  slug, 
  tempFileName,
  initialContent = '',
  isTempFile,
  loadFromServer = false
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [content, setContent] = useState<string>(initialContent);
  const [isLoading, setIsLoading] = useState<boolean>(!initialContent);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // 加载内容
  useEffect(() => {
    if (initialContent && !loadFromServer) {
      return;
    }

    const loadContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isTempFile && tempFileName) {
          // 从临时文件 API 加载
          const result = await ApiClient.post<any>('/api/load-temp', { fileName: tempFileName });
          if (result && result.content) {
            setContent(result.content);
          } else {
            setError('临时文件内容为空');
          }
        } else {
          // 从正式文件 API 加载
          const result = await ApiClient.post<any>('/api/load', { filename: slug });
          if (result && result.content) {
            setContent(result.content);
          } else {
            setError('文件不存在或无法加载');
          }
        }
      } catch (e: any) {
        console.error('Preview load error:', e);
        setError(e.message || '加载失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [slug, tempFileName, isTempFile, initialContent, loadFromServer]);

  // 保存临时文件为正式文件
  const handleSave = useCallback(async () => {
    if (!isTempFile || !tempFileName) return;
    
    setIsSaving(true);
    
    try {
      // 默认 slug
      const defaultSlug = slug.replace('__temp__', '').replace(/_temp_\d+\.md$/, '');
      
      // 询问用户文件名
      const userSlug = prompt('保存为文件（不含 .md 后缀）:', defaultSlug);
      if (!userSlug) {
        setIsSaving(false);
        return;
      }
      
      // 确认保存（传入自定义 slug 进行重命名）
      const saveResult = await ApiClient.post<any>('/api/confirm-save', { 
        id: tempFileName.replace('.md', ''),
        slug: userSlug
      });
      
      if (saveResult) {
        setIsConfirmed(true);
        
        // 发送通知刷新文件列表
        const event = new CustomEvent('files-refreshed');
        window.dispatchEvent(event);
        
        // 1.5秒后跳转到编辑器
        setTimeout(() => {
          router.push(`/editor/${userSlug}`);
        }, 1500);
      } else {
        throw new Error('保存失败');
      }
    } catch (e: any) {
      console.error('Preview save error:', e);
      alert('保存失败: ' + (e.message || '未知错误'));
    } finally {
      setIsSaving(false);
    }
  }, [isTempFile, tempFileName, slug, router]);

  // 返回按钮
  const handleBack = useCallback(() => {
    if (isConfirmed) {
      router.push('/');
    } else {
      router.back();
    }
  }, [isConfirmed, router]);

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
          <h2 className="text-lg font-bold text-text-primary mb-2">预览加载失败</h2>
          <p className="text-text-muted text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
            >
              重新加载
            </button>
            <button 
              onClick={handleBack} 
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      {/* 顶部导航栏（独立预览版） */}
      <div className="h-10 bg-bg-card border-b border-border-soft flex items-center justify-between px-4 text-text-primary shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="flex items-center gap-1.5 hover:text-primary transition-colors text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </button>
          <div className="w-px h-4 bg-border-soft" />
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm">预览模式</span>
          </div>
          <span className="text-[10px] text-text-muted bg-gray-100 px-2 py-0.5 rounded-full">
            {isTempFile ? '临时文件' : '正式文档'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          {/* 正式文档时显示「在编辑器中打开」 */}
          {!isTempFile && !isConfirmed && (
            <button
              onClick={() => router.push(`/editor/${slug}`)}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
            >
              ✏️ 在编辑器中打开
            </button>
          )}
        </div>
      </div>

      {/* 临时文件保存提示条 */}
      {isTempFile && !isConfirmed && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-700 text-sm">📄 预览模式 — 这是临时文件，保存后才会成为正式文档</span>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              '💾 保存为正式文档'
            )}
          </button>
        </div>
      )}

      {/* 保存成功提示 */}
      {isTempFile && isConfirmed && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-3 text-center">
          <span className="text-green-700 text-sm font-medium">✅ 已保存为正式文档！正在跳转到编辑器...</span>
        </div>
      )}

      {/* 正式文档提示条 */}
      {!isTempFile && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <span className="text-blue-700 text-sm">📖 正式文档预览 — 内容来自已保存的文件</span>
        </div>
      )}

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-8">
        <CHDRenderer 
          markdown={content}
          editMode={false}
        />
      </div>
    </div>
  );
};

export default PreviewClient;