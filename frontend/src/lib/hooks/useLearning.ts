import { useState, useCallback } from 'react';
import { useAsync } from './useAsync';
import { learningService } from '../services';
import type { LearningPath, LearningRecommendation } from '../services/learning.service';
import { useToast } from '../contexts/toast.context';

interface UseLearningOptions {
  onPathUpdate?: (path: LearningPath) => void;
  onError?: (error: Error) => void;
}

export function useLearning(topicId: string, options: UseLearningOptions = {}) {
  const { showToast } = useToast();
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [recommendation, setRecommendation] = useState<LearningRecommendation | null>(null);

  const {
    execute: fetchLearningPath,
    error: pathError,
  } = useAsync(
    () => learningService.getLearningPath(topicId),
    {
      onSuccess: (path) => {
        setLearningPath(path);
        options.onPathUpdate?.(path);
      },
      onError: (error) => {
        options.onError?.(error);
      },
      loadingKey: `fetchLearningPath_${topicId}`,
    }
  );

  const {
    execute: fetchRecommendation,
    error: recommendationError,
  } = useAsync(
    () => learningService.getNextRecommendation(topicId),
    {
      onSuccess: setRecommendation,
      onError: options.onError,
      loadingKey: `fetchRecommendation_${topicId}`,
    }
  );

  const createLearningPath = useCallback(
    async (data: {
      difficulty_level: LearningPath['difficulty_level'];
      pace: LearningPath['pace'];
      daily_goal_minutes: number;
      weekly_goal_questions: number;
    }) => {
      try {
        const path = await learningService.createLearningPath({
          topic_id: topicId,
          ...data,
        });
        setLearningPath(path);
        options.onPathUpdate?.(path);
        showToast('Learning path created successfully', 'success');
        return path;
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [topicId, options, showToast]
  );

  const updateLearningPath = useCallback(
    async (data: {
      difficulty_level?: LearningPath['difficulty_level'];
      pace?: LearningPath['pace'];
      daily_goal_minutes?: number;
      weekly_goal_questions?: number;
    }) => {
      try {
        const path = await learningService.updateLearningPath(topicId, data);
        setLearningPath(path);
        options.onPathUpdate?.(path);
        showToast('Learning path updated successfully', 'success');
        return path;
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [topicId, options, showToast]
  );

  const completeSubtopic = useCallback(
    async (subtopic: string) => {
      try {
        const result = await learningService.markSubtopicComplete(topicId, subtopic);
        if (result.success) {
          showToast('Subtopic completed successfully', 'success');
          // Refresh learning path and recommendation
          await fetchLearningPath();
          await fetchRecommendation();
        }
        return result;
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [topicId, options, showToast, fetchLearningPath, fetchRecommendation]
  );

  const adjustDifficulty = useCallback(
    async (performance: 'too_easy' | 'just_right' | 'too_hard') => {
      try {
        const result = await learningService.adjustDifficulty(topicId, performance);
        showToast('Difficulty adjusted successfully', 'success');
        // Refresh learning path and recommendation
        await fetchLearningPath();
        await fetchRecommendation();
        return result;
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [topicId, options, showToast, fetchLearningPath, fetchRecommendation]
  );

  const generateMaterials = useCallback(
    async (subtopic: string) => {
      try {
        const materials = await learningService.generateLearningMaterials(topicId, subtopic);
        return materials;
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [topicId, options]
  );

  return {
    learningPath,
    recommendation,
    pathError,
    recommendationError,
    fetchLearningPath,
    fetchRecommendation,
    createLearningPath,
    updateLearningPath,
    completeSubtopic,
    adjustDifficulty,
    generateMaterials,
  };
}
