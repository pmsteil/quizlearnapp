import { useState, useCallback } from 'react';
import { useAsync } from './useAsync';
import { questionsService } from '../services';
import type {
  Question,
  QuestionOption,
  CreateQuestionData,
} from '../services/questions.service';
import { useToast } from '../contexts/toast.context';

interface UseQuestionsOptions {
  onQuestionLoad?: (questions: Question[]) => void;
  onAnswerSubmit?: (result: { correct: boolean; explanation?: string }) => void;
  onError?: (error: Error) => void;
}

export function useQuestions(topicId: string, options: UseQuestionsOptions = {}) {
  const { showToast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<{
    [key: string]: {
      correct: boolean;
      selectedOption: string;
      explanation?: string;
    };
  }>({});

  const {
    execute: fetchQuestions,
    error: questionsError,
  } = useAsync(
    () => questionsService.getQuestionsByTopic(topicId),
    {
      onSuccess: (loadedQuestions) => {
        setQuestions(loadedQuestions);
        options.onQuestionLoad?.(loadedQuestions);
      },
      onError: options.onError,
      loadingKey: `fetchQuestions_${topicId}`,
    }
  );

  const fetchQuestionsBySubtopic = useCallback(
    async (subtopic: string) => {
      try {
        const loadedQuestions = await questionsService.getQuestionsBySubtopic(
          topicId,
          subtopic
        );
        setQuestions(loadedQuestions);
        options.onQuestionLoad?.(loadedQuestions);
        return loadedQuestions;
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [topicId, options]
  );

  const generateQuestions = useCallback(
    async (subtopic: string, count: number = 5) => {
      try {
        const generatedQuestions = await questionsService.generateQuestions(
          topicId,
          subtopic,
          count
        );
        setQuestions(prev => [...prev, ...generatedQuestions]);
        options.onQuestionLoad?.(generatedQuestions);
        return generatedQuestions;
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [topicId, options]
  );

  const submitAnswer = useCallback(
    async (questionId: string, answerId: string) => {
      try {
        const { correct, explanation } = await questionsService.submitAnswer(questionId, answerId);

        const result = { correct, explanation };

        setAnsweredQuestions(prev => ({
          ...prev,
          [questionId]: {
            correct,
            selectedOption: answerId,
            explanation,
          },
        }));

        options.onAnswerSubmit?.(result);

        showToast(
          correct ? 'Correct answer!' : 'Incorrect answer',
          correct ? 'success' : 'error'
        );

        return result;
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [options, showToast]
  );

  const createQuestion = useCallback(
    async (data: Omit<CreateQuestionData, 'topic_id'>) => {
      try {
        const newQuestion = await questionsService.createQuestion({
          topic_id: topicId,
          ...data,
        });
        setQuestions(prev => [...prev, newQuestion]);
        showToast('Question created successfully', 'success');
        return newQuestion;
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [topicId, options, showToast]
  );

  const updateQuestion = useCallback(
    async (questionId: string, data: {
      text?: string;
      type?: Question['type'];
      difficulty?: Question['difficulty'];
      options?: Omit<QuestionOption, 'id'>[];
      explanation?: string;
      subtopic?: string;
    }) => {
      try {
        const updatedQuestion = await questionsService.updateQuestion(questionId, data);
        setQuestions(prev =>
          prev.map(q => (q.id === questionId ? updatedQuestion : q))
        );
        showToast('Question updated successfully', 'success');
        return updatedQuestion;
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [options, showToast]
  );

  const deleteQuestion = useCallback(
    async (questionId: string) => {
      try {
        await questionsService.deleteQuestion(questionId);
        setQuestions(prev => prev.filter(q => q.id !== questionId));
        showToast('Question deleted successfully', 'success');
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [options, showToast]
  );

  const setQuestion = useCallback((question: Question | null) => {
    setCurrentQuestion(question);
  }, []);

  const getNextUnansweredQuestion = useCallback(() => {
    const nextQuestion = questions.find(q => !answeredQuestions[q.id]);
    setCurrentQuestion(nextQuestion || null);
    return nextQuestion || null;
  }, [questions, answeredQuestions]);

  return {
    questions,
    currentQuestion,
    answeredQuestions,
    questionsError,
    fetchQuestions,
    fetchQuestionsBySubtopic,
    generateQuestions,
    submitAnswer,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    setQuestion,
    getNextUnansweredQuestion,
  };
}
