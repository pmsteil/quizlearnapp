import { db } from '../src/lib/db';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load test environment
config({ path: path.join(process.cwd(), '.env.test') });

async function setupTestDb() {
  try {
    // Read schema file
    const schema = fs.readFileSync(path.join(process.cwd(), 'src/lib/db/schema.sql'), 'utf8');
    
    // Split into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Execute each statement
    for (const sql of statements) {
      await db.execute({ sql: sql + ';' });
    }
    
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  }
}

setupTestDb();
