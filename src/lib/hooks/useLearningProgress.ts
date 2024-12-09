import { useState } from 'react';

interface Progress {
  correct: number;
  incorrect: number;
  remaining: number;
  timeSpent: number;
  accuracy: number;
}

export function useLearningProgress(totalQuestions: number) {
  const [progress, setProgress] = useState<Progress>({
    correct: 0,
    incorrect: 0,
    remaining: totalQuestions,
    timeSpent: 0,
    accuracy: 0
  });

  const updateProgress = (isCorrect: boolean) => {
    setProgress(prev => {
      const correct = isCorrect ? prev.correct + 1 : prev.correct;
      const incorrect = isCorrect ? prev.incorrect : prev.incorrect + 1;
      const total = correct + incorrect;
      
      return {
        correct,
        incorrect,
        remaining: totalQuestions - total,
        timeSpent: prev.timeSpent,
        accuracy: total > 0 ? (correct / total) * 100 : 0
      };
    });
  };

  const updateTimeSpent = (minutes: number) => {
    setProgress(prev => ({
      ...prev,
      timeSpent: prev.timeSpent + minutes
    }));
  };

  return {
    progress,
    updateProgress,
    updateTimeSpent
  };
}