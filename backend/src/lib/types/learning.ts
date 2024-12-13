import { LucideIcon } from 'lucide-react';

export interface SubTopic {
  name: string;
  icon?: LucideIcon;
}

export interface Topic {
  name: string;
  icon: LucideIcon;
  subtopics: SubTopic[];
}

export interface LearningPlan {
  mainTopics: Topic[];
}