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
    id: string;
    user_id: string;
    title: string;
    description: string;
    progress: number;
    lesson_plan: LessonPlan;
    created_at: DateTime;
    updated_at: DateTime;
}

export interface LessonPlan {
    main_topics: MainTopic[];
    current_topic: string;
    completed_topics: string[];
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

export interface Question {
    id: string;
    topic_id: string;
    text: string;
    options: string[];
    correct_answer: number;
    explanation: string;
    created_at: DateTime;
    updated_at: DateTime;
}

export interface Progress {
    id: string;
    user_id: string;
    topic_id: string;
    question_id: string;
    is_correct: boolean;
    created_at: DateTime;
}

export interface TopicProgress {
    correct_answers: number;
    incorrect_answers: number;
    total_questions: number;
    time_spent_minutes: number;
}
