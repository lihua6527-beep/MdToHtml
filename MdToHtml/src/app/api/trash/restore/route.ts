import { NextResponse } from 'next/server';
import TrashManager from '@/lib/trash-manager';
import MetadataCacheManager from '@/lib/cache-manager';

export async function POST(request: Request) {
  try {
    const { files } = await request.json();
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const result = TrashManager.restoreFiles(files);
    
    // If successful, trigger cache sync to ensure restored files appear in the list immediately
    if (result.success > 0) {
        // Force a scan to detect the newly restored files in the posts directory
        MetadataCacheManager.scanAndSync();
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to restore files', details: error.message },
      { status: 500 }
    );
  }
}
