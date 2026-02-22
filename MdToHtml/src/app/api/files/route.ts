import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PathManager from '@/lib/path-manager';

export async function GET() {
  try {
    const inputDir = PathManager.getInputPath();
    console.log('[API/Files] Scanning input directory:', inputDir);
    
    if (!fs.existsSync(inputDir)) {
      console.warn('[API/Files] Input directory does not exist:', inputDir);
      return NextResponse.json({ files: [] });
    }

    const files = fs.readdirSync(inputDir)
      .filter(file => file.endsWith('.md') || file.endsWith('.markdown'))
      .sort((a, b) => a.localeCompare(b))
      .map(file => ({
        name: file,
        path: path.join(inputDir, file),
        slug: file.replace(/\.(md|markdown)$/, '')
      }));

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error reading input directory:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}
