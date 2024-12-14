import { Router } from 'express';
import { db } from '../lib/db';
import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Row } from '@libsql/client';

interface DbUser {
  user_id: number;
  email: string;
  name: string;
  password_hash: string;
}

const router = Router();

// Debug middleware
router.use((req, res, next) => {
  console.log('Auth router request:', {
    method: req.method,
    url: req.url,
    path: req.path,
    body: req.body,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl
  });
  next();
});

// Handle both /signup and /auth/signup
router.post(['/signup', '/auth/signup'], async (req, res, next) => {
  console.log('Signup request received:', req.body);
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const result = await db.execute({
      sql: `INSERT INTO users (email, password_hash, name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            RETURNING user_id, email, name`,
      args: [email, hashedPassword, name, Date.now(), Date.now()]
    });

    const user = result.rows[0] as unknown as DbUser;

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  console.log('Login request received:', req.body);
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find user
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });

    const user = result.rows[0] as unknown as DbUser;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    res.json({
      access_token: token,
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };
