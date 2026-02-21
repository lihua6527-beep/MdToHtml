import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, content } = body;

    if (!filename || !content) {
      return NextResponse.json(
        { error: 'Filename and content are required' },
        { status: 400 }
      );
    }

    // 确保 output 目录存在
    // process.cwd() 通常是 MdToHtml 目录，output 在上一级
    const outputDir = path.join(process.cwd(), '../output');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 处理文件名：确保以 .html 结尾，且没有非法字符
    let safeFilename = filename.replace(/[\\/:\*\?"<>|]/g, '_');
    if (!safeFilename.endsWith('.html')) {
      safeFilename += '.html';
    }

    const filePath = path.join(outputDir, safeFilename);
    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`[Export] Saved file to: ${filePath}`);

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Error saving export file:', error);
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    );
  }
}
