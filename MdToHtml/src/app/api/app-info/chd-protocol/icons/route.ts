import { NextResponse } from 'next/server';
import { getAllIcons, getIconsByCategory, searchIcons } from '@/lib/icon-manager';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search');
  
  let icons;
  if (category) {
    icons = getIconsByCategory(category);
  } else if (search) {
    icons = searchIcons(search);
  } else {
    icons = getAllIcons();
  }
  
  return NextResponse.json({
    total: icons.length,
    categories: Array.from(new Set(getAllIcons().map(icon => icon.category || 'uncategorized'))),
    icons
  });
}