import express from 'express';
import { TopicService } from '../lib/services/topic';
import { authenticateToken } from '../middleware/auth';

export const topicsRouter = express.Router();

// Get all topics
topicsRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const topics = await TopicService.getAllTopics();
    res.json(topics);
  } catch (error) {
    console.error('Error getting topics:', error);
    res.status(500).json({ error: 'Failed to get topics' });
  }
});

// Get a specific topic
topicsRouter.get('/:topicId', authenticateToken, async (req, res) => {
  try {
    const topic = await TopicService.getTopic(Number(req.params.topicId));
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    res.json(topic);
  } catch (error) {
    console.error('Error getting topic:', error);
    res.status(500).json({ error: 'Failed to get topic' });
  }
});

// Create a new topic
topicsRouter.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, difficulty } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const topic = await TopicService.createTopic({
      title,
      description,
      difficulty: difficulty || 'beginner',
      user_id: req.user!.user_id
    });
    res.status(201).json(topic);
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// Update a topic
topicsRouter.patch('/:topicId', authenticateToken, async (req, res) => {
  try {
    const { title, description, difficulty } = req.body;
    const topic = await TopicService.updateTopic(Number(req.params.topicId), {
      title,
      description,
      difficulty,
      user_id: req.user!.user_id
    });
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    res.json(topic);
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

// User-specific routes
// Start a topic for a user
topicsRouter.post('/me/:topicId/start', authenticateToken, async (req, res) => {
  try {
    const { goalText } = req.body;
    const targetDate = req.body.targetDate ? new Date(req.body.targetDate) : undefined;
    
    if (!goalText) {
      return res.status(400).json({ error: 'Goal text is required' });
    }

    const userTopic = await TopicService.startUserTopic(
      req.user!.user_id,
      Number(req.params.topicId),
      goalText,
      targetDate
    );
    res.status(201).json(userTopic);
  } catch (error) {
    console.error('Error starting topic:', error);
    res.status(500).json({ error: 'Failed to start topic' });
  }
});

// Get user's topic progress
topicsRouter.get('/me/:topicId/progress', authenticateToken, async (req, res) => {
  try {
    const progress = await TopicService.getTopicProgress(
      req.user!.user_id,
      Number(req.params.topicId)
    );
    res.json(progress);
  } catch (error) {
    console.error('Error getting topic progress:', error);
    res.status(500).json({ error: 'Failed to get topic progress' });
  }
});

// Get user's topic details
topicsRouter.get('/me/:topicId', authenticateToken, async (req, res) => {
  try {
    const userTopic = await TopicService.getUserTopic(
      req.user!.user_id,
      Number(req.params.topicId)
    );
    if (!userTopic) {
      return res.status(404).json({ error: 'User topic not found' });
    }
    res.json(userTopic);
  } catch (error) {
    console.error('Error getting user topic:', error);
    res.status(500).json({ error: 'Failed to get user topic' });
  }
});

// Update user's topic
topicsRouter.patch('/me/:topicId', authenticateToken, async (req, res) => {
  try {
    const { currentLessonId, goalText, targetDate } = req.body;
    const userTopic = await TopicService.updateUserTopic(
      req.user!.user_id,
      Number(req.params.topicId),
      {
        currentLessonId: currentLessonId ? Number(currentLessonId) : undefined,
        goalText,
        targetDate: targetDate ? new Date(targetDate) : undefined
      }
    );
    if (!userTopic) {
      return res.status(404).json({ error: 'User topic not found' });
    }
    res.json(userTopic);
  } catch (error) {
    console.error('Error updating user topic:', error);
    res.status(500).json({ error: 'Failed to update user topic' });
  }
});
