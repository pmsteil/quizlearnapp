import { dbClient } from '../client';
import type { Lesson } from '../../types/database';

export class LessonModel {
  static async create(
    topicId: number,
    title: string,
    content: string,
    orderIndex: number
  ): Promise<Lesson> {
    const timestamp = Math.floor(Date.now() / 1000);

    try {
      const result = await dbClient.execute({
        sql: `INSERT INTO topic_lessons (topic_id, title, content, order_index, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?)
              RETURNING *`,
        args: [topicId, title, content, orderIndex, timestamp, timestamp]
      });

      if (!result.rows?.[0]) {
        throw new Error('Failed to create lesson');
      }

      return this.mapLesson(result.rows[0]);
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  }

  static async getByTopicId(topicId: number): Promise<Lesson[]> {
    try {
      const result = await dbClient.execute({
        sql: 'SELECT * FROM topic_lessons WHERE topic_id = ? ORDER BY order_index ASC',
        args: [topicId]
      });

      return (result.rows || []).map(this.mapLesson);
    } catch (error) {
      console.error('Error getting lessons:', error);
      throw error;
    }
  }

  static async getById(lessonId: number): Promise<Lesson | null> {
    try {
      const result = await dbClient.execute({
        sql: 'SELECT * FROM topic_lessons WHERE lesson_id = ?',
        args: [lessonId]
      });

      const lesson = result.rows?.[0];
      return lesson ? this.mapLesson(lesson) : null;
    } catch (error) {
      console.error('Error getting lesson:', error);
      throw error;
    }
  }

  static async update(
    lessonId: number,
    updates: Partial<Pick<Lesson, 'title' | 'content' | 'orderIndex'>>
  ): Promise<Lesson | null> {
    const timestamp = Math.floor(Date.now() / 1000);
    const updateFields: string[] = [];
    const args: any[] = [];

    if (updates.title !== undefined) {
      updateFields.push('title = ?');
      args.push(updates.title);
    }
    if (updates.content !== undefined) {
      updateFields.push('content = ?');
      args.push(updates.content);
    }
    if (updates.orderIndex !== undefined) {
      updateFields.push('order_index = ?');
      args.push(updates.orderIndex);
    }

    if (updateFields.length === 0) {
      return this.getById(lessonId);
    }

    updateFields.push('updated_at = ?');
    args.push(timestamp);
    args.push(lessonId);

    try {
      const result = await dbClient.execute({
        sql: `UPDATE topic_lessons 
              SET ${updateFields.join(', ')}
              WHERE lesson_id = ?
              RETURNING *`,
        args
      });

      const lesson = result.rows?.[0];
      return lesson ? this.mapLesson(lesson) : null;
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  }

  private static mapLesson(row: any): Lesson {
    return {
      id: row.lesson_id,
      topicId: row.topic_id,
      title: row.title,
      content: row.content,
      orderIndex: row.order_index,
      createdAt: new Date(row.created_at * 1000),
      updatedAt: new Date(row.updated_at * 1000)
    };
  }
}
