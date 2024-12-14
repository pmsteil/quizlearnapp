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

-- Sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES "users"(user_id) ON DELETE CASCADE
);

-- Core content tables
-- Topics are the high-level subjects users can learn
CREATE TABLE IF NOT EXISTS "topics" (
    topic_id INTEGER PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT
);

-- Lessons are the individual learning components for each topic
CREATE TABLE IF NOT EXISTS "topic_lessons" (
    lesson_id INTEGER PRIMARY KEY,
    topic_id INTEGER NOT NULL,
    sequence_number INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    UNIQUE(topic_id, sequence_number),
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE
);

-- User learning data
-- Tracks user's engagement with a topic including their learning goal and progress
CREATE TABLE IF NOT EXISTS "user_topics" (
    user_id TEXT NOT NULL,
    topic_id INTEGER NOT NULL,
    current_lesson_id INTEGER,
    goal_text TEXT NOT NULL,
    target_date DATE,
    items_correct INTEGER DEFAULT 0,
    items_incorrect INTEGER DEFAULT 0,
    started_at INTEGER DEFAULT (unixepoch()),
    last_accessed INTEGER,
    PRIMARY KEY (user_id, topic_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE,
    FOREIGN KEY (current_lesson_id) REFERENCES topic_lessons(lesson_id) ON DELETE SET NULL
);

-- Tracks status of each lesson for each user
CREATE TABLE IF NOT EXISTS "user_lesson_progress" (
    user_id TEXT NOT NULL,
    lesson_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'needs_review')),
    completed_at INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (user_id, lesson_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES topic_lessons(lesson_id) ON DELETE CASCADE
);

-- Stores the chat interaction history between user and AI for each lesson
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- New indexes for the updated schema
CREATE INDEX IF NOT EXISTS idx_topics_title ON topics(title);
CREATE INDEX IF NOT EXISTS idx_topic_lessons_topic_seq ON topic_lessons(topic_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_user_topics_last_accessed ON user_topics(last_accessed);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_status ON user_lesson_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_completed ON user_lesson_progress(completed_at);
CREATE INDEX IF NOT EXISTS idx_chat_user_lesson ON user_lesson_chat_history(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON user_lesson_chat_history(created_at);