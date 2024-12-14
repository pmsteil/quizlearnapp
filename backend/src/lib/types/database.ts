export interface User {
  userId: string;
  email: string;
  password: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

export interface DatabaseConfig {
  url: string;
  authToken?: string;
}

export interface Topic {
  topicId: number;
  title: string;
  description: string;
  difficulty: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Lesson {
  lessonId: number;
  topicId: number;
  title: string;
  content: string;
  orderIndex: number;
  parentLessonId: number | null;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserTopic {
  userId: string;
  topicId: number;
  currentLessonId: number | null;
  goalText: string;
  targetDate: Date | null;
  startedAt: Date;
  lastAccessed: Date;
}

export interface UserLessonProgress {
  lessonId: number;
  userId: string;
  status: string;
  timeSpentMinutes: number;
  lastInteractionAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface UserLessonChatHistory {
  chatId: number;
  userId: string;
  topicId: number;
  lessonId: number;
  isUserMessage: boolean;
  messageText: string;
  createdAt: Date;
}
