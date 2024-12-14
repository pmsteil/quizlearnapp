-- Create a new users table with proper column names
CREATE TABLE IF NOT EXISTS users_new (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    roles TEXT NOT NULL DEFAULT 'role_user',
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    failed_attempts INTEGER DEFAULT 0,
    last_failed_attempt INTEGER DEFAULT NULL
);

-- Copy data from old table to new table
INSERT INTO users_new (id, email, name, password_hash, roles, created_at, updated_at, failed_attempts, last_failed_attempt)
SELECT i, e, n, p, r, c, u, f, l FROM users;

-- Drop the old table
DROP TABLE users;

-- Rename the new table to users
ALTER TABLE users_new RENAME TO users;

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
