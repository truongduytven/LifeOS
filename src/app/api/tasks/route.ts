import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, mapTaskRow } from '@/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const tag = searchParams.get('tag');

    let sql = 'SELECT * FROM tasks WHERE user_id = $1';
    const params: any[] = [session.userId];

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (priority) {
      params.push(priority);
      sql += ` AND priority = $${params.length}`;
    }

    if (tag) {
      params.push(JSON.stringify([tag]));
      sql += ` AND tags @> $${params.length}::jsonb`;
    }

    sql += ` ORDER BY 
      CASE WHEN status = 'done' THEN 1 ELSE 0 END,
      CASE priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
        ELSE 5 
      END,
      due_date ASC NULLS LAST,
      created_at DESC`;

    const res = await query(sql, params);
    const tasks = res.rows.map(mapTaskRow);

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching tasks' },
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
      status = 'todo',
      priority = 'medium',
      dueDate = null,
      tags = [],
      subtasks = [],
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    const completedAt = status === 'done' ? new Date().toISOString() : null;

    const res = await query(
      `INSERT INTO tasks (
        user_id, title, description, status, priority, due_date, tags, subtasks, completed_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        session.userId,
        title.trim(),
        description,
        status,
        priority,
        dueDate ? new Date(dueDate) : null,
        JSON.stringify(Array.isArray(tags) ? tags : []),
        JSON.stringify(Array.isArray(subtasks) ? subtasks : []),
        completedAt ? new Date(completedAt) : null,
      ]
    );

    const task = mapTaskRow(res.rows[0]);
    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Internal server error creating task' },
      { status: 500 }
    );
  }
}
