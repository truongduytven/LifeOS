import {
  User,
  Task,
  TimelineEvent,
  Note,
  Article,
  DocumentItem,
  VaultItem,
  SubTask,
} from '@/types/lifeos';

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  vault_pin_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  status VARCHAR(50) DEFAULT 'todo',
  priority VARCHAR(50) DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  tags JSONB DEFAULT '[]'::jsonb,
  subtasks JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  category VARCHAR(50) DEFAULT 'milestone',
  color VARCHAR(50) DEFAULT '#3b82f6',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT DEFAULT '',
  color VARCHAR(50) DEFAULT '#ffffff',
  tags JSONB DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT DEFAULT '',
  content TEXT DEFAULT '',
  category VARCHAR(100) DEFAULT 'General',
  tags JSONB DEFAULT '[]'::jsonb,
  cover_image TEXT DEFAULT '',
  reading_time INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  read_status VARCHAR(50) DEFAULT 'unread',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  category VARCHAR(100) DEFAULT 'General',
  file_name VARCHAR(255) DEFAULT '',
  file_type VARCHAR(100) DEFAULT '',
  file_size INTEGER DEFAULT 0,
  file_data TEXT DEFAULT '',
  external_url TEXT DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  is_starred BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vault_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'credential',
  username VARCHAR(255) DEFAULT '',
  secret_value TEXT DEFAULT '',
  url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_timeline_events_user_id ON timeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events(event_date);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON vault_items(user_id);
`;

function parseJsonArray<T>(val: any, fallback: T[] = []): T[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function formatDate(val: any): string {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString();
  return new Date(val).toISOString();
}

function formatDateNullable(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  try {
    return new Date(val).toISOString();
  } catch {
    return null;
  }
}

export function mapUserRow(row: any): User {
  return {
    id: Number(row.id),
    username: String(row.username),
    displayName: String(row.display_name),
    hasVaultPin: Boolean(row.vault_pin_hash),
    createdAt: formatDate(row.created_at),
  };
}

export function mapTaskRow(row: any): Task {
  return {
    id: Number(row.id),
    title: String(row.title),
    description: String(row.description || ''),
    status: row.status as 'todo' | 'in_progress' | 'done',
    priority: row.priority as 'low' | 'medium' | 'high' | 'urgent',
    dueDate: formatDateNullable(row.due_date),
    tags: parseJsonArray<string>(row.tags),
    subtasks: parseJsonArray<SubTask>(row.subtasks),
    completedAt: formatDateNullable(row.completed_at),
    createdAt: formatDate(row.created_at),
    updatedAt: formatDate(row.updated_at),
  };
}

export function mapTimelineRow(row: any): TimelineEvent {
  return {
    id: Number(row.id),
    title: String(row.title),
    description: String(row.description || ''),
    eventDate: formatDate(row.event_date),
    category: row.category as 'milestone' | 'work' | 'personal' | 'idea' | 'achievement',
    color: String(row.color || '#3b82f6'),
    completed: Boolean(row.completed),
    createdAt: formatDate(row.created_at),
  };
}

export function mapNoteRow(row: any): Note {
  return {
    id: Number(row.id),
    title: String(row.title),
    content: String(row.content || ''),
    color: String(row.color || '#ffffff'),
    tags: parseJsonArray<string>(row.tags),
    isPinned: Boolean(row.is_pinned),
    createdAt: formatDate(row.created_at),
    updatedAt: formatDate(row.updated_at),
  };
}

export function mapArticleRow(row: any): Article {
  return {
    id: Number(row.id),
    title: String(row.title),
    slug: String(row.slug),
    excerpt: String(row.excerpt || ''),
    content: String(row.content || ''),
    category: String(row.category || 'General'),
    tags: parseJsonArray<string>(row.tags),
    coverImage: String(row.cover_image || ''),
    readingTime: Number(row.reading_time || 1),
    isPublic: Boolean(row.is_public),
    isFavorite: Boolean(row.is_favorite),
    readStatus: row.read_status as 'unread' | 'reading' | 'completed',
    createdAt: formatDate(row.created_at),
    updatedAt: formatDate(row.updated_at),
  };
}

export function mapDocumentRow(row: any): DocumentItem {
  return {
    id: Number(row.id),
    title: String(row.title),
    description: String(row.description || ''),
    category: String(row.category || 'General'),
    fileName: String(row.file_name || ''),
    fileType: String(row.file_type || ''),
    fileSize: Number(row.file_size || 0),
    fileData: String(row.file_data || ''),
    externalUrl: String(row.external_url || ''),
    tags: parseJsonArray<string>(row.tags),
    isStarred: Boolean(row.is_starred),
    createdAt: formatDate(row.created_at),
  };
}

export function mapVaultItemRow(row: any): VaultItem {
  return {
    id: Number(row.id),
    title: String(row.title),
    category: row.category as 'credential' | 'api_key' | 'secure_note' | 'card' | 'document',
    username: String(row.username || ''),
    secretValue: String(row.secret_value || ''),
    url: String(row.url || ''),
    notes: String(row.notes || ''),
    tags: parseJsonArray<string>(row.tags),
    isFavorite: Boolean(row.is_favorite),
    createdAt: formatDate(row.created_at),
    updatedAt: formatDate(row.updated_at),
  };
}
