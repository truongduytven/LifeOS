import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, mapDocumentRow } from '@/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isStarred = searchParams.get('starred');
    const search = searchParams.get('q');
    const tag = searchParams.get('tag');

    let sql = 'SELECT * FROM documents WHERE user_id = $1';
    const params: any[] = [session.userId];

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (isStarred === 'true') {
      sql += ' AND is_starred = true';
    }

    if (tag) {
      params.push(JSON.stringify([tag]));
      sql += ` AND tags @> $${params.length}::jsonb`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length} OR file_name ILIKE $${params.length})`;
    }

    sql += ' ORDER BY is_starred DESC, created_at DESC';

    const res = await query(sql, params);
    const documents = res.rows.map(mapDocumentRow);

    return NextResponse.json(documents);
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching documents' },
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
      category = 'General',
      fileName = '',
      fileType = '',
      fileSize = 0,
      fileData = '',
      externalUrl = '',
      tags = [],
      isStarred = false,
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Document title is required' },
        { status: 400 }
      );
    }

    const res = await query(
      `INSERT INTO documents (
        user_id, title, description, category, file_name, file_type, file_size, file_data, external_url, tags, is_starred, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *`,
      [
        session.userId,
        title.trim(),
        description,
        category,
        fileName,
        fileType,
        Number(fileSize) || 0,
        fileData,
        externalUrl,
        JSON.stringify(Array.isArray(tags) ? tags : []),
        Boolean(isStarred),
      ]
    );

    const doc = mapDocumentRow(res.rows[0]);
    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Internal server error creating document' },
      { status: 500 }
    );
  }
}
