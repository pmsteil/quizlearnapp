import { ApiClient } from '../api';

export interface Topic {
  user_id: string;
  id: string;
  title: string;
  description: string;
  lessonPlan: LessonPlan;
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
  user_id: string;
  title: string;
  description: string;
  lessonPlan?: LessonPlan;
}

export interface UpdateTopicData {
  user_id: string;
  title?: string;
  description?: string;
  lessonPlan?: LessonPlan;
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

  async getUserTopics(user_id: string): Promise<Topic[]> {
    return this.get(`/topics/user/${user_id}`);
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
      mainTopics: [
        {
          name: "Getting Started",
          subtopics: [
            { name: "Introduction", status: "current" },
            { name: "Basic Concepts", status: "upcoming" },
            { name: "Key Terms", status: "upcoming" }
          ]
        },
        {
          name: "Core Concepts",
          subtopics: [
            { name: "Overview", status: "upcoming" },
            { name: "Fundamentals", status: "upcoming" },
            { name: "Advanced Topics", status: "upcoming" }
          ]
        }
      ],
      currentTopic: "Introduction",
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

  async updateTopic(id: string, data: UpdateTopicData): Promise<Topic> {
    // Convert from camelCase to snake_case for the backend
    const payload = {
      ...data,
      lesson_plan: data.lessonPlan
    };
    delete payload.lessonPlan;

    console.log('Updating topic with payload:', payload);
    try {
      const response = await this.put(`/topics/${id}`, payload);
      console.log('Topic updated:', response);
      return response;
    } catch (error) {
      console.error('Error updating topic:', error);
      throw error;
    }
  }

  async deleteTopic(id: string): Promise<void> {
    return this.delete(`/topics/${id}`);
  }
}

export const topicsService = TopicsService.getInstance();
