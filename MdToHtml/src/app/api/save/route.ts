import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, content } = body;

    if (!slug || !content) {
      return NextResponse.json(
        { error: 'Slug and content are required' },
        { status: 400 }
      );
    }

    // Ensure slug is safe
    const safeSlug = slug.replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5]/g, '-');
    const dataDir = path.join(process.cwd(), '../input');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, `${safeSlug}.md`);
    fs.writeFileSync(filePath, content, 'utf8');

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    );
  }
}
