import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PathManager from '@/lib/path-manager';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
      return NextResponse.json({ error: 'Only Markdown files are allowed' }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      post: {
        slug: file.name.replace(/\.(md|markdown)$/i, ''),
        mtime: stats.mtimeMs,
        status: status
      }
    });

  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: String(error) },
      { status: 500 }
    );
  }
}
