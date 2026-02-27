import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PathManager from '@/lib/path-manager';
import ConfigManager from '@/lib/config-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, content, metadata } = body;

    if (!filename || !content) {
      return NextResponse.json(
        { error: 'Filename and content are required' },
        { status: 400 }
      );
    }

    // 确保 output 目录存在
    const outputDir = PathManager.getOutputPath();
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 处理文件名：确保以 .html 结尾，且没有非法字符
    let safeFilename = filename.replace(/[\\/:\*\?"<>|]/g, '_');
    if (!safeFilename.endsWith('.html')) {
      safeFilename += '.html';
    }

    const filePath = path.join(outputDir, safeFilename);
    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`[Export] Saved file to: ${filePath}`);

    try {
      const appConfig = ConfigManager.getInstance().getConfig();
      const emitJson = !!appConfig.exportOptions?.emitJson;
      if (emitJson) {
        const baseName = path.basename(safeFilename, '.html');
        
        let meta;
        if (metadata) {
            // Use provided metadata
            meta = {
                id: baseName,
                type: metadata.type || 'project',
                title: metadata.title || baseName,
                brief: metadata.brief || '',
                date: metadata.date || new Date().toISOString().slice(0, 10),
                tags: metadata.tags || [],
                chdVersion: '2.4',
                htmlFile: safeFilename,
                ...metadata // Allow overrides
            };
        } else {
            // Fallback to extraction
            let title = baseName;
            const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim();
            }
            let bodyInner = content;
            const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch && bodyMatch[1]) {
            bodyInner = bodyMatch[1];
            }
            let plain = bodyInner
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')
            .trim();
            const brief = plain.slice(0, 100);
            meta = {
            id: baseName,
            type: 'project',
            title,
            brief,
            date: new Date().toISOString().slice(0, 10),
            tags: [] as string[],
            chdVersion: '2.4',
            htmlFile: safeFilename
            };
        }

        const jsonPath = path.join(outputDir, `${baseName}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 2), 'utf8');
        console.log(`[Export] Saved metadata to: ${jsonPath}`);
      }
    } catch (metaErr) {
      console.warn('[Export] Failed to emit JSON metadata:', metaErr);
    }

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Error saving export file:', error);
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    );
  }
}
