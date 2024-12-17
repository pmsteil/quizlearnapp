import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/auth.context';
import { toast } from '@/components/ui/use-toast';
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
import { TokenManager } from '@/lib/utils/token'; // Import TokenManager
import { AppError } from '@/lib/error'; // Import AppError

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
  const { user, isLoading: isAuthLoading } = useAuth();
  const [sortBy, setSort] = useState<'recent' | 'progress' | 'name'>('recent');
  const [configError, setConfigError] = useState<{title: string; message: string} | null>(null);

  const {
    data: topics,
    error: topicsError,
    loading: isTopicsLoading,
    execute: fetchTopics,
  } = useAsync(
    () => {
      const tokenData = TokenManager.getTokenData();
      if (!tokenData?.user?.id) {
        console.log('No user ID found in token data');
        throw new Error('User not authenticated');
      }
      console.log('Fetching topics for user:', tokenData.user.id);
      return topicsService.getUserTopics(tokenData.user.id);
    },
    {
      onError: (error) => {
        if (error instanceof z.ZodError) {
          const configError = validateConfig(error);
          setConfigError(configError);
        } else {
          toast({
            title: "Error",
            description: "Failed to load topics",
            variant: "destructive",
          });
        }
      },
      deps: []  // Empty deps since we'll handle user changes separately
    }
  );

  useEffect(() => {
    const tokenData = TokenManager.getTokenData();
    if (tokenData?.user?.id) {
      console.log('Fetching topics on mount or token change');
      fetchTopics();
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && user?.id) {
      console.log('Fetching topics because auth state changed');
      fetchTopics();
    }
  }, [user?.id, isAuthLoading]);

  const sortedTopics = useMemo(() => {
    if (!topics) return [];

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

  const handleTopicClick = (topic: Topic) => {
    navigate(`/topic/${topic.topic_id}`);
  };

  const handleCreateTopic = async (title: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please log in to create a topic",
        variant: "destructive",
      });
      return;
    }

    try {
      const tokenData = TokenManager.getTokenData();
      console.log('Token data when creating topic:', {
        hasToken: !!tokenData?.access_token,
        user: tokenData?.user
      });
      
      console.log('Creating topic:', {
        title,
        user_id: user.id
      });
      const topic = await createTopic({
        user_id: user.id,
        title,
        description: title, // Use title as description for now
      });
      toast({
        title: "Success",
        description: "Topic created successfully",
      });
      navigate(`/topic/${topic.topic_id}`);
    } catch (error) {
      console.error('Error creating topic:', error);
      if (error instanceof AppError) {
        toast({
          title: "Error",
          description: error.toString(),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred while creating the topic",
          variant: "destructive",
        });
      }
    }
  };

  const {
    loading: isCreating,
    error: createError,
    execute: createTopic,
  } = useAsync(
    async (data: CreateTopicData) => {
      if (!user?.id) throw new Error('User not authenticated');
      const topic = await topicsService.createTopic(data);
      await fetchTopics();
      return topic;
    },
    {
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to create topic",
          variant: "destructive",
        });
      },
    }
  );

  if (configError) {
    return (
      <ErrorMessage
        title={configError.title}
        message={configError.message}
      />
    );
  }

  if (isAuthLoading || isTopicsLoading) {
    return <TopicSkeleton />;
  }

  return (
    <div className="space-y-4 px-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Topics</h2>
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="outline"
            onClick={() => fetchTopics()}
            disabled={isTopicsLoading}
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

      <div className="rounded-xl border-2 border-primary/20 bg-card px-6 py-6 shadow-sm hover:border-primary/30 transition-colors relative">
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
              key={topic.topic_id}
              topic={topic}
              onClick={() => handleTopicClick(topic)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
