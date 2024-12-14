import { db } from '../db/client';
import { Lesson } from '../types/database';

interface CreateLessonParams {
  title: string;
  content: string;
  topic_id: number;
  parent_lesson_id: number | null;
  order_index: number;
  user_id: string;
}

export class LessonService {
  static async createLesson(params: CreateLessonParams): Promise<Lesson> {
    const result = await db.execute({
      sql: `INSERT INTO lessons (title, content, topic_id, parent_lesson_id, order_index, user_id)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING *`,
      args: [
        params.title,
        params.content,
        params.topic_id,
        params.parent_lesson_id,
        params.order_index,
        params.user_id
      ]
    });

    return this.mapLesson(result.rows[0]);
  }

  static async getLesson(lessonId: number): Promise<Lesson | null> {
    const result = await db.execute({
      sql: 'SELECT * FROM lessons WHERE lesson_id = ?',
      args: [lessonId]
    });

    return result.rows[0] ? this.mapLesson(result.rows[0]) : null;
  }

  static async getTopicLessons(topicId: number): Promise<Lesson[]> {
    const result = await db.execute({
      sql: 'SELECT * FROM lessons WHERE topic_id = ? ORDER BY order_index',
      args: [topicId]
    });

    return result.rows.map(row => this.mapLesson(row));
  }

  static async updateLesson(lessonId: number, updates: Partial<CreateLessonParams>): Promise<Lesson | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }

    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }

    if (updates.order_index !== undefined) {
      fields.push('order_index = ?');
      values.push(updates.order_index);
    }

    if (updates.parent_lesson_id !== undefined) {
      fields.push('parent_lesson_id = ?');
      values.push(updates.parent_lesson_id);
    }

    if (updates.topic_id !== undefined) {
      fields.push('topic_id = ?');
      values.push(updates.topic_id);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push('user_id = ?');
    values.push(updates.user_id);

    values.push(lessonId);

    const result = await db.execute({
      sql: `UPDATE lessons
            SET ${fields.join(', ')}
            WHERE lesson_id = ?
            RETURNING *`,
      args: values
    });

    return result.rows[0] ? this.mapLesson(result.rows[0]) : null;
  }

  static async getLessonProgress(lessonId: number, userId: string) {
    const result = await db.execute({
      sql: 'SELECT * FROM lesson_progress WHERE lesson_id = ? AND user_id = ?',
      args: [lessonId, userId]
    });

    return result.rows[0] ? {
      lessonId: result.rows[0].lesson_id,
      userId: result.rows[0].user_id,
      status: result.rows[0].status,
      timeSpentMinutes: result.rows[0].time_spent_minutes || 0,
      lastInteractionAt: result.rows[0].last_interaction_at,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    } : null;
  }

  static async updateLessonProgress(lessonId: number, userId: string, status: string) {
    const timestamp = Date.now();
    const result = await db.execute({
      sql: `UPDATE lesson_progress
            SET status = ?, updated_at = ?, last_interaction_at = ?
            WHERE lesson_id = ? AND user_id = ?
            RETURNING *`,
      args: [status, timestamp, timestamp, lessonId, userId]
    });

    return {
      lessonId: result.rows[0].lesson_id,
      userId: result.rows[0].user_id,
      status: result.rows[0].status,
      timeSpentMinutes: result.rows[0].time_spent_minutes || 0,
      lastInteractionAt: result.rows[0].last_interaction_at,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
  }

  private static mapLesson(row: any): Lesson {
    return {
      lessonId: row.lesson_id,
      topicId: row.topic_id,
      title: row.title,
      content: row.content,
      orderIndex: row.order_index,
      parentLessonId: row.parent_lesson_id,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
