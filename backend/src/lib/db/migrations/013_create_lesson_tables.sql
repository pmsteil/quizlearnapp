-- Create topic_lessons table
CREATE TABLE IF NOT EXISTS "topic_lessons" (
    lesson_id INTEGER PRIMARY KEY,
    topic_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(topic_id, order_index),
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE
);

-- Create user_lesson_progress table
CREATE TABLE IF NOT EXISTS "user_lesson_progress" (
    progress_id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    lesson_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
    last_interaction_at INTEGER NOT NULL DEFAULT (unixepoch()),
    completed_at INTEGER,
    UNIQUE(user_id, lesson_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES topic_lessons(lesson_id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_topic_lessons_topic ON topic_lessons(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_lessons_order ON topic_lessons(topic_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson ON user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_status ON user_lesson_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_completed ON user_lesson_progress(completed_at);
