import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, mapNoteRow } from '@/db';

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
    const noteId = parseInt(id, 10);
    if (isNaN(noteId)) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
    }

    const checkRes = await query(
      'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
      [noteId, session.userId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const currentNote = checkRes.rows[0];
    const body = await request.json();

    const title = body.title !== undefined ? String(body.title).trim() : currentNote.title;
    const content = body.content !== undefined ? String(body.content) : currentNote.content;
    const color = body.color !== undefined ? body.color : currentNote.color;
    const tags = body.tags !== undefined ? JSON.stringify(Array.isArray(body.tags) ? body.tags : []) : JSON.stringify(currentNote.tags);
    const isPinned = body.isPinned !== undefined ? Boolean(body.isPinned) : currentNote.is_pinned;

    const updateRes = await query(
      `UPDATE notes SET
        title = $1,
        content = $2,
        color = $3,
        tags = $4,
        is_pinned = $5,
        updated_at = NOW()
      WHERE id = $6 AND user_id = $7
      RETURNING *`,
      [
        title,
        content,
        color,
        tags,
        isPinned,
        noteId,
        session.userId,
      ]
    );

    const updatedNote = mapNoteRow(updateRes.rows[0]);
    return NextResponse.json(updatedNote);
  } catch (error: any) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Internal server error updating note' },
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
    const noteId = parseInt(id, 10);
    if (isNaN(noteId)) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
    }

    const res = await query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id',
      [noteId, session.userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Note deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Internal server error deleting note' },
      { status: 500 }
    );
  }
}
