import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../lib/db';

export const usersRouter = express.Router();

// Get current user
usersRouter.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE user_id = ? AND NOT deleted',
      args: [req.user!.user_id]
    });

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});
