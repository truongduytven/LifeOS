import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db';
import { cleanOptionalText } from '@/db/schema';

interface PublicArticleSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage: string;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  author: string;
}

function parseTags(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map((item) => String(item));
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function formatIsoDate(val: unknown): string {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString();
  try {
    return new Date(String(val)).toISOString();
  } catch {
    return '';
  }
}

function parseClampedInt(raw: string | null, fallback: number, min: number, max?: number): number {
  if (raw === null || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  const lowerBounded = Math.max(min, parsed);
  return max !== undefined ? Math.min(max, lowerBounded) : lowerBounded;
}

function escapeIlikePattern(input: string): string {
  return input.replace(/[\\%_]/g, '\\$&');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const category = (searchParams.get('category') || '').trim();
    const limit = parseClampedInt(searchParams.get('limit'), 24, 1, 50);
    const offset = parseClampedInt(searchParams.get('offset'), 0, 0);

    const whereConditions: string[] = ['a.is_public = true'];
    const filterParams: unknown[] = [];

    if (category && category !== 'Tất cả') {
      filterParams.push(category);
      whereConditions.push(`a.category = $${filterParams.length}`);
    }

    if (q) {
      const escapedQ = escapeIlikePattern(q);
      filterParams.push(`%${escapedQ}%`);
      const idx = filterParams.length;
      whereConditions.push(
        `(a.title ILIKE $${idx} ESCAPE '\\' OR a.excerpt ILIKE $${idx} ESCAPE '\\' OR a.tags::text ILIKE $${idx} ESCAPE '\\')`
      );
    }

    const whereClause = whereConditions.join(' AND ');

    const listParams = [...filterParams, limit, offset];
    const limitIdx = filterParams.length + 1;
    const offsetIdx = filterParams.length + 2;

    const articlesSql = `
      SELECT
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a.category,
        a.tags,
        a.cover_image,
        a.reading_time,
        a.created_at,
        a.updated_at,
        u.display_name AS author_name
      FROM articles a
      JOIN users u ON a.user_id = u.id
      WHERE ${whereClause}
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM articles a
      JOIN users u ON a.user_id = u.id
      WHERE ${whereClause}
    `;

    const categoriesSql = `
      SELECT DISTINCT category
      FROM articles
      WHERE is_public = true AND category IS NOT NULL AND TRIM(category) <> ''
      ORDER BY category ASC
    `;

    const [articlesRes, countRes, categoriesRes] = await Promise.all([
      query(articlesSql, listParams),
      query<{ total: number }>(countSql, filterParams),
      query<{ category: string }>(categoriesSql),
    ]);

    const articles: PublicArticleSummary[] = articlesRes.rows.map((row) => ({
      id: Number(row.id),
      title: String(row.title || ''),
      slug: String(row.slug || ''),
      excerpt: cleanOptionalText(row.excerpt),
      category: String(row.category || 'Chung'),
      tags: parseTags(row.tags),
      coverImage: cleanOptionalText(row.cover_image),
      readingTime: Number(row.reading_time || 1),
      createdAt: formatIsoDate(row.created_at),
      updatedAt: formatIsoDate(row.updated_at),
      author: String(row.author_name || 'Tác giả'),
    }));

    const total = Number(countRes.rows[0]?.total ?? 0);
    const categories = categoriesRes.rows
      .map((row) => String(row.category).trim())
      .filter(Boolean);

    return NextResponse.json({
      articles,
      total,
      categories,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching public articles:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching public articles' },
      { status: 500 }
    );
  }
}
