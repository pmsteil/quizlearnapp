import { TopicModel } from '../db/models/topic';
import type { Topic, LessonPlan } from '../types/database';

export class TopicService {
  static async createTopic(
    userId: string,
    title: string,
    description: string,
    lessonPlan: LessonPlan
  ): Promise<Topic> {
    try {
      return await TopicModel.create(userId, title, description, lessonPlan);
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  }

  static async getUserTopics(userId: string): Promise<Topic[]> {
    try {
      const topics = await TopicModel.getByUserId(userId);
      console.log('Retrieved topics:', topics); // Debug log
      return topics;
    } catch (error) {
      console.error('Error getting user topics:', error);
      throw error;
    }
  }

  static async getTopic(id: string): Promise<Topic | null> {
    try {
      return await TopicModel.getById(id);
    } catch (error) {
      console.error('Error getting topic:', error);
      throw error;
    }
  }
}