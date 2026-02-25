import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PathManager from '@/lib/path-manager';

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

    // Ensure slug is safe but preserve spaces/underscores for matching existing files
    // Allow: letters, numbers, chinese, space, underscore, dash, dot, parenthesis
    const safeSlug = slug.replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5\s_.\(\)]/g, '');
    const dataDir = PathManager.getInputPath();
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, `${safeSlug}.md`);
    
    // Check if we are accidentally creating a duplicate due to slug mismatch
    // (e.g. if original file was "My Post.md" and we write "My Post.md", it's fine)
    // But if original was "My  Post.md" (double space) and slug collapsed it?
    // We assume slug from client is correct.
    
    console.log(`Saving to: ${filePath}`);
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
