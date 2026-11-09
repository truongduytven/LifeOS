import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

// Read .env if present
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

const CREATE_TABLES_SQL = `
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

async function main() {
  console.log('Connecting to PostgreSQL database...');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    const client = await pool.connect();
    console.log('Database connected successfully.');

    console.log('Creating schema and tables...');
    await client.query(CREATE_TABLES_SQL);
    console.log('Tables verified and created successfully.');

    // Seed initial admin user from environment variables
    const username = process.env.SEED_USERNAME;
    const plainPassword = process.env.SEED_PASSWORD;
    const displayName = process.env.SEED_DISPLAY_NAME;
    const defaultPin = process.env.SEED_VAULT_PIN;

    if (!username || !plainPassword || !displayName || !defaultPin) {
      throw new Error(
        'Missing required seed environment variables: SEED_USERNAME, SEED_PASSWORD, SEED_DISPLAY_NAME, SEED_VAULT_PIN'
      );
    }

    console.log(`Hashing password and vault PIN for user ${username}...`);
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const vaultPinHash = await bcrypt.hash(defaultPin, 10);

    const upsertUserQuery = `
      INSERT INTO users (username, password_hash, display_name, vault_pin_hash, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (username) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          display_name = EXCLUDED.display_name,
          vault_pin_hash = EXCLUDED.vault_pin_hash,
          updated_at = NOW()
      RETURNING id, username, display_name, created_at;
    `;

    const res = await client.query(upsertUserQuery, [
      username,
      passwordHash,
      displayName,
      vaultPinHash,
    ]);

    console.log('Seeded / Verified user:', res.rows[0]);

    // Check count of user's other tables (must not have sample data)
    const userId = res.rows[0].id;
    const taskCount = await client.query('SELECT COUNT(*)::int as count FROM tasks WHERE user_id = $1', [userId]);
    const noteCount = await client.query('SELECT COUNT(*)::int as count FROM notes WHERE user_id = $1', [userId]);
    const articleCount = await client.query('SELECT COUNT(*)::int as count FROM articles WHERE user_id = $1', [userId]);
    console.log(`Current items for user ${username}: tasks=${taskCount.rows[0].count}, notes=${noteCount.rows[0].count}, articles=${articleCount.rows[0].count}`);

    client.release();
    console.log('DB initialization and seed completed successfully!');
  } catch (err) {
    console.error('Error during DB initialization:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
