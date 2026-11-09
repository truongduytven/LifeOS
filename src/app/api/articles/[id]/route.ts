import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, mapArticleRow } from '@/db';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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
    const articleId = parseInt(id, 10);
    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    const res = await query(
      'SELECT * FROM articles WHERE id = $1 AND user_id = $2',
      [articleId, session.userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const article = mapArticleRow(res.rows[0]);
    return NextResponse.json(article);
  } catch (error: any) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching article' },
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
    const articleId = parseInt(id, 10);
    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    const checkRes = await query(
      'SELECT * FROM articles WHERE id = $1 AND user_id = $2',
      [articleId, session.userId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const currentArticle = checkRes.rows[0];
    const body = await request.json();

    const title = body.title !== undefined ? String(body.title).trim() : currentArticle.title;
    let slug = currentArticle.slug;
    if (body.slug !== undefined && body.slug !== currentArticle.slug) {
      const candidateSlug = slugify(body.slug);
      const slugCheck = await query(
        'SELECT id FROM articles WHERE slug = $1 AND id != $2',
        [candidateSlug, articleId]
      );
      if (slugCheck.rows.length > 0) {
        slug = `${candidateSlug}-${Date.now().toString(36)}`;
      } else {
        slug = candidateSlug;
      }
    }

    const excerpt = body.excerpt !== undefined ? String(body.excerpt) : currentArticle.excerpt;
    const content = body.content !== undefined ? String(body.content) : currentArticle.content;
    const category = body.category !== undefined ? String(body.category) : currentArticle.category;
    const tags = body.tags !== undefined ? JSON.stringify(Array.isArray(body.tags) ? body.tags : []) : JSON.stringify(currentArticle.tags);
    const coverImage = body.coverImage !== undefined ? String(body.coverImage) : currentArticle.cover_image;
    
    let readingTime = currentArticle.reading_time;
    if (body.readingTime !== undefined) {
      readingTime = Number(body.readingTime);
    } else if (body.content !== undefined) {
      const words = content.trim().split(/\s+/).filter(Boolean).length;
      readingTime = Math.max(1, Math.ceil(words / 200));
    }

    const isPublic = body.isPublic !== undefined ? Boolean(body.isPublic) : currentArticle.is_public;
    const isFavorite = body.isFavorite !== undefined ? Boolean(body.isFavorite) : currentArticle.is_favorite;
    const readStatus = body.readStatus !== undefined ? body.readStatus : currentArticle.read_status;

    const updateRes = await query(
      `UPDATE articles SET
        title = $1,
        slug = $2,
        excerpt = $3,
        content = $4,
        category = $5,
        tags = $6,
        cover_image = $7,
        reading_time = $8,
        is_public = $9,
        is_favorite = $10,
        read_status = $11,
        updated_at = NOW()
      WHERE id = $12 AND user_id = $13
      RETURNING *`,
      [
        title,
        slug,
        excerpt,
        content,
        category,
        tags,
        coverImage,
        readingTime,
        isPublic,
        isFavorite,
        readStatus,
        articleId,
        session.userId,
      ]
    );

    const updatedArticle = mapArticleRow(updateRes.rows[0]);
    return NextResponse.json(updatedArticle);
  } catch (error: any) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: 'Internal server error updating article' },
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
    const articleId = parseInt(id, 10);
    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    const res = await query(
      'DELETE FROM articles WHERE id = $1 AND user_id = $2 RETURNING id',
      [articleId, session.userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Article deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: 'Internal server error deleting article' },
      { status: 500 }
    );
  }
}
