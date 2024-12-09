import { LucideIcon } from 'lucide-react';

// Common types used across the dashboard
export interface Topic {
  id: number;
  name: string;
  progress: number;
  status: 'on-track' | 'behind' | 'ahead';
  lastActivity: string;
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