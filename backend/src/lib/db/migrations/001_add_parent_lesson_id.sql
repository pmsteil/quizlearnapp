-- Backup existing data
CREATE TABLE topic_lessons_backup (
    lesson_id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at INTEGER,
    updated_at INTEGER
);

INSERT INTO topic_lessons_backup 
SELECT lesson_id, topic_id, title, content, order_index, created_at, updated_at 
FROM topic_lessons;

-- Drop existing table
DROP TABLE topic_lessons;

-- Recreate with new schema
CREATE TABLE topic_lessons (
    lesson_id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    parent_lesson_id TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_lesson_id) REFERENCES topic_lessons(lesson_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_topic_lessons_topic_id ON topic_lessons(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_lessons_parent_id ON topic_lessons(parent_lesson_id);

-- Restore data
INSERT INTO topic_lessons (lesson_id, topic_id, title, content, order_index, created_at, updated_at)
SELECT lesson_id, topic_id, title, content, order_index, created_at, updated_at
FROM topic_lessons_backup;

-- Drop backup table
DROP TABLE topic_lessons_backup;
