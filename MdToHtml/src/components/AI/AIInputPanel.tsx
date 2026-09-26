'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Sparkles, Trash2, Upload, FileText, X, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as mammoth from 'mammoth';

export interface AIInputPanelProps {
  onSubmit: (text: string, sourceFileName: string) => void;
  onStyleChange: () => void;
  isGenerating: boolean;
}

export const AIInputPanel: React.FC<AIInputPanelProps> = ({
  onSubmit,
  onStyleChange,
  isGenerating,
}) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = fileContent?.length || 0;

  /** 读取文件内容（支持 .txt/.md/.docx） */
  const readFile = useCallback(async (file: File) => {
    const name = file.name.replace(/\.[^/.]+$/, ''); // 去扩展名
    setFileName(name);
    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      let text: string;

      if (ext === 'docx') {
        // 使用 mammoth 解析 .docx（从 ArrayBuffer 提取纯文本）
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
        if (!text.trim()) {
          text = `[警告] mammoth 未能从 .docx 中提取到文本内容。\n可能的原因：文档为纯图片/扫描件，或使用了不受支持的格式。`;
        }
      } else {
        // .txt / .md / 其他文本格式
        text = await file.text();
      }

      setFileContent(text);
    } catch (error: any) {
      console.error('文件读取失败:', error);
      alert(`文件读取失败: ${error.message || '请确保文件格式正确'}`);
    }
  }, []);

  /** 处理文件拖拽 */
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await readFile(file);
  }, [readFile]);

  /** 处理文件选择 */
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await readFile(file);
  }, [readFile]);

  /** 处理提交 */
  const handleSubmit = useCallback(() => {
    if (!fileContent?.trim()) return;
    onSubmit(fileContent, fileName || '未命名文档');
  }, [fileContent, fileName, onSubmit]);

  /** 清除文件 */
  const handleClear = useCallback(() => {
    setFileContent(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return (
    <div className="space-y-3">
      {/* 提示标签 */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Upload className="w-3 h-3" />
        <span>拖拽或选择文档 — 支持 .txt .md .docx</span>
      </div>

      {/* 文件拖拽/上传区 */}
      {!fileContent ? (
        <>
          {/* 拖拽区 */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full min-h-[140px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              dragging
                ? 'border-indigo-400 bg-indigo-50 scale-[1.01]'
                : 'border-border-soft hover:border-indigo-300 hover:bg-bg-card'
            }`}
          >
            <Upload className={`w-10 h-10 mb-2 transition-colors ${dragging ? 'text-indigo-500' : 'text-text-muted/40'}`} />
            <p className="text-sm font-medium text-text-secondary">拖拽文件到此处</p>
            <p className="text-xs text-text-muted/60 mt-1">或点击选择文件</p>
            <div className="mt-3 flex gap-2">
              <span className="text-[10px] px-2 py-0.5 bg-bg-card rounded border border-border-soft text-text-muted">.txt</span>
              <span className="text-[10px] px-2 py-0.5 bg-bg-card rounded border border-border-soft text-text-muted">.md</span>
              <span className="text-[10px] px-2 py-0.5 bg-bg-card rounded border border-border-soft text-text-muted">.docx</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.docx,.pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </>
      ) : (
        /* 已加载文件：显示文件名和内容预览 */
        <div className="border border-border-soft rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-bg-card border-b border-border-soft">
            <div className="flex items-center gap-2 text-xs">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-medium text-text-primary truncate max-w-[200px]">{fileName}</span>
              <span className="text-text-muted">({charCount} 字)</span>
            </div>
            <button onClick={handleClear} className="text-text-muted hover:text-red-500 p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <pre className="max-h-[120px] overflow-y-auto p-3 text-[11px] text-text-muted leading-relaxed bg-white whitespace-pre-wrap">
            {fileContent.slice(0, 500)}{fileContent.length > 500 ? '\n...' : ''}
          </pre>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={handleSubmit}
          disabled={!fileContent?.trim() || isGenerating}
          className="gap-1.5"
        >
          {isGenerating ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              生成中...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI 生成
            </span>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onStyleChange}
          disabled={isGenerating}
          className="gap-1.5"
        >
          🎨 换个风格
        </Button>

        {fileContent && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="ml-auto text-text-muted hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};