import { Brain, Clock, BookOpen } from 'lucide-react';
import type { Topic, RecommendedTopic, Metric } from './types';

export const ACTIVE_TOPICS: Topic[] = [
  {
    id: "1",
    title: 'Python Basics',
    description: 'Learn Python fundamentals',
    progress: 75,
    user_id: "1",
    lesson_plan: {
      mainTopics: [],
      currentTopic: '',
      completedTopics: []
    },
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000)
  },
  {
    id: "2",
    title: 'JavaScript ES6+',
    description: 'Master modern JavaScript',
    progress: 45,
    user_id: "1",
    lesson_plan: {
      mainTopics: [],
      currentTopic: '',
      completedTopics: []
    },
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000)
  },
  {
    id: "3",
    title: 'React Hooks',
    description: 'Learn React hooks in depth',
    progress: 90,
    user_id: "1",
    lesson_plan: {
      mainTopics: [],
      currentTopic: '',
      completedTopics: []
    },
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000)
  },
];

export const RECOMMENDED_TOPICS: RecommendedTopic[] = [
  {
    id: 1,
    title: 'Advanced TypeScript',
    difficulty: 4,
    duration: '2.5 hours',
    description: 'Master generic types and advanced TS features',
  },
  {
    id: 2,
    title: 'React Performance',
    difficulty: 3,
    duration: '3 hours',
    description: 'Learn optimization techniques for React apps',
  },
  {
    id: 3,
    title: 'Node.js Microservices',
    difficulty: 5,
    duration: '4 hours',
    description: 'Build scalable microservices architecture',
  },
];

export const FOOTER_METRICS: Metric[] = [
  {
    icon: Brain,
    label: 'Questions Answered',
    value: '1,234',
  },
  {
    icon: Clock,
    label: 'Learning Time',
    value: '48h 23m',
  },
  {
    icon: BookOpen,
    label: 'Active Topics',
    value: '5',
  },
];

export const CONSTANTS = {
  SALT_ROUNDS: "10",
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d",
  MIN_PASSWORD_LENGTH: "8",
  MAX_PASSWORD_LENGTH: "100",
  MAX_NAME_LENGTH: "50",
} as const;
