import { NextRequest, NextResponse } from 'next/server';
import { query, mapArticleRow } from '@/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const res = await query(
      'SELECT a.*, u.display_name as author_name FROM articles a JOIN users u ON a.user_id = u.id WHERE a.slug = $1 AND a.is_public = true',
      [slug]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Article not found or is not public' },
        { status: 404 }
      );
    }

    const article = mapArticleRow(res.rows[0]);
    const author = res.rows[0].author_name;

    return NextResponse.json({
      article: {
        ...article,
        author,
      },
    });
  } catch (error: any) {
    console.error('Error fetching public article:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching article' },
      { status: 500 }
    );
  }
}
