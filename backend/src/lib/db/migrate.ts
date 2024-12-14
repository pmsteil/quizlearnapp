import { db } from './client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
const envPath = path.resolve(process.cwd(), '../../.env');
dotenv.config({ path: envPath });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration(sql: string) {
  console.log('Running SQL:', sql);
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log('Statements to execute:', statements);

  for (const statement of statements) {
    console.log('Executing statement:', statement);
    try {
      await db.execute({
        sql: statement,
        args: []
      });
    } catch (error) {
      // If the error is about a table/column already existing, we can ignore it
      if (error.message?.includes('already exists')) {
        console.log('Ignoring already exists error:', error.message);
        continue;
      }
      throw error;
    }
  }
}

async function migrate() {
  // Create migrations table if it doesn't exist
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER DEFAULT (unixepoch())
    )`,
    args: []
  });

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log('Found migration files:', files);
  console.log('Migrations directory:', migrationsDir);

  // For now, only run migrations 012 and up since the database is already set up
  const newMigrations = files.filter(f => f.startsWith('012_') || f.startsWith('013_'));

  for (const file of newMigrations) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log('Migration SQL:', sql);
    await runMigration(sql);

    // Record migration as applied
    await db.execute({
      sql: 'INSERT INTO migrations (name) VALUES (?)',
      args: [file]
    });
  }

  console.log('Migrations complete!');
}

// Run migrations
migrate().catch(console.error);
