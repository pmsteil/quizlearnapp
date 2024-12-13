import { createContext, useContext, ReactNode } from 'react';
import { useLearningProgress } from '../hooks/useLearningProgress';
import { useTimer } from '../hooks/useTimer';

interface LearningContextType {
  progress: {
    correct: number;
    incorrect: number;
    remaining: number;
    timeSpent: number;
    accuracy: number;
  };
  updateProgress: (isCorrect: boolean) => void;
  time: {
    minutes: number;
    seconds: number;
  };
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ 
  children, 
  totalQuestions 
}: { 
  children: ReactNode;
  totalQuestions: number;
}) {
  const { progress, updateProgress, updateTimeSpent } = useLearningProgress(totalQuestions);
  const time = useTimer(updateTimeSpent);

  return (
    <LearningContext.Provider value={{ progress, updateProgress, time }}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
}