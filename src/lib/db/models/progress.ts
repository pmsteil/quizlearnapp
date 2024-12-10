import { dbClient } from '../client';
import { generateId } from '../../utils/auth';

export interface Progress {
  id: string;
  userId: string;
  topicId: string;
  questionId: string;
  isCorrect: boolean;
  createdAt: Date;
}

export class ProgressModel {
  static async create(
    userId: string,
    topicId: string,
    questionId: string,
    isCorrect: boolean
  ): Promise<Progress> {
    const id = generateId();
    const timestamp = Math.floor(Date.now() / 1000);

    try {
      const result = await dbClient.execute({
        sql: `INSERT INTO user_progress (id, user_id, topic_id, question_id, is_correct, created_at)
              VALUES (?, ?, ?, ?, ?, ?)
              RETURNING *`,
        args: [id, userId, topicId, questionId, isCorrect ? 1 : 0, timestamp]
      });

      if (!result.rows?.[0]) {
        throw new Error('Failed to create progress entry');
      }

      return this.mapProgress(result.rows[0]);
    } catch (error) {
      console.error('Error creating progress:', error);
      throw error;
    }
  }

  static async getByTopicId(userId: string, topicId: string): Promise<Progress[]> {
    try {
      const result = await dbClient.execute({
        sql: 'SELECT * FROM user_progress WHERE user_id = ? AND topic_id = ? ORDER BY created_at DESC',
        args: [userId, topicId]
      });

      return (result.rows || []).map(this.mapProgress);
    } catch (error) {
      console.error('Error getting progress:', error);
      throw error;
    }
  }

  private static mapProgress(row: any): Progress {
    return {
      id: row.id,
      userId: row.user_id,
      topicId: row.topic_id,
      questionId: row.question_id,
      isCorrect: Boolean(row.is_correct),
      createdAt: new Date(row.created_at * 1000)
    };
  }
}
