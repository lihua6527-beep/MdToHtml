/**
 * API: 加载临时文件
 * 根据 fileName 加载临时文件内容（用于预览）
 */
import { NextRequest, NextResponse } from 'next/server';
import ServerTempFileManager from '@/lib/temp-file-manager';
import { ApiResponse } from '@/types/file-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName } = body;

    if (!fileName) {
      const response: ApiResponse = {
        success: false,
        error: 'fileName 是必填项'
      };
      return NextResponse.json(response, { status: 400 });
    }

    const entry = ServerTempFileManager.loadTempByFileName(fileName);

    if (!entry) {
      const response: ApiResponse = {
        success: false,
        error: '临时文件不存在'
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: entry.id,
        slug: entry.slug,
        fileName: entry.fileName,
        content: entry.content,
        createdAt: entry.createdAt
      }
    };
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error loading temp file:', error);
    const response: ApiResponse = {
      success: false,
      error: '加载临时文件失败',
      message: error.message
    };
    return NextResponse.json(response, { status: 500 });
  }
}