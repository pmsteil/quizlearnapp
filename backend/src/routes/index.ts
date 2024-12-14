import express from 'express';
import { topicsRouter } from './topics';
import { lessonsRouter } from './lessons';
import { chatRouter } from './chat';
import { authRouter } from './auth';

export const apiRouter = express.Router();

// API Routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/topics', topicsRouter);
apiRouter.use('/lessons', lessonsRouter);
apiRouter.use('/chat', chatRouter);
