import { ApiClient } from '../client';
import { CreateTopicRequest, UpdateTopicRequest, TopicResponse, TopicsResponse } from '../topics';
import { Topic } from '../../types';

export class TopicsService {
  constructor(private client: ApiClient) {}

  async create(request: CreateTopicRequest): Promise<Topic> {
    const response = await this.client.post<TopicResponse>('/topics', request);
    return response.topic;
  }

  async getAll(page = 1, pageSize = 10): Promise<TopicsResponse> {
    return this.client.get<TopicsResponse>(`/topics?page=${page}&pageSize=${pageSize}`);
  }

  async getById(id: string): Promise<Topic> {
    const response = await this.client.get<TopicResponse>(`/topics/${id}`);
    return response.topic;
  }

  async update(id: string, request: UpdateTopicRequest): Promise<Topic> {
    const response = await this.client.put<TopicResponse>(`/topics/${id}`, request);
    return response.topic;
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`/topics/${id}`);
  }
}
