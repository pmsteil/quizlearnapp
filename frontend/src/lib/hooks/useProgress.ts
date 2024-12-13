import { useState, useCallback } from 'react';
import { useAsync } from './useAsync';
import { progressService } from '../services';
import type {
  TopicProgress,
  SubtopicProgress,
  ProgressStats,
} from '../services/progress.service';
import { useToast } from '../contexts/toast.context';

interface UseProgressOptions {
  onProgressUpdate?: (progress: TopicProgress) => void;
  onError?: (error: Error) => void;
}

export function useProgress(topicId: string, options: UseProgressOptions = {}) {
  const { showToast } = useToast();
  const [topicProgress, setTopicProgress] = useState<TopicProgress | null>(null);
  const [subtopicProgress, setSubtopicProgress] = useState<{
    [key: string]: SubtopicProgress;
  }>({});
  const [stats, setStats] = useState<ProgressStats | null>(null);

  const {
    execute: fetchTopicProgress,
    error: progressError,
  } = useAsync(
    () => progressService.getTopicProgress(topicId),
    {
      onSuccess: (progress) => {
        setTopicProgress(progress);
        options.onProgressUpdate?.(progress);
      },
      onError: options.onError,
      loadingKey: `fetchProgress_${topicId}`,
    }
  );

  const fetchSubtopicProgress = useCallback(
    async (subtopic: string) => {
      try {
        const progress = await progressService.getSubtopicProgress(topicId, subtopic);
        setSubtopicProgress(prev => ({
          ...prev,
          [subtopic]: progress,
        }));
        return progress;
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [topicId, options]
  );

  const fetchUserStats = useCallback(
    async (userId: string) => {
      try {
        const userStats = await progressService.getUserProgress(userId);
        setStats(userStats);
        return userStats;
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [options]
  );

  const recordProgress = useCallback(
    async (data: {
      question_id: string;
      is_correct: boolean;
      time_spent: number;
    }) => {
      try {
        await progressService.recordProgress({
          topic_id: topicId,
          ...data,
        });
        // Refresh progress after recording
        await fetchTopicProgress();
        showToast('Progress recorded successfully', 'success');
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [topicId, options, showToast, fetchTopicProgress]
  );

  const updateSubtopicStatus = useCallback(
    async (subtopic: string, status: SubtopicProgress['status']) => {
      try {
        await progressService.updateSubtopicStatus(topicId, subtopic, status);
        // Refresh progress after update
        await fetchTopicProgress();
        await fetchSubtopicProgress(subtopic);
        showToast('Subtopic status updated successfully', 'success');
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [topicId, options, showToast, fetchTopicProgress, fetchSubtopicProgress]
  );

  const fetchProgressHistory = useCallback(
    async (userId: string, startDate: Date, endDate: Date) => {
      try {
        const history = await progressService.getProgressHistory(userId, startDate, endDate);
        return history;
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [options]
  );

  const getDailyStreak = useCallback(
    async (userId: string) => {
      try {
        const streak = await progressService.getDailyStreak(userId);
        return streak;
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      }
    },
    [options]
  );

  return {
    topicProgress,
    subtopicProgress,
    stats,
    progressError,
    fetchTopicProgress,
    fetchSubtopicProgress,
    fetchUserStats,
    recordProgress,
    updateSubtopicStatus,
    fetchProgressHistory,
    getDailyStreak,
  };
}
