import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, mapNoteRow } from '@/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const search = searchParams.get('q');

    let sql = 'SELECT * FROM notes WHERE user_id = $1';
    const params: any[] = [session.userId];

    if (tag) {
      params.push(JSON.stringify([tag]));
      sql += ` AND tags @> $${params.length}::jsonb`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length})`;
    }

    sql += ' ORDER BY is_pinned DESC, updated_at DESC';

    const res = await query(sql, params);
    const notes = res.rows.map(mapNoteRow);

    return NextResponse.json(notes);
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching notes' },
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
      content = '',
      color = '#ffffff',
      tags = [],
      isPinned = false,
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Note title is required' },
        { status: 400 }
      );
    }

    const res = await query(
      `INSERT INTO notes (
        user_id, title, content, color, tags, is_pinned, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *`,
      [
        session.userId,
        title.trim(),
        content,
        color,
        JSON.stringify(Array.isArray(tags) ? tags : []),
        Boolean(isPinned),
      ]
    );

    const note = mapNoteRow(res.rows[0]);
    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Internal server error creating note' },
      { status: 500 }
    );
  }
}
