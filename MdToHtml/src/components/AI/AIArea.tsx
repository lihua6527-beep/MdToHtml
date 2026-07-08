'use client';

import React, { useState, useCallback } from 'react';
import { mutate } from 'swr';
import { AIInputPanel } from './AIInputPanel';
import { AITempFileList } from './AITempFileList';
import { AISaveDialog } from './AISaveDialog';
import { AIService } from '@/services/ai/AIService';
import { TempFileManager } from '@/services/ai/TempFileManager';
import { HtmlBundler } from '@/lib/export/HtmlBundler';
import { FileService } from '@/services/FileService';
import { DEFAULT_THEME } from '@/lib/themes';
import type { TempFileItem } from '@/services/ai/TempFileManager';

export interface AIAreaProps {
  onClose?: () => void;
  onOpenSettings?: () => void;
}

export const AIArea: React.FC<AIAreaProps> = ({ onClose, onOpenSettings }) => {
  const [tempFiles, setTempFiles] = useState<TempFileItem[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentModel, setCurrentModel] = useState<'deepseek-chat' | 'deepseek-reasoner'>('deepseek-chat');
  const [currentPrompt, setCurrentPrompt] = useState<'default' | 'alternative'>('default');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const promptLabel = currentPrompt === 'default' ? '默认风格' : '学术风格';

  const refreshFiles = useCallback(() => {
    setTempFiles(TempFileManager.listTemps());
  }, []);

  const handleGenerate = useCallback(async (inputText: string, sourceFileName: string) => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const result = await AIService.generate({
        text: inputText,
        config: { model: currentModel, promptVariant: currentPrompt },
      });
      if (result.error) { setErrorMessage(result.error); return; }
      TempFileManager.createTemp(sourceFileName, result.markdown, currentPrompt, currentModel);
      refreshFiles();
      const files = TempFileManager.listTemps();
      if (files.length > 0) setSelectedFileId(files[files.length - 1].id);
    } catch (error: any) {
      setErrorMessage(error.message || 'AI 生成失败，请重试');
    } finally { setIsGenerating(false); }
  }, [currentModel, currentPrompt, refreshFiles]);

  const handleStyleChange = useCallback(() => {
    setCurrentPrompt(prev => prev === 'default' ? 'alternative' : 'default');
  }, []);

  /** 🔗 预览：存入 localStorage + 新窗口打开 */
  const handleOpenPreview = useCallback((fileId: string) => {
    const file = TempFileManager.getTemp(fileId);
    if (!file) return;
    localStorage.setItem('ai_preview_content', file.content);
    window.open(`/preview?file=${encodeURIComponent(file.fileName)}`, '_blank');
  }, []);

  /** ⬇️ 下载：真实调用 HtmlBundler + FileService.saveExport + 浏览器下载 */
  const handleDownload = useCallback(async (fileId: string) => {
    const file = TempFileManager.getTemp(fileId);
    if (!file) return;
    const title = file.sourceFileName || 'AI生成文档';
    try {
      const blob = await HtmlBundler.bundle(file.content, title, DEFAULT_THEME);
      // 保存到 output 目录
      const htmlContent = await blob.text();
      await FileService.saveExport({
        filename: file.fileName.replace('.md', '.html'),
        content: htmlContent,
        metadata: {
          id: file.fileName.replace('.md', ''),
          type: 'document',
          title: file.sourceFileName,
          date: new Date().toISOString().slice(0, 10),
          tags: [],
          chdVersion: '2.4',
          htmlFile: `${file.fileName.replace('.md', '.html')}`,
        },
      });
      // 浏览器下载
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName.replace('.md', '.html');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('HTML 导出失败:', error);
      alert(`导出失败: ${error.message || '未知错误'}`);
    }
  }, []);

  const handleDelete = useCallback((fileId: string) => {
    TempFileManager.deleteTemp(fileId);
    refreshFiles();
    setSelectedFileId(prev => prev === fileId ? null : prev);
  }, [refreshFiles]);

  /** 💾 保存单个文件到左侧文档列表（持久化，先弹窗重命名） */
  const handleSaveOne = useCallback(async (fileId: string) => {
    const file = TempFileManager.getTemp(fileId);
    if (!file || !file.content?.trim()) return;
    // 弹窗让用户自定义文件名（默认用 AI 生成的文件名去后缀）
    const defaultName = file.fileName.replace(/\.md$/i, '').replace(/_标准化.*$/, '');
    const newName = prompt('保存到左侧文档列表，请输入文件名（不含后缀）:', defaultName);
    if (!newName) return; // 用户取消
    try {
      const success = await FileService.saveFile(newName, file.content);
      if (success) {
        mutate('/api/files');
        TempFileManager.deleteTemp(fileId);
        refreshFiles();
        setSelectedFileId(prev => prev === fileId ? null : prev);
      }
    } catch (error: any) {
      console.error('保存失败:', error);
    }
  }, [refreshFiles]);

  const handleSaveAll = useCallback(async () => {
    const items = TempFileManager.listTemps();
    let saved = 0;
    for (const item of items) {
      try {
        const slug = item.fileName.replace(/\.md$/i, '');
        const success = await FileService.saveFile(slug, item.content);
        if (success) {
          TempFileManager.deleteTemp(item.id);
          saved++;
        }
      } catch {}
    }
    if (saved > 0) {
      mutate('/api/files');
      refreshFiles();
      setSelectedFileId(null);
    }
  }, [refreshFiles]);

  const handleClearAll = useCallback(() => {
    TempFileManager.clearAll();
    refreshFiles();
    setSelectedFileId(null);
  }, [refreshFiles]);

  const handleExit = useCallback(() => {
    if (TempFileManager.getUnsavedCount() > 0) setShowExitDialog(true);
    else if (onClose) onClose();
  }, [onClose]);

  return (
    <div className="h-full flex flex-col">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between shrink-0 pb-3 border-b border-border-soft mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">🤖 AI 转换</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all" style={{
            backgroundColor: currentPrompt === 'default' ? '#eef2ff' : '#fce7f3',
            borderColor: currentPrompt === 'default' ? '#c7d2fe' : '#f9a8d4',
            color: currentPrompt === 'default' ? '#4338ca' : '#be185d',
          }}>
            {promptLabel}
          </span>
          <span className="text-xs text-text-muted hidden sm:inline">任意文档 → CHD 格式</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={currentModel} onChange={(e) => setCurrentModel(e.target.value as any)} className="px-2 py-1 text-[11px] border border-border-soft rounded-md bg-white text-text-primary cursor-pointer">
            <option value="deepseek-chat">DeepSeek Flash ⚡</option>
            <option value="deepseek-reasoner">DeepSeek Pro 🧠</option>
          </select>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            <span className="text-[10px] text-green-600 hidden sm:inline">已连接</span>
          </span>
          {onOpenSettings && <button onClick={onOpenSettings} className="text-text-muted hover:text-text-primary text-sm px-1" title="AI 设置">⚙️</button>}
          {onClose && <button onClick={handleExit} className="text-text-muted hover:text-text-primary text-sm px-1" title="关闭">✕</button>}
        </div>
      </div>

      <div className="shrink-0">
        <div className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1">
          📝 输入文档
          <span className="font-normal text-text-muted text-[10px] ml-1">— 拖拽文件 / 选择文件 / URL</span>
        </div>
        <AIInputPanel onSubmit={handleGenerate} onStyleChange={handleStyleChange} isGenerating={isGenerating} />
      </div>

      {errorMessage && (
        <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
        </div>
      )}

      {tempFiles.length > 0 && <div className="border-t border-border-soft my-3" />}

      {tempFiles.length > 0 && (
        <AITempFileList
          files={tempFiles}
          selectedFileId={selectedFileId}
          onSelect={setSelectedFileId}
          onOpenPreview={handleOpenPreview}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onSaveOne={handleSaveOne}
          onSaveAll={handleSaveAll}
          onClearAll={handleClearAll}
        />
      )}

      {tempFiles.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-text-muted/30">
          <div className="text-center">
            <div className="text-2xl mb-1">📄</div>
            <p className="text-xs">拖入文档后点击「AI 生成」</p>
          </div>
        </div>
      )}

      <AISaveDialog
        open={showExitDialog}
        unsavedCount={tempFiles.length}
        unsavedFileNames={tempFiles.map(f => f.fileName)}
        onSave={async () => { await TempFileManager.confirmSaveAll(); setShowExitDialog(false); if (onClose) onClose(); }}
        onDiscard={() => { TempFileManager.clearAll(); setShowExitDialog(false); if (onClose) onClose(); }}
        onCancel={() => setShowExitDialog(false)}
      />
    </div>
  );
};