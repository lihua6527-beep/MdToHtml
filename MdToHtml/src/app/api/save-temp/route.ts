/**
 * API: 保存临时文件
 * 将内容保存到临时目录，返回临时文件信息（用于预览）
 */
import { NextRequest, NextResponse } from 'next/server';
import ServerTempFileManager from '@/lib/temp-file-manager';
import { ApiResponse } from '@/types/file-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, content } = body;

    if (!slug || !content) {
      const response: ApiResponse = {
        success: false,
        error: 'Slug 和 content 是必填项'
      };
      return NextResponse.json(response, { status: 400 });
    }

    const entry = ServerTempFileManager.saveTemp(slug, content);

    const response: ApiResponse = {
      success: true,
      data: {
        id: entry.id,
        fileName: entry.fileName,
        slug: entry.slug,
        createdAt: entry.createdAt
      }
    };
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error saving temp file:', error);
    const response: ApiResponse = {
      success: false,
      error: '保存临时文件失败',
      message: error.message
    };
    return NextResponse.json(response, { status: 500 });
  }
}