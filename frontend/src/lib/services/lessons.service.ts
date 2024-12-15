import { apiClient } from '../api-client';
import type { TopicLesson, UserLessonProgress, ProgressStatus } from '../types';

class LessonsService {
  async getLessonsForTopic(topicId: string | number): Promise<TopicLesson[]> {
    const response = await apiClient.get(`/topics/${topicId}/lessons`);
    return response.data?.data || [];
  }

  async getLesson(lessonId: string | number): Promise<TopicLesson> {
    const response = await apiClient.get(`/lessons/${lessonId}`);
    return response.data;
  }

  async createLesson(topicId: string | number, lesson: Partial<TopicLesson>): Promise<TopicLesson> {
    const response = await apiClient.post(`/topics/${topicId}/lessons`, lesson);
    return response.data;
  }

  async updateLesson(lessonId: string | number, updates: Partial<TopicLesson>): Promise<TopicLesson> {
    const response = await apiClient.patch(`/lessons/${lessonId}`, updates);
    return response.data;
  }

  async deleteLesson(lessonId: string | number): Promise<void> {
    await apiClient.delete(`/lessons/${lessonId}`);
  }

  async reorderLessons(topicId: string | number, lessonIds: number[]): Promise<TopicLesson[]> {
    const response = await apiClient.post(`/topics/${topicId}/lessons/reorder`, { lessonIds });
    return response.data;
  }

  // Progress-related methods
  async getLessonProgress(lessonId: string | number): Promise<UserLessonProgress> {
    const response = await apiClient.get(`/lessons/me/${lessonId}/progress`);
    return response.data;
  }

  async updateLessonProgress(lessonId: string | number, status: ProgressStatus): Promise<UserLessonProgress> {
    const response = await apiClient.put(`/lessons/me/${lessonId}/progress`, { status });
    return response.data;
  }

  async getTopicProgress(topicId: string | number): Promise<UserLessonProgress[]> {
    const response = await apiClient.get(`/topics/${topicId}/progress`);
    return response.data?.data || [];
  }
}

export const lessonsService = new LessonsService();
