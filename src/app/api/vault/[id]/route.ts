import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, mapVaultItemRow } from '@/db';

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
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid vault item ID' }, { status: 400 });
    }

    const checkRes = await query(
      'SELECT * FROM vault_items WHERE id = $1 AND user_id = $2',
      [itemId, session.userId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Vault item not found' }, { status: 404 });
    }

    const currentItem = checkRes.rows[0];
    const body = await request.json();

    const title = body.title !== undefined ? String(body.title).trim() : currentItem.title;
    const category = body.category !== undefined ? body.category : currentItem.category;
    const username = body.username !== undefined ? String(body.username) : currentItem.username;
    const secretValue = body.secretValue !== undefined ? String(body.secretValue) : currentItem.secret_value;
    const url = body.url !== undefined ? String(body.url) : currentItem.url;
    const notes = body.notes !== undefined ? String(body.notes) : currentItem.notes;
    const tags = body.tags !== undefined ? JSON.stringify(Array.isArray(body.tags) ? body.tags : []) : JSON.stringify(currentItem.tags);
    const isFavorite = body.isFavorite !== undefined ? Boolean(body.isFavorite) : currentItem.is_favorite;

    const updateRes = await query(
      `UPDATE vault_items SET
        title = $1,
        category = $2,
        username = $3,
        secret_value = $4,
        url = $5,
        notes = $6,
        tags = $7,
        is_favorite = $8,
        updated_at = NOW()
      WHERE id = $9 AND user_id = $10
      RETURNING *`,
      [
        title,
        category,
        username,
        secretValue,
        url,
        notes,
        tags,
        isFavorite,
        itemId,
        session.userId,
      ]
    );

    const updatedItem = mapVaultItemRow(updateRes.rows[0]);
    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error('Error updating vault item:', error);
    return NextResponse.json(
      { error: 'Internal server error updating vault item' },
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
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid vault item ID' }, { status: 400 });
    }

    const res = await query(
      'DELETE FROM vault_items WHERE id = $1 AND user_id = $2 RETURNING id',
      [itemId, session.userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Vault item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Vault item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting vault item:', error);
    return NextResponse.json(
      { error: 'Internal server error deleting vault item' },
      { status: 500 }
    );
  }
}
