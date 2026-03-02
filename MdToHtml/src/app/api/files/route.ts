import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/posts';
import { ApiResponse, FileItem } from '@/types/file-system';

// export const dynamic = 'force-dynamic'; // 注释掉，因为静态导出不支持

export async function GET() {
  try {
    const posts = getAllPosts();
    const response: ApiResponse<FileItem[]> = {
      success: true,
      data: posts,
      meta: {
        total: posts.length,
        timestamp: Date.now()
      }
    };
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error reading posts:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to list files',
      message: error.message
    };
    return NextResponse.json(response, { status: 500 });
  }
}
