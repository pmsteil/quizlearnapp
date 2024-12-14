import express from 'express';
import { ChatService } from '../lib/services/chat';
import { getUserFromRequest } from '../lib/middleware/auth';

export const chatRouter = express.Router();

// Get chat history for a lesson
chatRouter.get('/lesson/:lessonId', getUserFromRequest, async (req, res) => {
  try {
    const chatHistory = await ChatService.getLessonChatHistory(
      req.user.id,
      Number(req.params.lessonId)
    );
    res.json(chatHistory);
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

// Add a new chat message
chatRouter.post('/lesson/:lessonId/message', getUserFromRequest, async (req, res) => {
  try {
    const { topicId, messageText, isUserMessage } = req.body;
    if (!topicId || !messageText || isUserMessage === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const message = await ChatService.addMessage(
      req.user.id,
      Number(topicId),
      Number(req.params.lessonId),
      Boolean(isUserMessage),
      messageText
    );
    res.status(201).json(message);
  } catch (error) {
    console.error('Error adding chat message:', error);
    res.status(500).json({ error: 'Failed to add chat message' });
  }
});
