import { NextResponse } from 'next/server';
import TrashManager from '@/lib/trash-manager';

export async function GET() {
  try {
    const stats = TrashManager.getStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get trash stats', details: error.message },
      { status: 500 }
    );
  }
}
