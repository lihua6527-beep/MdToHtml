import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PathManager from '@/lib/path-manager';
import MetadataCacheManager from '@/lib/cache-manager';
import { collectData } from '@/lib/data-collector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Accept operations from body
    const { slug, content, operations } = body;

    if (!slug || !content) {
      return NextResponse.json(
        { error: 'Slug and content are required' },
        { status: 400 }
      );
    }

    // Ensure slug is safe but preserve spaces/underscores for matching existing files
    // Allow: letters, numbers, chinese, space, underscore, dash, dot, parenthesis
    const safeSlug = slug.replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5\s_.\(\)]/g, '');
    
    // Collect data for AI training (async, non-blocking ideally, but await here to ensure it runs)
    // Pass operations to collectData
    await collectData(safeSlug, content, operations);

    // Use CacheManager for updates to ensure consistency
    // CacheManager only cares about content
    const cacheManager = MetadataCacheManager.getInstance();
    cacheManager.update(safeSlug, content);

    return NextResponse.json({ success: true, slug: safeSlug });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    );
  }
}
