import { DateTime } from 'luxon';

export interface User {
    user_id: string;
    email: string;
    name: string;
    roles: string[];
    created_at: DateTime;
    updated_at: DateTime;
}

export interface Topic {
    topic_id: number;
    user_id: string;
    title: string;
    description: string;
    difficulty: string;
    created_at: number;
    updated_at: number;
}

export interface TopicLesson {
    lesson_id: number;
    topic_id: number;
    title: string;
    content: string;
    order_index: number;
    parent_lesson_id: number | null;
    created_at: number;
    updated_at: number;
    children?: TopicLesson[];
}

export interface UserLessonProgress {
    progress_id: number;
    user_id: number;
    lesson_id: number;
    status: ProgressStatus;
    last_interaction_at: number;
    completion_date: number | null;
}

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
