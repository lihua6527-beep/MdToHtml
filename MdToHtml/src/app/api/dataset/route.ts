import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, output, metadata } = body;

    if (!input || !output) {
      return NextResponse.json(
        { error: 'Input and output are required' },
        { status: 400 }
      );
    }

    const dataDir = path.join(process.cwd(), '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, 'training_dataset.jsonl');
    
    const entry = {
      input,
      output,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      }
    };

    fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging dataset:', error);
    return NextResponse.json(
      { error: 'Failed to log dataset' },
      { status: 500 }
    );
  }
}
