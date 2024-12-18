-- This is an empty migration that marks the current database state as the baseline
-- CreateTable
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT PRIMARY KEY,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
);

-- Convert timestamps if needed
UPDATE users SET 
    created_at = datetime(created_at, 'unixepoch'),
    updated_at = datetime(updated_at, 'unixepoch')
WHERE typeof(created_at) = 'integer';

UPDATE topics SET 
    created_at = datetime(created_at, 'unixepoch'),
    updated_at = datetime(updated_at, 'unixepoch')
WHERE typeof(created_at) = 'integer';

UPDATE topic_lessons SET 
    created_at = datetime(created_at, 'unixepoch'),
    updated_at = datetime(updated_at, 'unixepoch')
WHERE typeof(created_at) = 'integer';

UPDATE user_topics SET 
    target_date = datetime(target_date, 'unixepoch'),
    started_at = datetime(started_at, 'unixepoch'),
    last_accessed = datetime(last_accessed, 'unixepoch')
WHERE typeof(started_at) = 'integer';
