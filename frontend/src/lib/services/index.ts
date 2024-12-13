import { AuthService } from './auth.service';
import { TopicsService } from './topics.service';
import { QuestionsService } from './questions.service';
import { ProgressService } from './progress.service';
import { LearningService } from './learning.service';
import { env } from '../config/env';

// Update API_URL to use env config
const API_URL = env.apiUrl;

export const authService = new AuthService({ baseURL: API_URL });
export const topicsService = new TopicsService({ baseURL: API_URL });
export const questionsService = new QuestionsService({ baseURL: API_URL });
export const progressService = new ProgressService({ baseURL: API_URL });
export const learningService = new LearningService({ baseURL: API_URL });

// Export types
export type { User } from './auth.service';
export type { Topic, CreateTopicData, UpdateTopicData } from './topics.service';
export type { Question, QuestionOption, CreateQuestionData, UpdateQuestionData } from './questions.service';
export type { Progress, TopicProgress, SubtopicProgress, ProgressStats } from './progress.service';
export type { LearningPath, LearningRecommendation } from './learning.service';
