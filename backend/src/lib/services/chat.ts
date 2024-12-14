import { dbClient } from '../db/client';
import type { UserLessonChatHistory } from '../types/database';

export class ChatService {
  static async addMessage(
    userId: string,
    topicId: number,
    lessonId: number,
    isUserMessage: boolean,
    messageText: string
  ): Promise<UserLessonChatHistory> {
    const timestamp = Math.floor(Date.now() / 1000);

    try {
      const result = await dbClient.execute({
        sql: `INSERT INTO user_lesson_chat_history (
                user_id, topic_id, lesson_id, is_user_message, message_text, created_at
              ) VALUES (?, ?, ?, ?, ?, ?)
              RETURNING *`,
        args: [userId, topicId, lessonId, isUserMessage ? 1 : 0, messageText, timestamp]
      });

      if (!result.rows?.[0]) {
        throw new Error('Failed to add chat message');
      }

      return this.mapChatMessage(result.rows[0]);
    } catch (error) {
      console.error('Error adding chat message:', error);
      throw error;
    }
  }

  static async getLessonChatHistory(
    userId: string,
    lessonId: number
  ): Promise<UserLessonChatHistory[]> {
    try {
      const result = await dbClient.execute({
        sql: `SELECT * FROM user_lesson_chat_history
              WHERE user_id = ? AND lesson_id = ?
              ORDER BY created_at ASC`,
        args: [userId, lessonId]
      });

      return (result.rows || []).map(this.mapChatMessage);
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  private static mapChatMessage(row: any): UserLessonChatHistory {
    return {
      chatId: row.chat_id,
      userId: row.user_id,
      topicId: row.topic_id,
      lessonId: row.lesson_id,
      isUserMessage: Boolean(row.is_user_message),
      messageText: row.message_text,
      createdAt: new Date(row.created_at * 1000)
    };
  }
}
