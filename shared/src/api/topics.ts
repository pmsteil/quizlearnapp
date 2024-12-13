import { Topic, LessonPlan } from '../types';

export interface CreateTopicRequest {
  title: string;
  description: string;
  lessonPlan: LessonPlan;
}

export interface UpdateTopicRequest {
  title: string;
  description: string;
  lessonPlan: LessonPlan;
}

export interface TopicResponse {
  topic: Topic;
}

export interface TopicsResponse {
  topics: Topic[];
  total: number;
  page: number;
  pageSize: number;
}
