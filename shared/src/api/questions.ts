import { Question } from '../types';

export interface CreateQuestionRequest {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface UpdateQuestionRequest {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuestionResponse {
  question: Question;
}

export interface QuestionsResponse {
  questions: Question[];
  total: number;
  page: number;
  pageSize: number;
}
