import { NextResponse } from 'next/server';
import ConfigManager from '@/lib/config-manager';
import PathManager from '@/lib/path-manager';
import MetadataCacheManager from '@/lib/cache-manager';
import TrashManager from '@/lib/trash-manager';

export async function GET() {
  const config = ConfigManager.getInstance().getConfig();
  return NextResponse.json(config);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Use PathManager to update config, which ensures that:
    // 1. ConfigManager updates the file
    // 2. PathManager re-resolves the paths in memory immediately
    PathManager.updateConfig(body);
    
    // Reload other managers to ensure they use the new paths
    MetadataCacheManager.reload();
    TrashManager.reload();
    
    return NextResponse.json({ success: true, config: ConfigManager.getInstance().getConfig() });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
