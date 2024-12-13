import { ApiClient } from '../client';
import { RecordProgressRequest, ProgressResponse, TopicProgressResponse, ProgressListResponse } from '../progress';
import { Progress, TopicProgress } from '../../types';

export class ProgressService {
  constructor(private client: ApiClient) {}

  async recordProgress(topicId: string, request: RecordProgressRequest): Promise<Progress> {
    const response = await this.client.post<ProgressResponse>(`/progress/topic/${topicId}`, request);
    return response.progress;
  }

  async getTopicProgress(topicId: string): Promise<TopicProgress> {
    const response = await this.client.get<TopicProgressResponse>(`/progress/topic/${topicId}`);
    return response.progress;
  }

  async getProgressHistory(topicId: string, page = 1, pageSize = 10): Promise<ProgressListResponse> {
    return this.client.get<ProgressListResponse>(
      `/progress/topic/${topicId}/history?page=${page}&pageSize=${pageSize}`
    );
  }
}
