-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    roles TEXT NOT NULL DEFAULT 'role_user',
    created_at INTEGER,
    updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Topics and Lessons
CREATE TABLE IF NOT EXISTS topics (
    topic_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    progress INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);

CREATE TABLE IF NOT EXISTS topic_lessons (
    lesson_id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at INTEGER,
    updated_at INTEGER,
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_topic_lessons_topic_id ON topic_lessons(topic_id);

-- User Topics
CREATE TABLE IF NOT EXISTS user_topics (
    user_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    current_lesson_id TEXT,
    goal_text TEXT NOT NULL,
    target_date DATE,
    started_at INTEGER DEFAULT (unixepoch()),
    last_accessed INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (user_id, topic_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE,
    FOREIGN KEY (current_lesson_id) REFERENCES topic_lessons(lesson_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_topics_user_id ON user_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_topics_topic_id ON user_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_topics_last_accessed ON user_topics(last_accessed);

-- Initial Users
INSERT INTO users (user_id, email, name, password_hash, roles, created_at, updated_at) VALUES
    ('b8e2dbc7-173c-4b09-a543-ba4d5d070845', 'patrick@infranet.com', 'PATRICK STEIL',
     '$2b$12$PK9wV8O7cnwudqQ2pSBszu5IzHDQGcUfl6b7Uh.78CWX44PeHSsqe', 'role_admin',
     strftime('%s', 'now'), strftime('%s', 'now')),
    ('6a04bc77-0602-45d6-863d-100c03d8e6e0', 'john@infranet.com', 'John User',
     '$2b$12$PK9wV8O7cnwudqQ2pSBszu5IzHDQGcUfl6b7Uh.78CWX44PeHSsqe', 'role_user',
     strftime('%s', 'now'), strftime('%s', 'now')),
    ('test', 'test@example.com', 'Test User',
     '$2b$12$PK9wV8O7cnwudqQ2pSBszu5IzHDQGcUfl6b7Uh.78CWX44PeHSsqe', 'role_user',
     strftime('%s', 'now'), strftime('%s', 'now'));