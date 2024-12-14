import { dbClient } from '../client';
import type { Topic } from '../../types/database';

export class TopicModel {
  static async create(
    title: string,
    description?: string
  ): Promise<Topic> {
    const timestamp = Math.floor(Date.now() / 1000);

    try {
      const result = await dbClient.execute({
        sql: `INSERT INTO topics (title, description, created_at, updated_at)
              VALUES (?, ?, ?, ?)
              RETURNING *`,
        args: [title, description || null, timestamp, timestamp]
      });

      if (!result.rows?.[0]) {
        throw new Error('Failed to create topic');
      }

      return this.mapTopic(result.rows[0]);
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  }

  static async getAll(): Promise<Topic[]> {
    try {
      const result = await dbClient.execute({
        sql: 'SELECT * FROM topics ORDER BY created_at DESC'
      });

      return (result.rows || []).map(this.mapTopic);
    } catch (error) {
      console.error('Error getting topics:', error);
      throw error;
    }
  }

  static async getById(id: number): Promise<Topic | null> {
    try {
      const result = await dbClient.execute({
        sql: 'SELECT * FROM topics WHERE topic_id = ?',
        args: [id]
      });

      const topic = result.rows?.[0];
      return topic ? this.mapTopic(topic) : null;
    } catch (error) {
      console.error('Error getting topic:', error);
      throw error;
    }
  }

  static async update(
    id: number,
    updates: Partial<Pick<Topic, 'title' | 'description'>>
  ): Promise<Topic | null> {
    const timestamp = Math.floor(Date.now() / 1000);
    const updateFields: string[] = [];
    const args: any[] = [];

    if (updates.title !== undefined) {
      updateFields.push('title = ?');
      args.push(updates.title);
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      args.push(updates.description);
    }

    if (updateFields.length === 0) {
      return this.getById(id);
    }

    updateFields.push('updated_at = ?');
    args.push(timestamp);
    args.push(id);

    try {
      const result = await dbClient.execute({
        sql: `UPDATE topics 
              SET ${updateFields.join(', ')}
              WHERE topic_id = ?
              RETURNING *`,
        args
      });

      const topic = result.rows?.[0];
      return topic ? this.mapTopic(topic) : null;
    } catch (error) {
      console.error('Error updating topic:', error);
      throw error;
    }
  }

  private static mapTopic(row: any): Topic {
    return {
      id: row.topic_id,
      title: row.title,
      description: row.description,
      createdAt: new Date(row.created_at * 1000),
      updatedAt: new Date(row.updated_at * 1000)
    };
  }
}
