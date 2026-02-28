import { NextResponse } from 'next/server';
import TrashManager from '@/lib/trash-manager';

export async function POST(request: Request) {
  try {
    const { files } = await request.json();
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const result = TrashManager.deleteFiles(files);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete files', details: error.message },
      { status: 500 }
    );
  }
}
