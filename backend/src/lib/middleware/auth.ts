import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../db/models/user';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export async function getUserFromRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as {
      userId: string;
    };

    const user = await UserModel.getById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip auth for non-protected routes
  if (
    req.path === '/api/auth/login' ||
    req.path === '/api/auth/register' ||
    !req.path.startsWith('/api/topics/me/') &&
    !req.path.startsWith('/api/lessons/me/')
  ) {
    return next();
  }

  return getUserFromRequest(req, res, next);
}
