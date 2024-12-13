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
  const [sortBy, setSort] = useState<'recent' | 'progress' | 'name'>('recent');
  const [configError, setConfigError] = useState<{title: string; message: string} | null>(null);

  const {
    data: topics,
    error: topicsError,
    loading: isLoading,
    execute: fetchTopics,
  } = useAsync(
    () => {
      if (!user?.id) throw new Error('User not authenticated');
      return topicsService.getUserTopics(user.id);
    },
    {
      onError: (error) => {
        showToast('Error loading topics', 'error');
      },
    }
  );

  const {
    error: createError,
    execute: createTopic,
    loading: isCreating,
  } = useAsync(
    (data: { title: string; description: string; userId: string }) => {
      return topicsService.createTopic(data);
    },
    {
      onSuccess: () => {
        showToast('Topic created successfully', 'success');
        fetchTopics();
      },
      onError: (error) => {
        showToast('Error creating topic', 'error');
      },
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
    if (!user?.id) {
      showToast('Please log in to create a topic', 'error');
      return;
    }

    try {
      await createTopic({
        title: data.title,
        description: data.description,
        userId: user.id
      });
      showToast('Topic created successfully', 'success');
      // closeDialog(); // This function is not defined in the provided code
    } catch (error) {
      console.error('Error creating topic:', error);
      showToast('Failed to create topic', 'error');
    }
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

  if (topicsError) {
    return (
      <ErrorMessage
        title="Failed to load topics"
        message={topicsError.message}
      />
    );
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
              <Button variant="outline">Sort By</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
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

      {!sortedTopics?.length ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No topics yet. Create your first topic to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedTopics.map((topic) => (
            <TopicItem
              key={topic.id}
              topic={topic}
              onSelect={() => navigate(`/topic/${topic.id}`)}
            />
          ))}
        </div>
      )}

      <NewTopicForm onSubmit={handleCreateTopic} isCreating={isCreating} />
    </div>
  );
}
