import { NextResponse } from 'next/server';
import TrashManager from '@/lib/trash-manager';

export async function POST() {
  try {
    TrashManager.emptyTrash();
    return NextResponse.json({ success: true, message: 'Trash emptied successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to empty trash', details: error.message },
      { status: 500 }
    );
  }
}
