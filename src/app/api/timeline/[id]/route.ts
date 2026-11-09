import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, mapTimelineRow } from '@/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const checkRes = await query(
      'SELECT * FROM timeline_events WHERE id = $1 AND user_id = $2',
      [eventId, session.userId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Timeline event not found' }, { status: 404 });
    }

    const currentEvent = checkRes.rows[0];
    const body = await request.json();

    const title = body.title !== undefined ? String(body.title).trim() : currentEvent.title;
    const description = body.description !== undefined ? String(body.description) : currentEvent.description;
    const eventDate = body.eventDate !== undefined ? new Date(body.eventDate) : currentEvent.event_date;
    const category = body.category !== undefined ? body.category : currentEvent.category;
    const color = body.color !== undefined ? body.color : currentEvent.color;
    const completed = body.completed !== undefined ? Boolean(body.completed) : currentEvent.completed;

    const updateRes = await query(
      `UPDATE timeline_events SET
        title = $1,
        description = $2,
        event_date = $3,
        category = $4,
        color = $5,
        completed = $6
      WHERE id = $7 AND user_id = $8
      RETURNING *`,
      [
        title,
        description,
        eventDate,
        category,
        color,
        completed,
        eventId,
        session.userId,
      ]
    );

    const updatedEvent = mapTimelineRow(updateRes.rows[0]);
    return NextResponse.json(updatedEvent);
  } catch (error: any) {
    console.error('Error updating timeline event:', error);
    return NextResponse.json(
      { error: 'Internal server error updating timeline event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const res = await query(
      'DELETE FROM timeline_events WHERE id = $1 AND user_id = $2 RETURNING id',
      [eventId, session.userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Timeline event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Timeline event deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting timeline event:', error);
    return NextResponse.json(
      { error: 'Internal server error deleting timeline event' },
      { status: 500 }
    );
  }
}
