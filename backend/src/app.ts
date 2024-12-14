import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { topicsRouter } from './routes/topics';
import { usersRouter } from './routes/users';
import lessonsRouter from './routes/lessons';
import { errorHandler } from './middleware/error';
import { authMiddleware } from './middleware/auth';

const app = express();

app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/v1/auth', authRouter);

// Protected routes
app.use('/api/v1/topics', authMiddleware, topicsRouter);
app.use('/api/v1/users', authMiddleware, usersRouter);
app.use('/api/v1/lessons', authMiddleware, lessonsRouter);

// Error handling
app.use(errorHandler);

export { app };
