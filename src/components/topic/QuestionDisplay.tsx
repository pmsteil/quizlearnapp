import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import type { Question } from '@/lib/types';

interface QuestionDisplayProps {
  question: Question;
  selectedAnswer?: number;
  isCorrect?: boolean;
  onAnswerSelect?: (questionId: number, answerIndex: number) => void;
}

export function QuestionDisplay({ 
  question, 
  selectedAnswer, 
  isCorrect, 
  onAnswerSelect 
}: QuestionDisplayProps) {
  return (
    <div className="space-y-4">
      <p className="text-card-foreground">{question.text}</p>
      <div className="grid gap-2">
        {question.options.map((option, index) => (
          <Button
            key={index}
            variant={selectedAnswer === index ? 
              (isCorrect ? 'success' : 'destructive') : 
              'secondary'}
            className="justify-start"
            onClick={() => onAnswerSelect?.(question.id, index)}
            disabled={selectedAnswer !== undefined}
          >
            {option}
          </Button>
        ))}
      </div>
      {selectedAnswer !== undefined && (
        <div className={`flex items-center gap-2 mt-4 ${
          isCorrect ? 'text-green-500' : 'text-red-500'
        }`}>
          {isCorrect ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>
            {isCorrect ? 'Correct!' : 'Not quite right.'}
          </span>
        </div>
      )}
    </div>
  );
}