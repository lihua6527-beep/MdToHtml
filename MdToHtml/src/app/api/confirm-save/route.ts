/**
 * API: 确认保存（临时文件转正）
 * 将临时文件内容写入正式目录（input/），并删除临时文件
 * 支持重命名：如果提供了 slug，则用新的 slug 保存
 */
import { NextRequest, NextResponse } from 'next/server';
import ServerTempFileManager from '@/lib/temp-file-manager';
import { ApiResponse } from '@/types/file-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, slug: customSlug } = body;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: '临时文件 ID 是必填项'
      };
      return NextResponse.json(response, { status: 400 });
    }

    const result = ServerTempFileManager.confirmSave(id, customSlug);

    const response: ApiResponse = {
      success: result.success,
      data: { slug: result.slug },
      error: result.error
    };
    
    const statusCode = result.success ? 200 : 400;
    return NextResponse.json(response, { status: statusCode });
  } catch (error: any) {
    console.error('Error confirming temp file save:', error);
    const response: ApiResponse = {
      success: false,
      error: '确认保存失败',
      message: error.message
    };
    return NextResponse.json(response, { status: 500 });
  }
}