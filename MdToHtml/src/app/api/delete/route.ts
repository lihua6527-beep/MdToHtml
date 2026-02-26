import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PathManager from '@/lib/path-manager';
import MetadataCacheManager from '@/lib/cache-manager';
import TrashManager from '@/lib/trash-manager';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { slug, slugs, deleteOutput = false } = body || {};

    if (!slug && (!slugs || !Array.isArray(slugs) || slugs.length === 0)) {
      return NextResponse.json(
        { error: 'slug or slugs array is required' },
        { status: 400 }
      );
    }

    // Normalize to array
    const targets: string[] = slugs || [slug];

    const cache = MetadataCacheManager;
    const outputDir = PathManager.getOutputPath();

    for (const s of targets) {
        if (!s) continue;
        
        // Delete from cache (moves MD to trash)
        cache.delete(s);

        // Delete output HTML if requested
        if (deleteOutput) {
          const candidates: string[] = [];
          const baseName = `${s}.html`;
          candidates.push(path.join(outputDir, baseName));
          // Handle potential safe filenames
          const safeBase = baseName.replace(/[\\/:\*\?"<>|]/g, '_');
          if (safeBase !== baseName) {
            candidates.push(path.join(outputDir, safeBase));
          }

          for (const p of candidates) {
            try {
              if (fs.existsSync(p)) {
                // fs.unlinkSync(p);
                TrashManager.moveToTrash([p]);
              }
            } catch (e) {
              console.warn('[Delete] Failed to delete output file:', p, e);
            }
          }
        }
    }

    return NextResponse.json({ success: true, count: targets.length });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
