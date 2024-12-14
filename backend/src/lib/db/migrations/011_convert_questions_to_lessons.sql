-- Convert existing questions into lessons
INSERT INTO topic_lessons (topic_id, title, content, order_index)
SELECT 
    topic_id,
    'Question ' || CAST(ROW_NUMBER() OVER (PARTITION BY topic_id ORDER BY question_id) AS TEXT),
    question_text,
    ROW_NUMBER() OVER (PARTITION BY topic_id ORDER BY question_id) - 1
FROM questions;

-- Convert existing user progress into lesson progress
INSERT INTO user_lesson_progress (user_id, lesson_id, status, last_interaction_at, completed_at)
SELECT 
    up.user_id,
    tl.lesson_id,
    CASE 
        WHEN up.completed_at IS NOT NULL THEN 'completed'
        WHEN up.attempts > 0 THEN 'in_progress'
        ELSE 'not_started'
    END as status,
    COALESCE(up.last_attempt_at, unixepoch()) as last_interaction_at,
    up.completed_at
FROM user_progress up
JOIN questions q ON up.question_id = q.question_id
JOIN topic_lessons tl ON q.topic_id = tl.topic_id 
    AND tl.title = 'Question ' || CAST(ROW_NUMBER() OVER (PARTITION BY q.topic_id ORDER BY q.question_id) AS TEXT);

-- Update user_topics current_lesson
UPDATE user_topics ut
SET current_lesson_id = (
    SELECT MIN(tl.lesson_id)
    FROM topic_lessons tl
    WHERE tl.topic_id = ut.topic_id
    AND NOT EXISTS (
        SELECT 1 
        FROM user_lesson_progress ulp 
        WHERE ulp.user_id = ut.user_id 
        AND ulp.lesson_id = tl.lesson_id 
        AND ulp.status = 'completed'
    )
)
WHERE EXISTS (
    SELECT 1 
    FROM topic_lessons tl 
    WHERE tl.topic_id = ut.topic_id
);

-- Drop old tables
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS questions;
