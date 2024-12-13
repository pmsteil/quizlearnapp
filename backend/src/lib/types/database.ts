export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseConfig {
  url: string;
  authToken?: string;
}

export interface Topic {
  id: string;
  userId: string;
  title: string;
  description: string;
  progress: number;
  lessonPlan: LessonPlan;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonPlan {
  mainTopics: MainTopic[];
  currentTopic: string;
  completedTopics: string[];
}

export interface MainTopic {
  name: string;
  subtopics: Subtopic[];
}

export interface Subtopic {
  name: string;
  status: 'not-started' | 'in-progress' | 'current' | 'completed' | 'upcoming';
  icon?: string;
}
