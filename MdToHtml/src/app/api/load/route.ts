import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    const inputDir = path.join(process.cwd(), '../input');
    const filePath = path.join(inputDir, filename);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json(
            { error: 'File not found' },
            { status: 404 }
        );
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error loading file:', error);
    return NextResponse.json(
      { error: 'Failed to load file' },
      { status: 500 }
    );
  }
}
