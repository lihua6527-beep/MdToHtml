import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PathManager from '@/lib/path-manager';
import { ApiResponse } from '@/types/file-system';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      const response: ApiResponse = {
        success: false,
        error: 'No file uploaded'
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
      const response: ApiResponse = {
        success: false,
        error: 'Only Markdown files are allowed'
      };
      return NextResponse.json(response, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const content = buffer.toString('utf-8');
    
    // Parse status from frontmatter simply
    let status = 'pending';
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
        const fm = match[1];
        const statusMatch = fm.match(/status:\s*(.*)/);
        if (statusMatch) {
            status = statusMatch[1].trim();
        }
    }

    const postsDir = PathManager.getInputPath();
    
    // Ensure input directory exists
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }

    const filePath = path.join(postsDir, file.name);
    
    // Check if file exists and handle overwrite
    // We will overwrite the file, but we can log it or add a backup strategy if needed in future
    // For now, simple overwrite is the desired behavior for "updating" a file
    if (fs.existsSync(filePath)) {
        console.log(`Overwriting existing file: ${file.name}`);
    }
    
    fs.writeFileSync(filePath, buffer);

    const stats = fs.statSync(filePath);

    const response: ApiResponse = {
      success: true,
      data: {
        post: {
          slug: file.name.replace(/\.(md|markdown)$/i, ''),
          mtime: stats.mtimeMs,
          status: status
        }
      }
    };
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Upload failed:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Upload failed',
      message: error.message,
      details: String(error)
    };
    return NextResponse.json(response, { status: 500 });
  }
}
