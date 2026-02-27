import { NextResponse } from 'next/server';
import TrashManager from '@/lib/trash-manager';
import MetadataCacheManager from '@/lib/cache-manager';
import { ApiResponse } from '@/types/file-system';

export async function POST(request: Request) {
  try {
    const { files } = await request.json();
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files provided' } as ApiResponse, { status: 400 });
    }

    const result = TrashManager.restoreFiles(files);
    
    // If successful, trigger cache sync to ensure restored files appear in the list immediately
    if (result.success > 0) {
        // Force a scan to detect the newly restored files in the posts directory
        MetadataCacheManager.scanAndSync();
    }

    const response: ApiResponse = {
      success: result.failed === 0,
      data: result,
      message: result.failed > 0 ? 'Some files failed to restore' : 'Files restored successfully'
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error restoring files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore files', message: error.message } as ApiResponse,
      { status: 500 }
    );
  }
}
