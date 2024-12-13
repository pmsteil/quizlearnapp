import { LucideIcon } from 'lucide-react';

export interface Metric {
  icon: LucideIcon;
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