import { NextResponse } from 'next/server';
import PathManager from '@/lib/path-manager';
import MetadataCacheManager from '@/lib/cache-manager';
import { ApiResponse } from '@/types/file-system';
import { DEFAULT_CAPACITY } from '@/lib/constants';

export async function GET() {
  try {
    const config = PathManager.getAppConfig();
    const limit = config.capacityLimit || DEFAULT_CAPACITY;
    const entries = MetadataCacheManager.getAll();
    
    const response: ApiResponse = {
      success: true,
      data: {
        limit,
        count: entries.length,
        usage: limit > 0 ? Math.round((entries.length / limit) * 100) : 0
      }
    };
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to get capacity info', message: error.message } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { limit } = body;
    
    if (typeof limit !== 'number' || limit < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid limit. Must be a positive number.' } as ApiResponse,
        { status: 400 }
      );
    }

    PathManager.updateConfig({ capacityLimit: limit });
    
    // Trigger cleanup if new limit is lower than current count
    MetadataCacheManager.scanAndSync();
    
    return NextResponse.json({ success: true, data: { limit } } as ApiResponse);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update capacity limit', message: error.message } as ApiResponse,
      { status: 500 }
    );
  }
}
