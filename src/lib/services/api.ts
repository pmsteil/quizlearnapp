import type { Topic, LessonPlan } from '@/lib/types';

export class TopicService {
  static async createTopic(title: string, description: string): Promise<Topic> {
    // Implementation
    throw new Error('Not implemented');
  }

  static async getTopic(id: string): Promise<Topic> {
    // Implementation
    throw new Error('Not implemented');
  }

  static async updateTopic(id: string, updates: Partial<Topic>): Promise<Topic> {
    // Implementation
    throw new Error('Not implemented');
  }

  static async deleteTopic(id: string): Promise<void> {
    // Implementation
    throw new Error('Not implemented');
  }

  static async getTopics(): Promise<Topic[]> {
    // Implementation
    throw new Error('Not implemented');
  }

  static async updateLessonPlan(topicId: string, lessonPlan: LessonPlan): Promise<void> {
    // Implementation
    throw new Error('Not implemented');
  }
}
