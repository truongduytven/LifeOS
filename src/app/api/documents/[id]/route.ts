import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, mapDocumentRow } from '@/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const docId = parseInt(id, 10);
    if (isNaN(docId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const res = await query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [docId, session.userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const doc = mapDocumentRow(res.rows[0]);
    return NextResponse.json(doc);
  } catch (error: any) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching document' },
      { status: 500 }
    );
  }
}

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
    const docId = parseInt(id, 10);
    if (isNaN(docId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const checkRes = await query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [docId, session.userId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const currentDoc = checkRes.rows[0];
    const body = await request.json();

    const title = body.title !== undefined ? String(body.title).trim() : currentDoc.title;
    const description = body.description !== undefined ? String(body.description) : currentDoc.description;
    const category = body.category !== undefined ? String(body.category) : currentDoc.category;
    const fileName = body.fileName !== undefined ? String(body.fileName) : currentDoc.file_name;
    const fileType = body.fileType !== undefined ? String(body.fileType) : currentDoc.file_type;
    const fileSize = body.fileSize !== undefined ? Number(body.fileSize) : currentDoc.file_size;
    const fileData = body.fileData !== undefined ? String(body.fileData) : currentDoc.file_data;
    const externalUrl = body.externalUrl !== undefined ? String(body.externalUrl) : currentDoc.external_url;
    const tags = body.tags !== undefined ? JSON.stringify(Array.isArray(body.tags) ? body.tags : []) : JSON.stringify(currentDoc.tags);
    const isStarred = body.isStarred !== undefined ? Boolean(body.isStarred) : currentDoc.is_starred;

    const updateRes = await query(
      `UPDATE documents SET
        title = $1,
        description = $2,
        category = $3,
        file_name = $4,
        file_type = $5,
        file_size = $6,
        file_data = $7,
        external_url = $8,
        tags = $9,
        is_starred = $10
      WHERE id = $11 AND user_id = $12
      RETURNING *`,
      [
        title,
        description,
        category,
        fileName,
        fileType,
        fileSize,
        fileData,
        externalUrl,
        tags,
        isStarred,
        docId,
        session.userId,
      ]
    );

    const updatedDoc = mapDocumentRow(updateRes.rows[0]);
    return NextResponse.json(updatedDoc);
  } catch (error: any) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Internal server error updating document' },
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
    const docId = parseInt(id, 10);
    if (isNaN(docId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const res = await query(
      'DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id',
      [docId, session.userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Internal server error deleting document' },
      { status: 500 }
    );
  }
}
