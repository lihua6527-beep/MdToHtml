import React from 'react';
import { Download, FileCode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { HtmlBundler } from '@/lib/export/HtmlBundler';
import { parseFrontmatter } from '@/lib/simple-frontmatter';
import { FileService } from '@/services/FileService';
import { ThemeId } from '@/lib/themes';

interface ExportButtonProps {
  content: string;
  decodedSlug: string;
  theme: ThemeId;
  isExporting: boolean;
  setIsExporting: (isExporting: boolean) => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  content,
  decodedSlug,
  theme,
  isExporting,
  setIsExporting
}) => {
  const { toast } = useToast();

  /** 导出 HTML */
  const handleExportHTML = async () => {
    setIsExporting(true);
    try {
      const title = decodedSlug || 'Untitled';
      const blob = await HtmlBundler.bundle(content, title, theme);

      const meta = parseFrontmatter(content);

      try {
        const htmlContent = await blob.text();
        const success = await FileService.saveExport({
          filename: `${title}.html`,
          content: htmlContent,
          metadata: {
            id: title,
            title: meta.title || title,
            subtitle: meta.subtitle,
            brief: meta.brief || '',
            date: meta.date || new Date().toISOString().slice(0, 10),
            tags: meta.tags || [],
            chdVersion: '2.4',
            htmlFile: `${title}.html`,
            ...meta
          }
        });

        if (success) {
          console.log('Export synced to output directory');
          toast({
            title: "导出成功",
            description: "HTML 文件已保存到输出目录",
            type: "success",
          });
        } else {
          throw new Error("同步到输出目录失败");
        }
      } catch (saveErr) {
        console.error('Failed to sync export to output:', saveErr);
        toast({
          title: "同步失败",
          description: "无法保存到输出目录，仅下载文件",
          type: "warning",
        });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export failed:', err);
      toast({
        title: "导出失败",
        description: err.message || '未知错误',
        type: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  /** 导出为 Markdown（直接下载 .md 文件） */
  const handleExportMarkdown = () => {
    const filename = prompt('请输入文件名:', `${decodedSlug || 'document'}.md`);
    if (!filename) return;
    const finalName = filename.endsWith('.md') ? filename : `${filename}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-text-secondary hover:text-primary h-8 px-2"
        onClick={handleExportMarkdown}
        title="导出为 Markdown (.md)"
      >
        <FileCode className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-xs">.md</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-text-secondary hover:text-primary h-8 px-2"
        onClick={handleExportHTML}
        disabled={isExporting}
        title="导出为静态网页 (HTML)"
      >
        <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
        <span className="hidden sm:inline text-xs">HTML</span>
      </Button>
    </div>
  );
};

export default React.memo(ExportButton);