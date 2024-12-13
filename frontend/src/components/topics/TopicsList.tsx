import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/auth.context';
import { useToast } from '@/lib/contexts/toast.context';
import { TopicItem } from './TopicItem';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCcw } from 'lucide-react';
import { z } from 'zod';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ErrorMessage } from '@/components/ui/error-message';
import { validateConfig } from '@/lib/config/validate';
import { NewTopicForm } from './NewTopicForm';
import { useAsync } from '@/lib/hooks/useAsync';
import { topicsService } from '@/lib/services';
import type { Topic, CreateTopicData } from '@/lib/services';

// Loading skeleton component
function TopicSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-1/3 bg-muted rounded" />
      <div className="space-y-3">
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-24 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

export default function TopicsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sortBy, setSort] = useState<'recent' | 'progress' | 'name'>('recent');
  const [configError, setConfigError] = useState<{title: string; message: string} | null>(null);

  const {
    execute: fetchTopics,
    error: topicsError,
    loading: isLoading,
  } = useAsync(
    () => topicsService.getUserTopics(user?.id!),
    {
      onSuccess: (loadedTopics) => {
        setTopics(loadedTopics);
      },
      onError: (error) => {
        showToast(error.message, 'error');
      },
      loadingKey: 'fetchTopics',
    }
  );

  const {
    execute: createTopic,
    loading: isCreating,
  } = useAsync(
    (title: string, description: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const defaultLessonPlan = {
        mainTopics: [{
          name: "Learning Path",
          subtopics: [
            { name: 'Introduction', status: 'current' },
            { name: 'Basic Concepts', status: 'upcoming' },
            { name: 'Practice Exercises', status: 'upcoming' },
            { name: 'Advanced Topics', status: 'upcoming' },
            { name: 'Final Review', status: 'upcoming' }
          ]
        }],
        currentTopic: 'Introduction',
        completedTopics: []
      };

      return topicsService.createTopic(
        user.id,
        title,
        description,
        defaultLessonPlan
      );
    },
    {
      onSuccess: (topic) => {
        setTopics(prev => [...prev, topic]);
        showToast('Topic created successfully', 'success');
        navigate(`/topic/${topic.id}`);
      },
      onError: (error) => {
        showToast(error.message, 'error');
      },
      loadingKey: 'createTopic',
    }
  );

  useEffect(() => {
    if (!user?.id) return;

    const config = validateConfig();
    if (!config.isValid && config.error) {
      setConfigError({
        title: config.error.title,
        message: `${config.error.message}\n\nMissing: ${config.error.details}`
      });
      return;
    }

    fetchTopics();
  }, [user?.id, fetchTopics]);

  const handleCreateTopic = useCallback(async (title: string) => {
    await createTopic(
      title,
      'Start your learning journey with personalized guidance'
    );
  }, [createTopic]);

  const sortedTopics = useMemo(() => {
    return [...topics].sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.progress - a.progress;
        case 'name':
          return a.title.localeCompare(b.title);
        case 'recent':
        default:
          return b.updated_at - a.updated_at;
      }
    });
  }, [topics, sortBy]);

  if (configError) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-bold">Setup Required</h2>
          <ErrorMessage
            title={configError.title}
            message={configError.message}
            className="mt-4"
          />
          <div className="mt-4 text-sm text-muted-foreground">
            Please check the console for configuration details.
          </div>
        </div>
      </div>
    );
  }

  if (topicsError) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-bold">Your Topics</h2>
          <ErrorMessage
            title="Error Loading Topics"
            message={topicsError.message}
            className="mt-4"
          />
          <Button
            onClick={() => fetchTopics()}
            className="mt-4"
            variant="outline"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <TopicSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Your Topics</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Sort by</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSort('recent')}>
                Recent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort('progress')}>
                Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort('name')}>
                Name
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <NewTopicForm
          onSubmit={handleCreateTopic}
          isCreating={isCreating}
        />

        {topics.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground">
              No topics yet. Start your first learning journey!
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sortedTopics.map((topic) => (
              <TopicItem key={topic.id} topic={topic} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
