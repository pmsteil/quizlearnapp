import type { Topic, Question, LearningPlan } from '../types';

// Simulate API calls with local data for now
// Can be replaced with real API calls later
export const api = {
  async getTopics(): Promise<Topic[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          // ... topic data
        ]);
      }, 500);
    });
  },

  async getQuestions(topicId: number): Promise<Question[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          // ... question data
        ]);
      }, 500);
    });
  },

  async generateLearningPlan(topic: string, level: string): Promise<LearningPlan> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          // ... learning plan data
        });
      }, 1000);
    });
  }
};