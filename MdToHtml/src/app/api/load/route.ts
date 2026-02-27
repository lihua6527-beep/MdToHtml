import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PathManager from '@/lib/path-manager';
import { ApiResponse } from '@/types/file-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      const response: ApiResponse = {
        success: false,
        error: 'Filename is required'
      };
      return NextResponse.json(response, { status: 400 });
    }

    const inputDir = PathManager.getInputPath();
    const filePath = path.join(inputDir, filename);

    if (!fs.existsSync(filePath)) {
        const response: ApiResponse = {
            success: false,
            error: 'File not found'
        };
        return NextResponse.json(response, { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const response: ApiResponse = {
      success: true,
      data: { content, filename }
    };
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error loading file:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to load file',
      message: error.message
    };
    return NextResponse.json(response, { status: 500 });
  }
}
