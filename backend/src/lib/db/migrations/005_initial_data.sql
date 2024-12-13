INSERT INTO users (id, email, name, password_hash, roles) VALUES
    ('b8e2dbc7-173c-4b09-a543-ba4d5d070845', 'patrick@infranet.com', 'PATRICK STEIL',
     '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'role_admin'),
    ('6a04bc77-0602-45d6-863d-100c03d8e6e0', 'john@infranet.com', 'John User',
     '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'role_user');

INSERT INTO topics (id, user_id, title, description, progress) VALUES
    ('d4cda040-4d73-467f-8f1d-73c91af5ad9b', 'b8e2dbc7-173c-4b09-a543-ba4d5d070845', 'Getting Started with Python',
     'Introduction to Python programming language', 0),
    ('c0a8f9ca-9ba4-4b9c-8757-15e8974a5028', 'b8e2dbc7-173c-4b09-a543-ba4d5d070845', 'Database Design Fundamentals',
     'Learn about database modeling and SQL', 0),
    ('f2b92d14-b50f-4f65-b05d-23e5ac1e9146', 'b8e2dbc7-173c-4b09-a543-ba4d5d070845', 'Web Development Basics',
     'HTML, CSS, and JavaScript fundamentals', 0),
    ('a7b55d9c-8f12-4e3b-8674-e87f7c07476e', '6a04bc77-0602-45d6-863d-100c03d8e6e0', 'Git Version Control',
     'Master the basics of Git and GitHub', 0),
    ('e9d74755-d5ea-4a53-9d67-c3ca7c8450d5', '6a04bc77-0602-45d6-863d-100c03d8e6e0', 'API Development',
     'Building and consuming RESTful APIs', 0);
