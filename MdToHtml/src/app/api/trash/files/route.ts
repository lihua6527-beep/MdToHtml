import { NextResponse } from 'next/server';
import TrashManager from '@/lib/trash-manager';

export async function GET() {
  try {
    const files = TrashManager.getFiles();
    return NextResponse.json({ files });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to list trash files', details: error.message },
      { status: 500 }
    );
  }
}
