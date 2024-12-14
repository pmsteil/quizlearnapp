-- Create new users table with user_id instead of id
CREATE TABLE users_new (
    user_id TEXT PRIMARY KEY,
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
INSERT INTO users_new (user_id, email, name, password_hash, roles, created_at, updated_at, failed_attempts, last_failed_attempt)
SELECT id, email, name, password_hash, roles, created_at, updated_at, failed_attempts, last_failed_attempt FROM users;

-- Update foreign key references in topics table
CREATE TABLE topics_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    progress INTEGER DEFAULT 0,
    lesson_plan TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users_new(user_id)
);

-- Copy topics data
INSERT INTO topics_new SELECT * FROM topics;

-- Update foreign key references in user_progress table
CREATE TABLE user_progress_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users_new(user_id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Copy user_progress data
INSERT INTO user_progress_new SELECT * FROM user_progress;

-- Update foreign key references in sessions table
CREATE TABLE sessions_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users_new(user_id) ON DELETE CASCADE
);

-- Copy sessions data
INSERT INTO sessions_new SELECT * FROM sessions;

-- Drop old tables
DROP TABLE sessions;
DROP TABLE user_progress;
DROP TABLE topics;
DROP TABLE users;

-- Rename new tables
ALTER TABLE users_new RENAME TO users;
ALTER TABLE topics_new RENAME TO topics;
ALTER TABLE user_progress_new RENAME TO user_progress;
ALTER TABLE sessions_new RENAME TO sessions;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_topic_id ON user_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_question_id ON user_progress(question_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
