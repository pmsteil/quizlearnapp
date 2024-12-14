-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
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

-- Topics table
CREATE TABLE IF NOT EXISTS "topics" (
    topic_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    progress INTEGER DEFAULT 0,
    lesson_plan TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES "users"(user_id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES "users"(user_id) ON DELETE CASCADE
);

-- Questions table
CREATE TABLE IF NOT EXISTS "questions" (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    text TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_answer INTEGER NOT NULL,
    explanation TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE
);

-- User progress table
CREATE TABLE IF NOT EXISTS "user_progress" (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_topic_id ON user_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_question_id ON user_progress(question_id);