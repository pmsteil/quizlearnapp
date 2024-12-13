import { QuestionDisplay } from './QuestionDisplay';
import type { Message } from '@/lib/types';

interface ChatMessageProps {
  message: Message;
  onAnswerSelect?: (questionId: number, answerIndex: number) => void;
}

export function ChatMessage({ message, onAnswerSelect }: ChatMessageProps) {
  return (
    <div
      className={`flex items-start space-x-3 ${
        message.type === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      {message.type === 'ai' && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-sm">🤖</span>
        </div>
      )}

      <div className={`chat-bubble ${message.type} rounded-xl p-4 max-w-[80%]`}>
        {message.type === 'question' && message.question ? (
          <QuestionDisplay
            question={message.question}
            selectedAnswer={message.selectedAnswer}
            isCorrect={message.isCorrect}
            onAnswerSelect={onAnswerSelect}
          />
        ) : (
          <p className="text-card-foreground">{message.content}</p>
        )}
      </div>

      {message.type === 'user' && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <span className="text-sm">PB</span>
        </div>
      )}
    </div>
  );
}