-- CreateTable
CREATE TABLE "_prisma_migrations" (
    "id" TEXT PRIMARY KEY,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "roles" TEXT NOT NULL DEFAULT 'role_user',
    "icon" TEXT,
    "default_difficulty" TEXT NOT NULL DEFAULT 'high_school',
    "about" TEXT,
    "created_at" DATETIME NOT NULL,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "created_at" INTEGER NOT NULL,
    "expires_at" INTEGER NOT NULL,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "topics" (
    "topic_id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "topics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "topic_lessons" (
    "lesson_id" TEXT NOT NULL PRIMARY KEY,
    "topic_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "parent_lesson_id" TEXT,
    "created_at" DATETIME NOT NULL,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "topic_lessons_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics" ("topic_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "topic_lessons_parent_lesson_id_fkey" FOREIGN KEY ("parent_lesson_id") REFERENCES "topic_lessons" ("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_topics" (
    "user_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "current_lesson_id" TEXT,
    "goal_text" TEXT NOT NULL,
    "target_date" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("user_id", "topic_id"),
    CONSTRAINT "user_topics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_topics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics" ("topic_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_topics_current_lesson_id_fkey" FOREIGN KEY ("current_lesson_id") REFERENCES "topic_lessons" ("lesson_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_topic_lessons" (
    "user_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "questions_total" INTEGER NOT NULL DEFAULT 0,
    "questions_correct" INTEGER NOT NULL DEFAULT 0,
    "chat_history" TEXT,
    "last_message_at" DATETIME,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    PRIMARY KEY ("user_id", "topic_id", "lesson_id"),
    CONSTRAINT "user_topic_lessons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_topic_lessons_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics" ("topic_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_topic_lessons_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "topic_lessons" ("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");
CREATE INDEX "topics_user_id_idx" ON "topics"("user_id");
CREATE INDEX "topic_lessons_topic_id_idx" ON "topic_lessons"("topic_id");
CREATE INDEX "topic_lessons_parent_lesson_id_idx" ON "topic_lessons"("parent_lesson_id");
CREATE INDEX "user_topics_user_id_idx" ON "user_topics"("user_id");
CREATE INDEX "user_topics_topic_id_idx" ON "user_topics"("topic_id");
CREATE INDEX "user_topics_last_accessed_idx" ON "user_topics"("last_accessed");
CREATE INDEX "user_topic_lessons_user_id_idx" ON "user_topic_lessons"("user_id");
CREATE INDEX "user_topic_lessons_topic_id_idx" ON "user_topic_lessons"("topic_id");
CREATE INDEX "user_topic_lessons_lesson_id_idx" ON "user_topic_lessons"("lesson_id");
CREATE INDEX "user_topic_lessons_status_idx" ON "user_topic_lessons"("status");
CREATE INDEX "user_topic_lessons_last_message_at_idx" ON "user_topic_lessons"("last_message_at");

-- Insert existing data
INSERT INTO users (user_id, email, name, password_hash, roles, created_at, updated_at)
VALUES ('893e2e28-5e8f-4e7c-9ec5-908b8a8ec9a6', 'patrick@infranet.com', 'PATRICK STEIL',
'$2b$12$UK1GqH/QD1I7XF5ZmEDmGeoJS1As/tMieV2DUB6KVUxm3onKdPaLe', 'role_admin',
datetime('now'), datetime('now'));

INSERT INTO sessions SELECT * FROM (
    SELECT id, user_id, created_at, expires_at FROM sessions
) as temp;

INSERT INTO topics (topic_id, user_id, title, description, progress, created_at, updated_at)
VALUES
('934df8d8-93bd-45b0-8d3c-fcbddb4400e7', '893e2e28-5e8f-4e7c-9ec5-908b8a8ec9a6', 'test', 'test', 0, datetime(1734353417, 'unixepoch'), datetime(1734353417, 'unixepoch')),
('156e297f-c39f-45bc-83ae-fb35c8c36eca', '893e2e28-5e8f-4e7c-9ec5-908b8a8ec9a6', 'TEST1', 'TEST1', 0, datetime(1734357355, 'unixepoch'), datetime(1734357355, 'unixepoch')),
('beb85f68-3dc6-4daf-96a7-109e5381d2e6', '893e2e28-5e8f-4e7c-9ec5-908b8a8ec9a6', 'TEST2', 'TEST2', 0, datetime(1734358246, 'unixepoch'), datetime(1734358246, 'unixepoch')),
('77800a7f-fe40-43af-a2e0-4033bd12e233', '893e2e28-5e8f-4e7c-9ec5-908b8a8ec9a6', 'TEST3', 'TEST3', 0, datetime(1734486929, 'unixepoch'), datetime(1734486929, 'unixepoch'));

INSERT INTO topic_lessons (lesson_id, topic_id, title, content, order_index, parent_lesson_id, created_at, updated_at)
SELECT
    lesson_id, topic_id, title, content, order_index, parent_lesson_id,
    COALESCE(datetime(created_at, 'unixepoch'), datetime('now')) as created_at,
    COALESCE(datetime(updated_at, 'unixepoch'), datetime('now')) as updated_at
FROM topic_lessons;

INSERT INTO user_topics (user_id, topic_id, current_lesson_id, goal_text, target_date, started_at, last_accessed)
SELECT
    user_id, topic_id, current_lesson_id, goal_text,
    CASE
        WHEN target_date IS NOT NULL THEN datetime(target_date, 'unixepoch')
        ELSE NULL
    END as target_date,
    datetime(started_at, 'unixepoch') as started_at,
    datetime(last_accessed, 'unixepoch') as last_accessed
FROM user_topics;
