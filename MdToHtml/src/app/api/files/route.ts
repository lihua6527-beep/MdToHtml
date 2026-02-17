import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const inputDir = path.join(process.cwd(), '../input');
    
    if (!fs.existsSync(inputDir)) {
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
