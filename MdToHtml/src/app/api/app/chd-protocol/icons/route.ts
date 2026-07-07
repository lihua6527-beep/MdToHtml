import { NextResponse } from 'next/server';
import { getAllIcons } from '@/lib/icon-manager';

// 静态导出模式：直接返回所有图标，客户端自行过滤
export async function GET() {
  const icons = getAllIcons();
  
  return NextResponse.json({
    total: icons.length,
    categories: Array.from(new Set(getAllIcons().map(icon => icon.category || 'uncategorized'))),
    icons
  });
}
