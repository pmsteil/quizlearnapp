import type { LucideIcon } from 'lucide-react';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: number;
  updated_at: number;
}

export type SubtopicStatus = 'current' | 'not-started' | 'in-progress' | 'completed' | 'upcoming';

export interface Subtopic {
  name: string;
  status: SubtopicStatus;
  icon?: LucideIcon;
}

export interface MainTopic {
  name: string;
  subtopics: Subtopic[];
}

export interface LessonPlan {
  mainTopics: MainTopic[];
  currentTopic: string;
  completedTopics: string[];
}

export interface Topic {
  id: string;
  user_id: string;
  title: string;
  description: string;
  progress: number;
  lesson_plan: LessonPlan;
  created_at: number;
  updated_at: number;
}

export interface RecommendedTopic {
  id: number;
  title: string;
  difficulty: number;
  duration: string;
  description: string;
}

export interface Metric {
  icon: React.ComponentType;
  label: string;
  value: string;
  color?: string;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Message {
  id: number;
  type: 'ai' | 'user' | 'question';
  content: string;
  question?: Question;
  selectedAnswer?: number;
  isCorrect?: boolean;
}
