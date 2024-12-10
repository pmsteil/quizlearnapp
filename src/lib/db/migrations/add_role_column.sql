-- Add role column with default
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'role_user';

-- Update existing admin user
UPDATE users
SET role = 'role_admin'
WHERE email = 'patrick@infranet.com';
