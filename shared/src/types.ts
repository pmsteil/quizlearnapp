import { DateTime } from 'luxon';

export interface User {
    id: string;
    email: string;
    name: string;
    roles: string[];
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface Topic {
    id: string;
    userId: string;
    title: string;
    description: string;
    progress: number;
    lessonPlan: LessonPlan;
    createdAt: DateTime;
    updatedAt: DateTime;
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

export interface Question {
    id: string;
    topicId: string;
    text: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface Progress {
    id: string;
    userId: string;
    topicId: string;
    questionId: string;
    isCorrect: boolean;
    createdAt: DateTime;
}

export interface TopicProgress {
    correctAnswers: number;
    incorrectAnswers: number;
    totalQuestions: number;
    timeSpentMinutes: number;
}
