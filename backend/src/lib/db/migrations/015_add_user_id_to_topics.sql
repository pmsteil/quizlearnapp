-- migrate:up
ALTER TABLE topics ADD COLUMN user_id TEXT NOT NULL DEFAULT 'system';
ALTER TABLE topics ADD FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);

-- migrate:down
DROP INDEX IF EXISTS idx_topics_user_id;
ALTER TABLE topics DROP COLUMN user_id;
