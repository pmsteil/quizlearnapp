import { TopicModel } from '../db/models/topic';
import type { Topic, LessonPlan } from '../types/database';
import { db } from '../db/client';
import { QuestionService } from './question';

export interface TopicProgress {
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  timeSpentMinutes: number;
}

export class TopicService {
  static async createTopic(
    userId: string,
    title: string,
    description: string,
    lessonPlan: LessonPlan
  ): Promise<Topic> {
    try {
      const topic = await TopicModel.create(userId, title, description, lessonPlan);

      // Add initial questions for the topic
      await QuestionService.addInitialQuestions(topic.id);

      return topic;
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

  static async getTopicProgress(topicId: string): Promise<TopicProgress> {
    try {
      const result = await db.execute({
        sql: `
          SELECT
            (SELECT COUNT(*) FROM user_progress WHERE topic_id = ? AND is_correct = 1) as correct_answers,
            (SELECT COUNT(*) FROM user_progress WHERE topic_id = ? AND is_correct = 0) as incorrect_answers,
            (SELECT COUNT(*) FROM questions WHERE topic_id = ?) as total_questions,
            (SELECT ROUND((julianday('now') - julianday(MIN(created_at))) * 24 * 60)
             FROM user_progress
             WHERE topic_id = ?) as time_spent_minutes
        `,
        args: [topicId, topicId, topicId, topicId]
      });

      const row = result.rows?.[0];
      return {
        correctAnswers: Number(row?.correct_answers || 0),
        incorrectAnswers: Number(row?.incorrect_answers || 0),
        totalQuestions: Number(row?.total_questions || 0),
        timeSpentMinutes: Number(row?.time_spent_minutes || 0)
      };
    } catch (error) {
      console.error('Error getting topic progress:', error);
      throw error;
    }
  }
}
