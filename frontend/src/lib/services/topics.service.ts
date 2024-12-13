import { ApiClient } from '../api';

export class TopicsService extends ApiClient {
  private static instance: TopicsService;

  private constructor() {
    super('/api/topics');
  }

  public static getInstance(): TopicsService {
    if (!TopicsService.instance) {
      TopicsService.instance = new TopicsService();
    }
    return TopicsService.instance;
  }

  async getTopics() {
    return this.get('/');
  }

  async getTopic(id: string | number) {
    return this.get(`/${id}`);
  }
}

export const topicsService = TopicsService.getInstance();
