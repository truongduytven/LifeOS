import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDashboardStats } from '@/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getDashboardStats(session.userId);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching stats' },
      { status: 500 }
    );
  }
}
