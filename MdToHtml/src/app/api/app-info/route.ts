import { NextResponse } from 'next/server';
import PathManager from '@/lib/path-manager';

export async function GET() {
  try {
    const inputPath = PathManager.getInputPath();
    const outputPath = PathManager.getOutputPath();
    const dataPath = PathManager.getDataPath();
    const appRoot = PathManager.getAppRoot();
    const config = PathManager.getAppConfig();

    return NextResponse.json({
      inputPath,
      outputPath,
      dataPath,
      appRoot,
      config
    });
  } catch (error) {
    console.error('Error getting app info:', error);
    return NextResponse.json(
      { error: 'Failed to get app info' },
      { status: 500 }
    );
  }
}
