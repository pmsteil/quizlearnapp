import { ApiClient } from '../api';

interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
  explanation?: string;
}

interface Question {
  id: string;
  topic_id: string;
  subtopic: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'open_ended';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  options: QuestionOption[];
  explanation?: string;
  created_at: number;
  updated_at: number;
}

interface CreateQuestionData {
  topic_id: string;
  subtopic: string;
  text: string;
  type: Question['type'];
  difficulty: Question['difficulty'];
  options: Omit<QuestionOption, 'id'>[];
  explanation?: string;
}

interface UpdateQuestionData {
  text?: string;
  type?: Question['type'];
  difficulty?: Question['difficulty'];
  options?: Omit<QuestionOption, 'id'>[];
  explanation?: string;
  subtopic?: string;
}

export class QuestionsService extends ApiClient {
  async getQuestionsByTopic(topicId: string) {
    return this.get<Question[]>(`/questions/topic/${topicId}`);
  }

  async getQuestionsBySubtopic(topicId: string, subtopic: string) {
    return this.get<Question[]>(`/questions/topic/${topicId}/subtopic/${subtopic}`);
  }

  async getQuestion(id: string) {
    return this.get<Question>(`/questions/${id}`);
  }

  async createQuestion(data: CreateQuestionData) {
    return this.post<Question>('/questions', data);
  }

  async updateQuestion(id: string, data: UpdateQuestionData) {
    return this.put<Question>(`/questions/${id}`, data);
  }

  async deleteQuestion(id: string) {
    return this.delete<void>(`/questions/${id}`);
  }

  async submitAnswer(questionId: string, answerId: string) {
    return this.post<{
      correct: boolean;
      explanation?: string;
    }>(`/questions/${questionId}/answer`, { answer_id: answerId });
  }

  async generateQuestions(topicId: string, subtopic: string, count: number = 5) {
    return this.post<Question[]>(`/questions/generate`, {
      topic_id: topicId,
      subtopic,
      count
    });
  }
}

// Export types
export type { Question, QuestionOption, CreateQuestionData, UpdateQuestionData };
