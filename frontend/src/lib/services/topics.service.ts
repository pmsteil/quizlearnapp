import { ApiClient } from '../api';

export interface Topic {
  id: string;
  userId: string;
  title: string;
  description: string;
  lessonPlan: {
    mainTopics: Array<{
      name: string;
      subtopics: Array<{
        name: string;
        status: 'current' | 'upcoming' | 'completed';
      }>;
    }>;
    currentTopic: string;
    completedTopics: string[];
  };
  createdAt: number;
  updatedAt: number;
}

export interface LessonPlan {
  mainTopics: Array<{
    name: string;
    subtopics: Array<{
      name: string;
      status: 'current' | 'upcoming' | 'completed';
    }>;
  }>;
  currentTopic: string;
  completedTopics: string[];
}

export interface CreateTopicData {
  userId: string;
  title: string;
  description: string;
  lessonPlan?: {
    mainTopics: any[];
    currentTopic: string;
    completedTopics: string[];
  };
}

export class TopicsService extends ApiClient {
  private static instance: TopicsService;

  private constructor() {
    super('http://localhost:3000/api/v1');  
  }

  public static getInstance(): TopicsService {
    if (!TopicsService.instance) {
      TopicsService.instance = new TopicsService();
    }
    return TopicsService.instance;
  }

  async getUserTopics(userId: string): Promise<Topic[]> {
    return this.get(`/topics/user/${userId}`);
  }

  async getTopic(id: string): Promise<Topic> {
    return this.get(`/topics/${id}`);
  }

  async createTopic(data: CreateTopicData): Promise<Topic> {
    const defaultLessonPlan = {
      mainTopics: [],
      currentTopic: "",
      completedTopics: []
    };

    const payload = {
      ...data,
      lessonPlan: data.lessonPlan || defaultLessonPlan
    };

    console.log('Creating topic with payload:', payload);
    return this.post('/topics', payload);
  }

  async updateTopic(id: string, data: Partial<CreateTopicData>): Promise<Topic> {
    return this.put(`/topics/${id}`, data);
  }

  async deleteTopic(id: string): Promise<void> {
    return this.delete(`/topics/${id}`);
  }
}

export const topicsService = TopicsService.getInstance();
