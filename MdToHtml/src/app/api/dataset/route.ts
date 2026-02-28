import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PathManager from '@/lib/path-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, output, previous_content, current_content, metadata } = body;

    if (!input || !output) {
      return NextResponse.json(
        { error: 'Input and output are required' },
        { status: 400 }
      );
    }

    const dataDir = PathManager.getDataPath();
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, 'training_dataset.jsonl');
    
    // 1. Log Edit Task (if available and changed)
    if (previous_content !== undefined && current_content !== undefined && previous_content !== current_content) {
        const editEntry = {
            task_type: 'edit',
            input: previous_content,
            output: current_content,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString(),
                char_diff: current_content.length - previous_content.length,
                status: 'completed',
                reviewed: true
            }
        };
        fs.appendFileSync(filePath, JSON.stringify(editEntry) + '\n', 'utf8');
    }

    // 2. Log Parse Task (Standard)
    const parseEntry = {
      task_type: 'parse',
      input,
      output,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        status: 'completed',
        reviewed: true
      }
    };

    fs.appendFileSync(filePath, JSON.stringify(parseEntry) + '\n', 'utf8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging dataset:', error);
    return NextResponse.json(
      { error: 'Failed to log dataset' },
      { status: 500 }
    );
  }
}
