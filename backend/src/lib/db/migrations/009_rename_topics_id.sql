-- Rename topics.id to topics.topic_id
ALTER TABLE topics RENAME COLUMN id TO topic_id;

-- Drop existing foreign key constraints and indexes
DROP INDEX IF EXISTS idx_questions_topic_id;
DROP INDEX IF EXISTS idx_user_progress_topic_id;

-- Recreate the indexes with the new column name
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_topic_id ON user_progress(topic_id);

-- Note: SQLite doesn't support renaming columns referenced by foreign keys
-- So we need to recreate the tables that reference topics

-- 1. Create temporary questions table
CREATE TABLE questions_new (
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

-- Copy data to new questions table
INSERT INTO questions_new SELECT * FROM questions;

-- Drop old questions table and rename new one
DROP TABLE questions;
ALTER TABLE questions_new RENAME TO questions;

-- 2. Create temporary user_progress table
CREATE TABLE user_progress_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Copy data to new user_progress table
INSERT INTO user_progress_new SELECT * FROM user_progress;

-- Drop old user_progress table and rename new one
DROP TABLE user_progress;
ALTER TABLE user_progress_new RENAME TO user_progress;

-- Recreate all indexes for user_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_topic_id ON user_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_question_id ON user_progress(question_id);
