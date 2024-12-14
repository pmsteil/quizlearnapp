-- migrate:up
ALTER TABLE topics RENAME COLUMN id TO topic_id;

-- migrate:down
ALTER TABLE topics RENAME COLUMN topic_id TO id;
