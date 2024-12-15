-- migrate:up

-- Insert initial users
INSERT OR REPLACE INTO users (user_id, email, name, password_hash, roles, created_at, updated_at) VALUES
    ('b8e2dbc7-173c-4b09-a543-ba4d5d070845', 'patrick@infranet.com', 'PATRICK STEIL',
     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpwBAHHKQS.6YK', 'role_admin',
     strftime('%s', 'now'), strftime('%s', 'now')),
    ('6a04bc77-0602-45d6-863d-100c03d8e6e0', 'john@infranet.com', 'John User',
     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpwBAHHKQS.6YK', 'role_user',
     strftime('%s', 'now'), strftime('%s', 'now')),
    ('test', 'test@example.com', 'Test User',
     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpwBAHHKQS.6YK', 'role_user',
     strftime('%s', 'now'), strftime('%s', 'now'));

-- Insert initial topics
INSERT OR REPLACE INTO topics (topic_id, user_id, title, description, progress, created_at, updated_at) VALUES
    ('d4cda040-4d73-467f-8f1d-73c91af5ad9b', 'b8e2dbc7-173c-4b09-a543-ba4d5d070845', 'Getting Started with Python',
     'Introduction to Python programming language', 0, strftime('%s', 'now'), strftime('%s', 'now')),
    ('c0a8f9ca-9ba4-4b9c-8757-15e8974a5028', 'b8e2dbc7-173c-4b09-a543-ba4d5d070845', 'Database Design Fundamentals',
     'Learn about database modeling and SQL', 0, strftime('%s', 'now'), strftime('%s', 'now')),
    ('f2b92d14-b50f-4f65-b05d-23e5ac1e9146', 'b8e2dbc7-173c-4b09-a543-ba4d5d070845', 'Web Development Basics',
     'HTML, CSS, and JavaScript fundamentals', 0, strftime('%s', 'now'), strftime('%s', 'now')),
    ('a7b55d9c-8f12-4e3b-8674-e87f7c07476e', '6a04bc77-0602-45d6-863d-100c03d8e6e0', 'Git Version Control',
     'Master the basics of Git and GitHub', 0, strftime('%s', 'now'), strftime('%s', 'now')),
    ('e9d74755-d5ea-4a53-9d67-c3ca7c8450d5', '6a04bc77-0602-45d6-863d-100c03d8e6e0', 'API Development',
     'Building and consuming RESTful APIs', 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- migrate:down

DELETE FROM topics;
DELETE FROM users;
