import { AuthService } from './auth.service';
import { TopicsService } from './topics.service';
import { env } from '../config/env';

// Update API_URL to use env config
const API_URL = env.apiUrl;

export const authService = AuthService.getInstance();
export const topicsService = TopicsService.getInstance();

// Export types
export type { User } from './auth.service';
export type { Topic, CreateTopicData, UpdateTopicData } from './topics.service';
