import { db } from '../db';
import { Topic } from '@shared/types';
import { ProgressModel } from '../db/models/progress';
import type { UserTopic, UserLessonProgress } from '../types/database';

export interface CreateTopicParams {
  title: string;
  description?: string;
  difficulty: string;
  user_id: string;
}

export interface TopicProgress {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  notStartedLessons: number;
  timeSpentMinutes: number;
}

export class TopicService {
  static async createTopic(params: CreateTopicParams): Promise<Topic> {
    // Start a transaction since we need to insert into two tables
    const result = await db.transaction(async (tx) => {
      // First create the topic
      const topicResult = await tx.execute({
        sql: `INSERT INTO topics (title, description, difficulty, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?)
              RETURNING *`,
        args: [
          params.title,
          params.description || '',
          params.difficulty,
          Date.now(),
          Date.now()
        ]
      });

      const topic = topicResult.rows[0];
      if (!topic) {
        throw new Error('Failed to create topic');
      }

      // Then create the user_topics relationship
      await tx.execute({
        sql: `INSERT INTO user_topics (user_id, topic_id, goal_text)
              VALUES (?, ?, ?)`,
        args: [
          params.user_id,
          topic.topic_id,
          'Learn ' + params.title // Default goal text
        ]
      });

      // Return the topic with user_id
      return {
        ...topic,
        user_id: params.user_id
      };
    });

    return result as unknown as Topic;
  }

  static async getAllTopics(): Promise<Topic[]> {
    const result = await db.execute({
      sql: `
        SELECT t.*, ut.user_id
        FROM topics t
        LEFT JOIN user_topics ut ON t.topic_id = ut.topic_id
        ORDER BY t.created_at DESC`,
      args: []
    });

    return result.rows as unknown as Topic[];
  }

  static async getTopic(id: string | number): Promise<Topic | null> {
    const result = await db.execute({
      sql: `
        SELECT t.*, ut.user_id
        FROM topics t
        LEFT JOIN user_topics ut ON t.topic_id = ut.topic_id
        WHERE t.topic_id = ?`,
      args: [id.toString()]
    });

    return result.rows[0] ? (result.rows[0] as unknown as Topic) : null;
  }

  static async updateTopic(id: number, updates: Partial<Topic>): Promise<Topic | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title) {
      fields.push('title = ?');
      values.push(updates.title);
    }

    if (updates.description) {
      fields.push('description = ?');
      values.push(updates.description);
    }

    if (updates.difficulty) {
      fields.push('difficulty = ?');
      values.push(updates.difficulty);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push('updated_at = ?');
    values.push(Date.now());

    values.push(id);
    values.push(updates.user_id);

    const result = await db.execute({
      sql: `UPDATE topics 
            SET ${fields.join(', ')}
            WHERE topic_id = ? AND user_id = ?
            RETURNING *`,
      args: values
    });

    return result.rows[0] ? (result.rows[0] as unknown as Topic) : null;
  }

  static async startUserTopic(
    userId: string,
    topicId: number,
    goalText: string,
    targetDate?: Date
  ): Promise<UserTopic> {
    return await ProgressModel.createUserTopic(userId, topicId, goalText, targetDate);
  }

  static async getUserTopic(userId: string, topicId: number): Promise<UserTopic | null> {
    return await ProgressModel.getUserTopic(userId, topicId);
  }

  static async updateUserTopic(
    userId: string,
    topicId: number,
    updates: Partial<Pick<UserTopic, 'currentLessonId' | 'goalText' | 'targetDate'>>
  ): Promise<UserTopic | null> {
    return await ProgressModel.updateUserTopic(userId, topicId, updates);
  }

  static async getTopicProgress(userId: string, topicId: number): Promise<TopicProgress> {
    try {
      const result = await db.execute({
        sql: `
          WITH lesson_stats AS (
            SELECT
              COUNT(*) as total_lessons,
              SUM(CASE WHEN ulp.status = 'completed' THEN 1 ELSE 0 END) as completed_lessons,
              SUM(CASE WHEN ulp.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_lessons,
              SUM(CASE WHEN ulp.status = 'not_started' OR ulp.status IS NULL THEN 1 ELSE 0 END) as not_started_lessons,
              ROUND((MAX(ulp.last_interaction_at) - MIN(ulp.last_interaction_at)) / 60) as time_spent_minutes
            FROM topic_lessons tl
            LEFT JOIN user_lesson_progress ulp ON tl.lesson_id = ulp.lesson_id AND ulp.user_id = ?
            WHERE tl.topic_id = ?
          )
          SELECT * FROM lesson_stats
        `,
        args: [userId, topicId]
      });

      const row = result.rows?.[0];
      return {
        totalLessons: Number(row?.total_lessons || 0),
        completedLessons: Number(row?.completed_lessons || 0),
        inProgressLessons: Number(row?.in_progress_lessons || 0),
        notStartedLessons: Number(row?.not_started_lessons || 0),
        timeSpentMinutes: Number(row?.time_spent_minutes || 0)
      };
    } catch (error) {
      console.error('Error getting topic progress:', error);
      throw error;
    }
  }
}
