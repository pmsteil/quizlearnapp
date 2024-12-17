// Topic and Lesson Types
export interface Topic {
  topic_id: string;
  title: string;
  description: string | null;
  created_at: number;
  updated_at: number;
}

export interface TopicLesson {
  lesson_id: string;
  topic_id: string;
  title: string;
  content: string;
  order_index: number;
  parent_lesson_id: string | null;
  created_at: number;
  updated_at: number;
  children?: TopicLesson[];
}

// Progress Types
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface UserLessonProgress {
  progress_id: string;
  user_id: string;
  lesson_id: string;
  status: ProgressStatus;
  last_interaction_at: number;
  completion_date: number | null;
}

// Message Types for Chat (Phase 9)
export type MessageType = 'user' | 'ai';

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  created_at?: number;
}
