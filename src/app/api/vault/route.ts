import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, mapVaultItemRow } from '@/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('q');
    const isFavorite = searchParams.get('favorite');

    let sql = 'SELECT * FROM vault_items WHERE user_id = $1';
    const params: any[] = [session.userId];

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (isFavorite === 'true') {
      sql += ' AND is_favorite = true';
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (title ILIKE $${params.length} OR username ILIKE $${params.length} OR notes ILIKE $${params.length} OR url ILIKE $${params.length})`;
    }

    sql += ' ORDER BY is_favorite DESC, created_at DESC';

    const res = await query(sql, params);
    const items = res.rows.map(mapVaultItemRow);

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error fetching vault items:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching vault items' },
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
      category = 'credential',
      username = '',
      secretValue = '',
      url = '',
      notes = '',
      tags = [],
      isFavorite = false,
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Vault item title is required' },
        { status: 400 }
      );
    }

    const res = await query(
      `INSERT INTO vault_items (
        user_id, title, category, username, secret_value, url, notes, tags, is_favorite, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        session.userId,
        title.trim(),
        category,
        username,
        secretValue,
        url,
        notes,
        JSON.stringify(Array.isArray(tags) ? tags : []),
        Boolean(isFavorite),
      ]
    );

    const item = mapVaultItemRow(res.rows[0]);
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Error creating vault item:', error);
    return NextResponse.json(
      { error: 'Internal server error creating vault item' },
      { status: 500 }
    );
  }
}
