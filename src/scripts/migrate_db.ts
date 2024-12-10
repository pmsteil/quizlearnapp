import { db, initializeDb } from '../lib/db/client';
import { debug } from '../lib/utils/debug';

async function runMigration() {
  try {
    debug.log('Initializing database connection...');
    await initializeDb();

    debug.log('Running database migrations...');

    // Check if role column exists
    const tableInfo = await db.execute(`
      SELECT name FROM pragma_table_info('users') WHERE name='role'
    `);

    if (!tableInfo.rows?.length) {
      debug.log('Adding role column to users table...');
      await db.execute(`
        ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'role_user'
      `);
    } else {
      debug.log('Role column already exists');
    }

    // Update admin user
    debug.log('Setting admin role...');
    await db.execute(`
      UPDATE users
      SET role = 'role_admin'
      WHERE email = 'patrick@infranet.com'
    `);

    debug.log('Migrations completed successfully');

    // Verify the changes
    const result = await db.execute(`
      SELECT id, email, role FROM users WHERE email = 'patrick@infranet.com'
    `);
    debug.log('Admin user status:', result.rows?.[0]);

  } catch (error) {
    debug.error('Migration failed:', error);
    process.exit(1);
  }
}

debug.log('Starting migration process...');
runMigration()
  .then(() => {
    debug.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    debug.error('Migration failed:', error);
    process.exit(1);
  });
