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
    if (user?.id) {
      fetchTopics();
    }
  }, [user?.id]);

  const sortedTopics = useMemo(() => {
    if (!topics) return [];
    
    const topicsCopy = [...topics];
    switch (sortBy) {
      case 'recent':
        return topicsCopy.sort((a, b) => b.createdAt - a.createdAt);
      case 'name':
        return topicsCopy.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return topicsCopy;
    }
  }, [topics, sortBy]);

  const handleCreateTopic = async (data: { title: string; description: string }) => {
    await createTopic(data.title, data.description);
  };

  if (configError) {
    return (
      <ErrorMessage
        title={configError.title}
        message={configError.message}
      />
    );
  }

  if (isLoading) {
    return <TopicSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Your Topics</h2>
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="outline"
            onClick={() => fetchTopics()}
            disabled={isLoading}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Sort by: {sortBy}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSort('recent')}>
                Most Recent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort('name')}>
                Name
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {topicsError ? (
        <ErrorMessage
          title="Failed to load topics"
          message={topicsError.message}
        />
      ) : sortedTopics.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No topics yet. Create your first topic to get started!</p>
          <NewTopicForm onSubmit={handleCreateTopic} isLoading={isCreating} />
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedTopics.map((topic) => (
            <TopicItem
              key={topic.id}
              topic={topic}
              onClick={() => navigate(`/topic/${topic.id}`)}
            />
          ))}
          <NewTopicForm onSubmit={handleCreateTopic} isLoading={isCreating} />
        </div>
      )}
    </div>
  );
}
