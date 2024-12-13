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
    console.log(`Fetching topic with id: ${id}`);
    try {
      const response = await this.get(`/topics/${id}`);
      console.log('Topic fetch successful:', response);
      return response;
    } catch (error) {
      console.error('Error fetching topic:', {
        topicId: id,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      throw error;
    }
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
    try {
      const response = await this.post('/topics', payload);
      console.log('Topic created:', response);
      return response;
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  }

  async updateTopic(id: string, data: Partial<CreateTopicData>): Promise<Topic> {
    return this.put(`/topics/${id}`, data);
  }

  async deleteTopic(id: string): Promise<void> {
    return this.delete(`/topics/${id}`);
  }
}

export const topicsService = TopicsService.getInstance();
