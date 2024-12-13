import { Progress, TopicProgress } from '../types';

export interface RecordProgressRequest {
  questionId: string;
  isCorrect: boolean;
}

export interface ProgressResponse {
  progress: Progress;
}

export interface TopicProgressResponse {
  progress: TopicProgress;
}

export interface ProgressListResponse {
  progressList: Progress[];
  total: number;
  page: number;
  pageSize: number;
}
