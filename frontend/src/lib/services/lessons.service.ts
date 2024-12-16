import { api } from '../api';
import type { TopicLesson, ProgressStatus } from '../types';

class LessonsService {
  async getLessonsForTopic(topicId: string): Promise<TopicLesson[]> {
    const response = await api.get(`/topics/${topicId}/lessons`);
    return response.data;
  }

  async getLesson(lessonId: number): Promise<TopicLesson> {
    const response = await api.get(`/lessons/${lessonId}`);
    return response.data;
  }

  async updateLesson(lessonId: number, data: Partial<TopicLesson>): Promise<TopicLesson> {
    const response = await api.put(`/lessons/${lessonId}`, data);
    return response.data;
  }

  async updateLessonProgress(lessonId: number, status: ProgressStatus): Promise<void> {
    await api.put(`/lessons/${lessonId}/progress`, { status });
  }
}

export const lessonsService = new LessonsService();
