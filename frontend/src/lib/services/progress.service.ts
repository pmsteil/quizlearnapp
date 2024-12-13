import { ApiClient } from '../api';

interface Progress {
  id: string;
  user_id: string;
  topic_id: string;
  question_id: string;
  is_correct: boolean;
  time_spent: number;
  created_at: number;
}

interface TopicProgress {
  topic_id: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  completion_percentage: number;
  time_spent_minutes: number;
  last_activity: number;
  subtopic_progress: {
    [key: string]: {
      total: number;
      completed: number;
      correct: number;
      status: 'not_started' | 'in_progress' | 'completed';
    };
  };
}

interface SubtopicProgress {
  subtopic: string;
  total_questions: number;
  completed_questions: number;
  correct_answers: number;
  time_spent_minutes: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

interface CreateProgressData {
  topic_id: string;
  question_id: string;
  is_correct: boolean;
  time_spent: number;
}

interface ProgressStats {
  total_time_spent: number;
  total_questions_answered: number;
  correct_answers: number;
  incorrect_answers: number;
  average_accuracy: number;
  topics_started: number;
  topics_completed: number;
  daily_streak: number;
  last_activity: number;
}

export class ProgressService extends ApiClient {
  async getTopicProgress(topicId: string): Promise<TopicProgress> {
    return this.get(`/progress/topic/${topicId}`);
  }

  async getSubtopicProgress(topicId: string, subtopic: string): Promise<SubtopicProgress> {
    return this.get(`/progress/topic/${topicId}/subtopic/${subtopic}`);
  }

  async getUserProgress(userId: string): Promise<ProgressStats> {
    return this.get(`/progress/user/${userId}`);
  }

  async recordProgress(data: CreateProgressData): Promise<Progress> {
    return this.post('/progress', data);
  }

  async updateSubtopicStatus(
    topicId: string,
    subtopic: string,
    status: SubtopicProgress['status']
  ): Promise<void> {
    return this.put(`/progress/topic/${topicId}/subtopic/${subtopic}`, { status });
  }

  async getDailyStreak(userId: string): Promise<{ streak: number; lastActivity: number }> {
    return this.get(`/progress/user/${userId}/streak`);
  }

  async getProgressHistory(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    date: string;
    questions_answered: number;
    correct_answers: number;
    time_spent: number;
  }[]> {
    return this.get('/progress/history', {
      params: {
        user_id: userId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      },
    });
  }
}

// Export types
export type {
  Progress,
  TopicProgress,
  SubtopicProgress,
  CreateProgressData,
  ProgressStats,
};
