import type { Question } from '../types';

export interface ChatMessage {
  id: number;
  type: 'ai' | 'user' | 'question';
  content: string;
  question?: Question;
  selectedAnswer?: number;
  isCorrect?: boolean;
}

export interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}