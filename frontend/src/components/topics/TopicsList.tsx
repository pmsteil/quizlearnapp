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
      console.log('Fetching topics for user:', user.id);
      return topicsService.getUserTopics(user.id);
    },
    {
      onSuccess: (data) => {
        console.log('Topics fetched successfully:', data);
      },
      onError: (error) => {
        console.error('Error loading topics:', error);
        if (error.message.includes('not found')) {
          showToast('Please log out and log back in', 'error');
        } else {
          showToast('Error loading topics', 'error');
        }
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
      console.log('Fetching topics for user:', user.id);
      fetchTopics();
    }
  }, [user?.id]);

  const sortedTopics = useMemo(() => {
    if (!topics || !Array.isArray(topics)) {
      console.log('Topics is not an array:', topics);
      return [];
    }
    
    const topicsCopy = [...topics];
    console.log('Topics copy:', topicsCopy);
    switch (sortBy) {
      case 'recent':
        return topicsCopy.sort((a, b) => b.createdAt - a.createdAt);
      case 'name':
        return topicsCopy.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return topicsCopy;
    }
  }, [topics, sortBy]);

  useEffect(() => {
    console.log('Sorted topics:', sortedTopics);
  }, [sortedTopics]);

  const handleCreateTopic = async (title: string) => {
    if (!user?.id) {
      showToast('Please log in to create a topic', 'error');
      return;
    }

    try {
      console.log('Creating topic:', {
        title,
        userId: user.id
      });
      const topic = await createTopic({
        title,
        description: title, // Use title as description for now
        userId: user.id
      });
      showToast('Topic created successfully', 'success');
      navigate(`/topic/${topic.id}`);
    } catch (error) {
      console.error('Error creating topic:', error);
      if (error instanceof AppError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to create topic', 'error');
      }
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

  console.log('Rendering topics:', {
    topics,
    sortedTopics,
    isLoading,
    topicsError
  });

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

      <div className="rounded-xl border-2 border-primary/20 bg-card p-6 shadow-sm hover:border-primary/30 transition-colors relative">
        <NewTopicForm onSubmit={handleCreateTopic} isCreating={isCreating} />
      </div>

      {!sortedTopics?.length ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No topics yet. Create your first topic above!</p>
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
        </div>
      )}
    </div>
  );
}
