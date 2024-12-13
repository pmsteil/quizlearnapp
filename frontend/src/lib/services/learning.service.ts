import { ApiClient } from '../api';

interface LearningPath {
  id: string;
  topic_id: string;
  user_id: string;
  current_subtopic: string;
  completed_subtopics: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  pace: 'relaxed' | 'balanced' | 'intensive';
  daily_goal_minutes: number;
  weekly_goal_questions: number;
  created_at: number;
  updated_at: number;
}

interface LearningRecommendation {
  subtopic: string;
  reason: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_time_minutes: number;
  question_count: number;
  prerequisites: string[];
  learning_materials: {
    type: 'video' | 'article' | 'exercise';
    title: string;
    url: string;
    duration_minutes?: number;
  }[];
}

interface CreateLearningPathData {
  topic_id: string;
  difficulty_level: LearningPath['difficulty_level'];
  pace: LearningPath['pace'];
  daily_goal_minutes: number;
  weekly_goal_questions: number;
}

interface UpdateLearningPathData {
  difficulty_level?: LearningPath['difficulty_level'];
  pace?: LearningPath['pace'];
  daily_goal_minutes?: number;
  weekly_goal_questions?: number;
}

export class LearningService extends ApiClient {
  async getLearningPath(topicId: string): Promise<LearningPath> {
    const response = await this.get<LearningPath>(`/learning/path/${topicId}`);
    return response;
  }

  async createLearningPath(data: CreateLearningPathData): Promise<LearningPath> {
    const response = await this.post<LearningPath>('/learning/path', data);
    return response;
  }

  async updateLearningPath(
    topicId: string,
    data: UpdateLearningPathData
  ): Promise<LearningPath> {
    const response = await this.put<LearningPath>(`/learning/path/${topicId}`, data);
    return response;
  }

  async getNextRecommendation(topicId: string): Promise<LearningRecommendation> {
    const response = await this.get<LearningRecommendation>(`/learning/recommend/${topicId}`);
    return response;
  }

  async markSubtopicComplete(
    topicId: string,
    subtopic: string
  ): Promise<{ success: boolean; nextSubtopic?: string }> {
    const response = await this.post<{ success: boolean; nextSubtopic?: string }>(
      `/learning/complete/${topicId}/${subtopic}`
    );
    return response;
  }

  async generateLearningMaterials(
    topicId: string,
    subtopic: string
  ): Promise<LearningRecommendation['learning_materials']> {
    const response = await this.post<LearningRecommendation['learning_materials']>(
      `/learning/materials`,
      {
        topic_id: topicId,
        subtopic,
      }
    );
    return response;
  }

  async adjustDifficulty(
    topicId: string,
    performance: 'too_easy' | 'just_right' | 'too_hard'
  ): Promise<{
    new_difficulty: LearningPath['difficulty_level'];
    adjustments: string[];
  }> {
    const response = await this.post<{
      new_difficulty: LearningPath['difficulty_level'];
      adjustments: string[];
    }>(`/learning/adjust-difficulty/${topicId}`, { performance });
    return response;
  }

  async getDailyProgress(topicId: string): Promise<{
    minutes_spent: number;
    questions_completed: number;
    goal_progress: {
      time: number;
      questions: number;
    };
  }> {
    const response = await this.get<{
      minutes_spent: number;
      questions_completed: number;
      goal_progress: {
        time: number;
        questions: number;
      };
    }>(`/learning/daily-progress/${topicId}`);
    return response;
  }

  async getWeeklyProgress(topicId: string): Promise<{
    days: {
      date: string;
      minutes_spent: number;
      questions_completed: number;
    }[];
    goal_progress: {
      time: number;
      questions: number;
    };
  }> {
    const response = await this.get<{
      days: {
        date: string;
        minutes_spent: number;
        questions_completed: number;
      }[];
      goal_progress: {
        time: number;
        questions: number;
      };
    }>(`/learning/weekly-progress/${topicId}`);
    return response;
  }
}

// Export types
export type {
  LearningPath,
  LearningRecommendation,
  CreateLearningPathData,
  UpdateLearningPathData,
};
