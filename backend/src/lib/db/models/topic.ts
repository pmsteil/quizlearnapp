import { dbClient } from '../client';
import { generateId } from '../../utils/auth';
import type { Topic, LessonPlan } from '../../types/database';

export class TopicModel {
  static async create(
    userId: string,
    title: string,
    description: string,
    lessonPlan: LessonPlan
  ): Promise<Topic> {
    const id = generateId();
    const timestamp = Math.floor(Date.now() / 1000);

    try {
      const result = await dbClient.execute({
        sql: `INSERT INTO topics (id, user_id, title, description, lesson_plan, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              RETURNING *`,
        args: [id, userId, title, description, JSON.stringify(lessonPlan), timestamp, timestamp]
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

  static async getByUserId(userId: string): Promise<Topic[]> {
    try {
      const result = await dbClient.execute({
        sql: 'SELECT * FROM topics WHERE user_id = ? ORDER BY created_at DESC',
        args: [userId]
      });

      return (result.rows || []).map(this.mapTopic);
    } catch (error) {
      console.error('Error getting topics:', error);
      throw error;
    }
  }

  static async getById(id: string): Promise<Topic | null> {
    try {
      const result = await dbClient.execute({
        sql: 'SELECT * FROM topics WHERE id = ?',
        args: [id]
      });

      const topic = result.rows?.[0];
      return topic ? this.mapTopic(topic) : null;
    } catch (error) {
      console.error('Error getting topic:', error);
      throw error;
    }
  }

  private static mapTopic(row: any): Topic {
    let lessonPlan: LessonPlan;
    try {
      lessonPlan = JSON.parse(row.lesson_plan);
    } catch {
      lessonPlan = {
        mainTopics: [{
          name: "Learning Path",
          subtopics: [
            { name: 'Introduction', status: 'current' },
            { name: 'Basic Concepts', status: 'upcoming' },
            { name: 'Practice Exercises', status: 'upcoming' },
            { name: 'Advanced Topics', status: 'upcoming' },
            { name: 'Final Review', status: 'upcoming' }
          ]
        }],
        currentTopic: 'Introduction',
        completedTopics: []
      };
    }

    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      progress: row.progress || 0,
      lessonPlan,
      createdAt: new Date(row.created_at * 1000),
      updatedAt: new Date(row.updated_at * 1000)
    };
  }
}
