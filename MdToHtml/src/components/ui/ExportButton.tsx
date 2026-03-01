import React from 'react';
import { Download, Loader2 } from 'lucide-react';
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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const title = decodedSlug || 'Untitled';
      const blob = await HtmlBundler.bundle(content, title, theme);
      
      // Parse metadata from markdown
      const meta = parseFrontmatter(content);

      // Sync to output directory
      try {
        const htmlContent = await blob.text();
        const success = await FileService.saveExport({
          filename: `${title}.html`,
          content: htmlContent,
          metadata: {
            id: title,
            type: meta.type || 'project',
            title: meta.title || title,
            brief: meta.brief || '',
            date: meta.date || new Date().toISOString().slice(0, 10),
            tags: meta.tags || [],
            chdVersion: '2.4',
            htmlFile: `${title}.html`
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

  return (
    <Button 
      variant="outline" 
      size="sm"
      className="gap-2 text-text-secondary hover:text-primary mr-2"
      onClick={handleExport}
      disabled={isExporting}
      title="导出为静态网页 (HTML)"
    >
      <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
      <span className="hidden sm:inline">{isExporting ? '导出中...' : '导出 HTML'}</span>
    </Button>
  );
};

export default React.memo(ExportButton);
