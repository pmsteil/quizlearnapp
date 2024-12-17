import { api } from '../api';
import type { TopicLesson, ProgressStatus } from '../types';

class LessonsService {
  async getLessonsForTopic(topicId: string): Promise<TopicLesson[]> {
    const response = await api.get(`/topics/${topicId}/lessons`);
    return response.data;
  }

  async getLesson(topicId: string, lessonId: string): Promise<TopicLesson> {
    const response = await api.get(`/topics/${topicId}/lessons/${lessonId}`);
    return response.data;
  }

  async updateLesson(topicId: string, lessonId: string, data: Partial<TopicLesson>): Promise<TopicLesson> {
    const response = await api.put(`/topics/${topicId}/lessons/${lessonId}`, data);
    return response.data;
  }

  async updateLessonProgress(topicId: string, lessonId: string, status: ProgressStatus): Promise<void> {
    await api.put(`/topics/${topicId}/lessons/${lessonId}/progress`, { status });
  }
}

export const lessonsService = new LessonsService();
