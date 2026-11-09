import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, mapTimelineRow } from '@/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let sql = 'SELECT * FROM timeline_events WHERE user_id = $1';
    const params: any[] = [session.userId];

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    sql += ' ORDER BY event_date ASC, created_at ASC';

    const res = await query(sql, params);
    const events = res.rows.map(mapTimelineRow);

    return NextResponse.json(events);
  } catch (error: any) {
    console.error('Error fetching timeline events:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching timeline events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description = '',
      eventDate,
      category = 'milestone',
      color = '#3b82f6',
      completed = false,
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Event title is required' },
        { status: 400 }
      );
    }

    if (!eventDate) {
      return NextResponse.json(
        { error: 'Event date is required' },
        { status: 400 }
      );
    }

    const res = await query(
      `INSERT INTO timeline_events (
        user_id, title, description, event_date, category, color, completed, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *`,
      [
        session.userId,
        title.trim(),
        description,
        new Date(eventDate),
        category,
        color,
        Boolean(completed),
      ]
    );

    const event = mapTimelineRow(res.rows[0]);
    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error('Error creating timeline event:', error);
    return NextResponse.json(
      { error: 'Internal server error creating timeline event' },
      { status: 500 }
    );
  }
}
