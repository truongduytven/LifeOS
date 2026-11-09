import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, mapTaskRow } from '@/db';

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
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const checkRes = await query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, session.userId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const currentTask = checkRes.rows[0];
    const body = await request.json();

    const title = body.title !== undefined ? String(body.title).trim() : currentTask.title;
    const description = body.description !== undefined ? String(body.description) : currentTask.description;
    const status = body.status !== undefined ? body.status : currentTask.status;
    const priority = body.priority !== undefined ? body.priority : currentTask.priority;
    const dueDate = body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : currentTask.due_date;
    const tags = body.tags !== undefined ? JSON.stringify(Array.isArray(body.tags) ? body.tags : []) : JSON.stringify(currentTask.tags);
    const subtasks = body.subtasks !== undefined ? JSON.stringify(Array.isArray(body.subtasks) ? body.subtasks : []) : JSON.stringify(currentTask.subtasks);

    let completedAt = currentTask.completed_at;
    if (body.completedAt !== undefined) {
      completedAt = body.completedAt ? new Date(body.completedAt) : null;
    } else if (body.status !== undefined) {
      if (body.status === 'done' && currentTask.status !== 'done') {
        completedAt = new Date();
      } else if (body.status !== 'done' && currentTask.status === 'done') {
        completedAt = null;
      }
    }

    const updateRes = await query(
      `UPDATE tasks SET
        title = $1,
        description = $2,
        status = $3,
        priority = $4,
        due_date = $5,
        tags = $6,
        subtasks = $7,
        completed_at = $8,
        updated_at = NOW()
      WHERE id = $9 AND user_id = $10
      RETURNING *`,
      [
        title,
        description,
        status,
        priority,
        dueDate,
        tags,
        subtasks,
        completedAt,
        taskId,
        session.userId,
      ]
    );

    const updatedTask = mapTaskRow(updateRes.rows[0]);
    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Internal server error updating task' },
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
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const res = await query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [taskId, session.userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Internal server error deleting task' },
      { status: 500 }
    );
  }
}
