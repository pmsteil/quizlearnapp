import { ApiClient } from '../client';
import { CreateQuestionRequest, UpdateQuestionRequest, QuestionResponse, QuestionsResponse } from '../questions';
import { Question } from '../../types';

export class QuestionsService {
  constructor(private client: ApiClient) {}

  async create(topicId: string, request: CreateQuestionRequest): Promise<Question> {
    const response = await this.client.post<QuestionResponse>(`/topics/${topicId}/questions`, request);
    return response.question;
  }

  async getByTopicId(topicId: string, page = 1, pageSize = 10): Promise<QuestionsResponse> {
    return this.client.get<QuestionsResponse>(`/topics/${topicId}/questions?page=${page}&pageSize=${pageSize}`);
  }

  async getById(topicId: string, questionId: string): Promise<Question> {
    const response = await this.client.get<QuestionResponse>(`/topics/${topicId}/questions/${questionId}`);
    return response.question;
  }

  async update(topicId: string, questionId: string, request: UpdateQuestionRequest): Promise<Question> {
    const response = await this.client.put<QuestionResponse>(`/topics/${topicId}/questions/${questionId}`, request);
    return response.question;
  }

  async delete(topicId: string, questionId: string): Promise<void> {
    await this.client.delete(`/topics/${topicId}/questions/${questionId}`);
  }
}
