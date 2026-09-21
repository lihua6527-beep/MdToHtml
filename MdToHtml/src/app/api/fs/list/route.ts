import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let dirPath = searchParams.get('path');

  // If path is missing, list drives or default to home
  if (!dirPath) {
    dirPath = os.homedir();
  }

  try {
    // Handle root path
    if (dirPath === 'ROOT') {
        // List drives (Windows specific logic)
        const drives = [];
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < letters.length; i++) {
            const drive = `${letters[i]}:\\`;
            try {
                if (fs.existsSync(drive)) {
                    drives.push({
                        name: drive,
                        path: drive,
                        type: 'drive'
                    });
                }
            } catch (e) {
                // Ignore access errors
            }
        }
        
        return NextResponse.json({
            current: 'ROOT',
            parent: null,
            folders: drives
        });
    }

    if (!fs.existsSync(dirPath)) {
        return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
         return NextResponse.json({ error: 'Not a directory' }, { status: 400 });
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    const folders = entries
        .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
        .map(entry => ({
            name: entry.name,
            path: path.join(dirPath!, entry.name),
            type: 'folder'
        }));

    const parent = path.dirname(dirPath);
    const isRoot = parent === dirPath;

    return NextResponse.json({
        current: dirPath,
        parent: isRoot ? null : parent,
        folders
    });

  } catch (error) {
    console.error('FS Error:', error);
    return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path: parentPath, name } = body;

    if (!parentPath || !name) {
      return NextResponse.json({ error: 'Path and name are required' }, { status: 400 });
    }

    // Basic validation for folder name (prevent directory traversal in name)
    if (name.includes('/') || name.includes('\\') || name.includes('..')) {
         return NextResponse.json({ error: 'Invalid folder name' }, { status: 400 });
    }

    const newPath = path.join(parentPath, name);

    if (fs.existsSync(newPath)) {
        return NextResponse.json({ error: 'Folder already exists' }, { status: 409 });
    }

    fs.mkdirSync(newPath);

    return NextResponse.json({ success: true, path: newPath });
  } catch (error: any) {
    console.error('FS Create Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create directory' }, { status: 500 });
  }
}
