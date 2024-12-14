import express from 'express';
import { LessonService } from '../lib/services/lesson';
import { authenticateToken } from '../middleware/auth';
import { Lesson } from '../lib/types/database';

const lessonsRouter = express.Router();

lessonsRouter.use(authenticateToken);

// Get all lessons for a topic
lessonsRouter.get('/topic/:topicId', async (req, res) => {
  try {
    const topicId = Number(req.params.topicId);
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const lessons = await LessonService.getTopicLessons(topicId);
    res.json(lessons);
  } catch (error) {
    console.error('Error getting lessons:', error);
    res.status(500).json({ error: 'Failed to get lessons' });
  }
});

// Get a specific lesson
lessonsRouter.get('/:lessonId', async (req, res) => {
  try {
    const lessonId = Number(req.params.lessonId);
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const lesson = await LessonService.getLesson(lessonId);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json(lesson);
  } catch (error) {
    console.error('Error getting lesson:', error);
    res.status(500).json({ error: 'Failed to get lesson' });
  }
});

// Create a new lesson
lessonsRouter.post('/', async (req, res) => {
  try {
    const { title, content, topicId, parentLessonId, orderIndex } = req.body;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!title || !content || !topicId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lesson = await LessonService.createLesson({
      title,
      content,
      topic_id: Number(topicId),
      parent_lesson_id: parentLessonId ? Number(parentLessonId) : null,
      order_index: orderIndex ? Number(orderIndex) : 0,
      user_id: userId
    });

    res.status(201).json(lesson);
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

// Update a lesson
lessonsRouter.put('/:lessonId', async (req, res) => {
  try {
    const lessonId = Number(req.params.lessonId);
    const { title, content, topicId, parentLessonId, orderIndex } = req.body;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updates = {
      title,
      content,
      topic_id: topicId !== undefined ? Number(topicId) : undefined,
      parent_lesson_id: parentLessonId !== undefined ? Number(parentLessonId) : undefined,
      order_index: orderIndex !== undefined ? Number(orderIndex) : undefined,
      user_id: userId
    };

    const lesson = await LessonService.updateLesson(lessonId, updates);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json(lesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// Update lesson progress
lessonsRouter.put('/:lessonId/progress', async (req, res) => {
  try {
    const lessonId = Number(req.params.lessonId);
    const { status } = req.body;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const progress = await LessonService.updateLessonProgress(lessonId, userId, status);
    res.json(progress);
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    res.status(500).json({ error: 'Failed to update lesson progress' });
  }
});

// Get lesson progress
lessonsRouter.get('/:lessonId/progress', async (req, res) => {
  try {
    const lessonId = Number(req.params.lessonId);
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const progress = await LessonService.getLessonProgress(lessonId, userId);

    if (!progress) {
      return res.status(404).json({ error: 'Lesson progress not found' });
    }

    res.json(progress);
  } catch (error) {
    console.error('Error getting lesson progress:', error);
    res.status(500).json({ error: 'Failed to get lesson progress' });
  }
});

export default lessonsRouter;
