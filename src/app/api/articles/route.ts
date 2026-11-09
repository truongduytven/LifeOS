import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, mapArticleRow } from '@/db';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove Vietnamese / unicode accents
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const readStatus = searchParams.get('status');
    const search = searchParams.get('q');
    const isFavorite = searchParams.get('favorite');

    let sql = 'SELECT * FROM articles WHERE user_id = $1';
    const params: any[] = [session.userId];

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (readStatus) {
      params.push(readStatus);
      sql += ` AND read_status = $${params.length}`;
    }

    if (isFavorite === 'true') {
      sql += ` AND is_favorite = true`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (title ILIKE $${params.length} OR excerpt ILIKE $${params.length} OR content ILIKE $${params.length})`;
    }

    sql += ' ORDER BY created_at DESC';

    const res = await query(sql, params);
    const articles = res.rows.map(mapArticleRow);

    return NextResponse.json(articles);
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching articles' },
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
      slug: customSlug,
      excerpt = '',
      content = '',
      category = 'General',
      tags = [],
      coverImage = '',
      readingTime: customReadingTime,
      isPublic = false,
      isFavorite = false,
      readStatus = 'unread',
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Article title is required' },
        { status: 400 }
      );
    }

    let slug = customSlug ? slugify(customSlug) : slugify(title);
    if (!slug) {
      slug = 'article-' + Date.now().toString(36);
    }

    // Check slug collision
    const slugCheck = await query('SELECT id FROM articles WHERE slug = $1', [slug]);
    if (slugCheck.rows.length > 0) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const readingTime = customReadingTime || Math.max(1, Math.ceil(words / 200));

    const res = await query(
      `INSERT INTO articles (
        user_id, title, slug, excerpt, content, category, tags, cover_image, reading_time, is_public, is_favorite, read_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *`,
      [
        session.userId,
        title.trim(),
        slug,
        excerpt,
        content,
        category,
        JSON.stringify(Array.isArray(tags) ? tags : []),
        coverImage,
        readingTime,
        Boolean(isPublic),
        Boolean(isFavorite),
        readStatus,
      ]
    );

    const article = mapArticleRow(res.rows[0]);
    return NextResponse.json(article, { status: 201 });
  } catch (error: any) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'Internal server error creating article' },
      { status: 500 }
    );
  }
}
