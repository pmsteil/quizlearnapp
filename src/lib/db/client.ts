import { createClient } from '@libsql/client';

const url = import.meta.env.VITE_DATABASE_URL;
const authToken = import.meta.env.VITE_DATABASE_TOKEN;

if (!url) throw new Error('DATABASE_URL is not set');
if (!authToken) throw new Error('DATABASE_TOKEN is not set');

export const db = createClient({
  url,
  authToken,
});

// Initialize database schema
export async function initializeDatabase() {
  const schema = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      progress INTEGER DEFAULT 0,
      lesson_plan TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`
  ];

  try {
    // Execute each statement separately
    for (const sql of schema) {
      await db.execute(sql);
    }
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    throw error;
  }
}

// Test the database connection and create schema if needed
export async function testConnection() {
  try {
    // First test the connection
    await db.execute('SELECT 1');

    // Then initialize the schema
    await initializeDatabase();

    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}
