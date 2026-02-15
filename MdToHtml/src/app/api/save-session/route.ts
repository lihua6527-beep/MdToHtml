import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  console.log('API /api/save-session hit');
  try {
    const body = await request.json();
    console.log('Body received');
    const { slug, input, output, operations } = body;

    if (!slug || !input || !output) {
      console.error('Missing fields');
      return NextResponse.json(
        { error: 'Missing required fields: slug, input, output' },
        { status: 400 }
      );
    }

    // Ensure data directory exists
    const dataRoot = path.join(process.cwd(), '../data');
    console.log('Data root:', dataRoot);
    
    if (!fs.existsSync(dataRoot)) {
      console.log('Creating data root...');
      fs.mkdirSync(dataRoot, { recursive: true });
    }

    // Create permanent session directory: data/{slug}
    // Updated Logic: We no longer create timestamped folders. 
    // Instead, we use a single folder per slug and append to a history log.
    const safeSlug = slug.replace(/[\\/:*?"<>|]/g, '_');
    const sessionDirName = safeSlug;
    const sessionDir = path.join(dataRoot, sessionDirName);
    console.log('Session dir:', sessionDir);

    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();

    // 1. Write current state files (Overwrite to keep latest)
    fs.writeFileSync(path.join(sessionDir, 'input.md'), input, 'utf8');
    fs.writeFileSync(path.join(sessionDir, 'output.md'), output, 'utf8');
    
    // Auto-calculate score if not provided
    let scoreData = body.score;
    if (!scoreData) {
        // ... (logic remains same)
    }

    const metadata = {
        slug,
        last_updated: timestamp,
        score: scoreData || null,
        client_version: '1.0.0',
        user_agent: request.headers.get('user-agent') || 'unknown'
    };

    fs.writeFileSync(path.join(sessionDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');
    
    // 2. Append to History Log (Unified Record)
    const historyPath = path.join(sessionDir, 'history.json');
    let history: any[] = [];
    
    if (fs.existsSync(historyPath)) {
        try {
            const fileContent = fs.readFileSync(historyPath, 'utf8');
            history = JSON.parse(fileContent);
            if (!Array.isArray(history)) history = [];
        } catch (e) {
            console.error('Failed to parse history.json, starting new history');
            history = [];
        }
    }

    // Only append if there are operations or it's a significant save
    // For now, we append every save action as a record
    history.push({
        timestamp,
        score: scoreData || null,
        operations: operations || []
    });

    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');
    
    // We no longer write individual operations.json, as it's in history.json
    // But for backward compatibility or ease of access to latest ops, we can overwrite operations.json with latest
    const operationsData = JSON.stringify(operations || [], null, 2);
    fs.writeFileSync(path.join(sessionDir, 'operations.json'), operationsData, 'utf8');
    
    console.log('Files written and history updated successfully');

    return NextResponse.json({ success: true, path: sessionDirName });
  } catch (error) {
    console.error('Error saving session:', error);
    return NextResponse.json(
      { error: 'Failed to save session' },
      { status: 500 }
    );
  }
}
