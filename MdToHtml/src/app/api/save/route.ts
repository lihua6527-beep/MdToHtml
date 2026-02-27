import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PathManager from '@/lib/path-manager';
import MetadataCacheManager from '@/lib/cache-manager';
import { collectData } from '@/lib/data-collector';
import { ApiResponse } from '@/types/file-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Accept operations from body
    const { slug, content, operations } = body;

    if (!slug || !content) {
      const response: ApiResponse = {
        success: false,
        error: 'Slug and content are required'
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Ensure slug is safe but preserve spaces/underscores for matching existing files
    // Allow: letters, numbers, chinese, space, underscore, dash, dot, parenthesis
    const safeSlug = slug.replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5\s_.\(\)]/g, '');
    
    // Collect data for AI training (async, non-blocking ideally, but await here to ensure it runs)
    // Pass operations to collectData
    await collectData(safeSlug, content, operations);

    // Use CacheManager for updates to ensure consistency
    // CacheManager only cares about content
    const cacheManager = MetadataCacheManager;
    cacheManager.update(safeSlug, content);

    const response: ApiResponse = {
      success: true,
      data: { slug: safeSlug }
    };
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error saving file:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to save file',
      message: error.message
    };
    return NextResponse.json(response, { status: 500 });
  }
}
