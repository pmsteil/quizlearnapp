CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    text TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_answer INTEGER NOT NULL,
    explanation TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
