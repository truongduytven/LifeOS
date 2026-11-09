import { Pool, QueryResult, QueryResultRow } from 'pg';
import {
  mapUserRow,
  mapTaskRow,
  mapTimelineRow,
  mapNoteRow,
  mapArticleRow,
  mapDocumentRow,
  mapVaultItemRow,
} from './schema';
import { DashboardStats, User } from '@/types/lifeos';

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

export function getPool(): Pool {
  if (globalThis._pgPool) {
    return globalThis._pgPool;
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }
  const newPool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  if (process.env.NODE_ENV !== 'production') {
    globalThis._pgPool = newPool;
  }
  return newPool;
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const p = getPool();
    const val = Reflect.get(p, prop, receiver);
    return typeof val === 'function' ? val.bind(p) : val;
  },
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function getUserById(id: number): Promise<User | null> {
  const result = await query(
    'SELECT id, username, display_name, vault_pin_hash, created_at FROM users WHERE id = $1',
    [id]
  );
  if (result.rows.length === 0) return null;
  return mapUserRow(result.rows[0]);
}

export async function getUserByUsername(username: string): Promise<(User & { passwordHash: string; vaultPinHash: string | null }) | null> {
  const result = await query(
    'SELECT id, username, password_hash, display_name, vault_pin_hash, created_at FROM users WHERE username = $1',
    [username]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    ...mapUserRow(row),
    passwordHash: row.password_hash,
    vaultPinHash: row.vault_pin_hash,
  };
}

export async function getDashboardStats(userId: number): Promise<DashboardStats> {
  // 1. Task counts
  const tasksCountRes = await query(
    `SELECT 
       COUNT(*)::int as total,
       COUNT(*) FILTER (WHERE status = 'done')::int as done,
       COUNT(*) FILTER (WHERE status != 'done')::int as pending
     FROM tasks WHERE user_id = $1`,
    [userId]
  );
  const tasksTotal = tasksCountRes.rows[0]?.total ?? 0;
  const tasksDone = tasksCountRes.rows[0]?.done ?? 0;
  const tasksPending = tasksCountRes.rows[0]?.pending ?? 0;

  // 2. Notes count
  const notesCountRes = await query(
    'SELECT COUNT(*)::int as total FROM notes WHERE user_id = $1',
    [userId]
  );
  const notesCount = notesCountRes.rows[0]?.total ?? 0;

  // 3. Articles count
  const articlesCountRes = await query(
    `SELECT 
       COUNT(*)::int as total,
       COUNT(*) FILTER (WHERE read_status = 'unread')::int as unread
     FROM articles WHERE user_id = $1`,
    [userId]
  );
  const articlesCount = articlesCountRes.rows[0]?.total ?? 0;
  const unreadArticlesCount = articlesCountRes.rows[0]?.unread ?? 0;

  // 4. Documents count
  const documentsCountRes = await query(
    'SELECT COUNT(*)::int as total FROM documents WHERE user_id = $1',
    [userId]
  );
  const documentsCount = documentsCountRes.rows[0]?.total ?? 0;

  // 5. Vault items count
  const vaultCountRes = await query(
    'SELECT COUNT(*)::int as total FROM vault_items WHERE user_id = $1',
    [userId]
  );
  const vaultCount = vaultCountRes.rows[0]?.total ?? 0;

  // 6. Timeline count
  const timelineCountRes = await query(
    'SELECT COUNT(*)::int as total FROM timeline_events WHERE user_id = $1',
    [userId]
  );
  const timelineCount = timelineCountRes.rows[0]?.total ?? 0;

  // 7. Recent tasks (top 5 pending or latest)
  const recentTasksRes = await query(
    'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
    [userId]
  );
  const recentTasks = recentTasksRes.rows.map(mapTaskRow);

  // 8. Recent notes (top 5)
  const recentNotesRes = await query(
    'SELECT * FROM notes WHERE user_id = $1 ORDER BY is_pinned DESC, updated_at DESC LIMIT 5',
    [userId]
  );
  const recentNotes = recentNotesRes.rows.map(mapNoteRow);

  // 9. Upcoming timeline events (top 5)
  const upcomingTimelineRes = await query(
    'SELECT * FROM timeline_events WHERE user_id = $1 ORDER BY event_date ASC LIMIT 5',
    [userId]
  );
  const upcomingTimeline = upcomingTimelineRes.rows.map(mapTimelineRow);

  return {
    tasksTotal,
    tasksDone,
    tasksPending,
    notesCount,
    articlesCount,
    unreadArticlesCount,
    documentsCount,
    vaultCount,
    timelineCount,
    recentTasks,
    recentNotes,
    upcomingTimeline,
  };
}

export {
  mapUserRow,
  mapTaskRow,
  mapTimelineRow,
  mapNoteRow,
  mapArticleRow,
  mapDocumentRow,
  mapVaultItemRow,
};
