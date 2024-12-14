import { db } from '../client';
import { UserTopic, UserLessonProgress } from '../../types/database';

export class ProgressModel {
  static async createUserTopic(
    userId: string,
    topicId: number,
    goalText: string,
    targetDate?: Date
  ): Promise<UserTopic> {
    const timestamp = new Date();
    const result = await db.execute({
      sql: `INSERT INTO user_topics (user_id, topic_id, goal_text, target_date, started_at, last_accessed)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING *`,
      args: [
        userId,
        topicId,
        goalText,
        targetDate ? targetDate.toISOString() : null,
        timestamp.toISOString(),
        timestamp.toISOString()
      ]
    });

    return this.mapUserTopic(result.rows[0]);
  }

  static async getUserTopic(userId: string, topicId: number): Promise<UserTopic | null> {
    const result = await db.execute({
      sql: 'SELECT * FROM user_topics WHERE user_id = ? AND topic_id = ?',
      args: [userId, topicId]
    });

    return result.rows[0] ? this.mapUserTopic(result.rows[0]) : null;
  }

  static async updateUserTopic(
    userId: string,
    topicId: number,
    updates: Partial<UserTopic>
  ): Promise<UserTopic | null> {
    const fields: string[] = [];
    const args: any[] = [];

    if (updates.goalText) {
      fields.push('goal_text = ?');
      args.push(updates.goalText);
    }

    if (updates.targetDate) {
      fields.push('target_date = ?');
      args.push(updates.targetDate.toISOString());
    }

    if (updates.currentLessonId) {
      fields.push('current_lesson_id = ?');
      args.push(updates.currentLessonId);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push('last_accessed = ?');
    args.push(new Date().toISOString());

    args.push(userId);
    args.push(topicId);

    const result = await db.execute({
      sql: `UPDATE user_topics 
            SET ${fields.join(', ')}
            WHERE user_id = ? AND topic_id = ?
            RETURNING *`,
      args
    });

    return result.rows[0] ? this.mapUserTopic(result.rows[0]) : null;
  }

  static async createLessonProgress(
    userId: string,
    lessonId: number,
    status: string
  ): Promise<UserLessonProgress> {
    const timestamp = Date.now();
    const result = await db.execute({
      sql: `INSERT INTO lesson_progress (user_id, lesson_id, status, time_spent_minutes, last_interaction_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            RETURNING *`,
      args: [userId, lessonId, status, 0, timestamp, timestamp, timestamp]
    });

    return this.mapLessonProgress(result.rows[0]);
  }

  static async getLessonProgress(
    userId: string,
    lessonId: number
  ): Promise<UserLessonProgress | null> {
    const result = await db.execute({
      sql: 'SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
      args: [userId, lessonId]
    });

    return result.rows[0] ? this.mapLessonProgress(result.rows[0]) : null;
  }

  static async updateLessonProgress(
    userId: string,
    lessonId: number,
    status: string
  ): Promise<UserLessonProgress> {
    const timestamp = Date.now();
    const result = await db.execute({
      sql: `UPDATE lesson_progress
            SET status = ?, last_interaction_at = ?, updated_at = ?
            WHERE user_id = ? AND lesson_id = ?
            RETURNING *`,
      args: [status, timestamp, timestamp, userId, lessonId]
    });

    return this.mapLessonProgress(result.rows[0]);
  }

  private static mapUserTopic(row: any): UserTopic {
    return {
      userId: row.user_id,
      topicId: row.topic_id,
      currentLessonId: row.current_lesson_id,
      goalText: row.goal_text,
      targetDate: row.target_date ? new Date(row.target_date) : null,
      startedAt: new Date(row.started_at),
      lastAccessed: new Date(row.last_accessed)
    };
  }

  private static mapLessonProgress(row: any): UserLessonProgress {
    return {
      userId: row.user_id,
      lessonId: row.lesson_id,
      status: row.status,
      timeSpentMinutes: row.time_spent_minutes || 0,
      lastInteractionAt: row.last_interaction_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
