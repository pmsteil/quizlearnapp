CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    progress INTEGER DEFAULT 0,
    lesson_plan TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);
