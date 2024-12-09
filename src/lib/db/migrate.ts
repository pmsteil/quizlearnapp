import { db } from './client';
import fs from 'fs';
import path from 'path';

async function runMigration(sql: string) {
  console.log('Running SQL:', sql);
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log('Statements to execute:', statements);

  for (const statement of statements) {
    console.log('Executing statement:', statement);
    await db.execute({
      sql: statement,
      args: []
    });
  }
}

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log('Found migration files:', files);
  console.log('Migrations directory:', migrationsDir);

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log('Migration SQL:', sql);
    await runMigration(sql);
  }

  console.log('Migrations complete!');
}

// Run migrations
migrate().catch(console.error);
