import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PathManager from '@/lib/path-manager';
import MetadataCacheManager from '@/lib/cache-manager';
import TrashManager from '@/lib/trash-manager';
import { ApiResponse } from '@/types/file-system';

// export const dynamic = 'force-dynamic'; // 注释掉，因为静态导出不支持

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { slug, slugs, deleteOutput = false } = body || {};

    // Normalize input
    let targets: string[] = [];
    if (slug) targets.push(slug);
    if (slugs && Array.isArray(slugs)) targets = targets.concat(slugs);

    if (targets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'slug or slugs array is required' } as ApiResponse,
        { status: 400 }
      );
    }

    const cache = MetadataCacheManager;
    const outputDir = PathManager.getOutputPath();
    const errors: string[] = [];

    for (const s of targets) {
        if (!s) continue;
        
        try {
          // Delete from cache (moves MD to trash)
          cache.delete(s);
        } catch (e: any) {
          errors.push(`Failed to delete source ${s}: ${e.message}`);
        }

        // Delete output HTML if requested
        if (deleteOutput) {
          const baseName = `${s}.html`;
          const safeBase = baseName.replace(/[\\/:\*\?"<>|]/g, '_');
          
          const candidates: string[] = [
            path.join(outputDir, baseName)
          ];
          if (safeBase !== baseName) {
            candidates.push(path.join(outputDir, safeBase));
          }

          for (const p of candidates) {
            try {
              if (fs.existsSync(p)) {
                TrashManager.moveToTrash([p]);
              }
            } catch (e: any) {
              console.warn('[Delete] Failed to delete output file:', p, e);
              errors.push(`Failed to delete output ${path.basename(p)}: ${e.message}`);
            }
          }
        }
    }

    const response: ApiResponse = {
      success: errors.length === 0,
      data: { count: targets.length - errors.length, failed: errors.length },
      message: errors.length > 0 ? 'Some files failed to delete' : 'Files deleted successfully',
      meta: { errors }
    };

    return NextResponse.json(response, { status: errors.length === targets.length ? 500 : 200 });

  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: error.message } as ApiResponse,
      { status: 500 }
    );
  }
}
