-- Create users table
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

-- Create sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES "users"(user_id) ON DELETE CASCADE
);

-- Create topics table
CREATE TABLE IF NOT EXISTS "topics" (
    topic_id INTEGER PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- Create user_topics table
CREATE TABLE IF NOT EXISTS "user_topics" (
    user_id TEXT NOT NULL,
    topic_id INTEGER NOT NULL,
    current_lesson_id INTEGER,
    goal_text TEXT NOT NULL,
    target_date DATE,
    started_at INTEGER DEFAULT (unixepoch()),
    last_accessed INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (user_id, topic_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE,
    FOREIGN KEY (current_lesson_id) REFERENCES topic_lessons(lesson_id) ON DELETE SET NULL
);

-- Create user_lesson_chat_history table
CREATE TABLE IF NOT EXISTS "user_lesson_chat_history" (
    chat_id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    topic_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    is_user_message BOOLEAN NOT NULL,
    message_text TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES topic_lessons(lesson_id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_topics_title ON topics(title);
CREATE INDEX IF NOT EXISTS idx_user_topics_last_accessed ON user_topics(last_accessed);
CREATE INDEX IF NOT EXISTS idx_chat_user_lesson ON user_lesson_chat_history(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON user_lesson_chat_history(created_at);
