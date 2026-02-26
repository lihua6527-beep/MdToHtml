import { NextResponse } from 'next/server';
import PathManager from '@/lib/path-manager';
import MetadataCacheManager from '@/lib/cache-manager';

export async function GET() {
  try {
    const config = PathManager.getAppConfig();
    const limit = config.capacityLimit || 100;
    const entries = MetadataCacheManager.getAll();
    
    return NextResponse.json({
      limit,
      count: entries.length,
      usage: Math.round((entries.length / limit) * 100)
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get capacity info', details: error.message },
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
        { error: 'Invalid limit. Must be a positive number.' },
        { status: 400 }
      );
    }

    PathManager.updateConfig({ capacityLimit: limit });
    
    // Trigger cleanup if new limit is lower than current count
    MetadataCacheManager.scanAndSync();
    
    return NextResponse.json({ success: true, limit });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update capacity limit', details: error.message },
      { status: 500 }
    );
  }
}
