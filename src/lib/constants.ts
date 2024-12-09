import { Brain, Clock, BookOpen } from 'lucide-react';
import type { Topic, RecommendedTopic, Metric } from './types';

export const ACTIVE_TOPICS: Topic[] = [
  { id: 1, name: 'Python Basics', progress: 75, status: 'on-track', lastActivity: '2h ago' },
  { id: 2, name: 'JavaScript ES6+', progress: 45, status: 'behind', lastActivity: '1d ago' },
  { id: 3, name: 'React Hooks', progress: 90, status: 'ahead', lastActivity: '3h ago' },
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