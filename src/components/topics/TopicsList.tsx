import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TopicService } from '@/lib/services/topic';
import type { Topic } from '@/lib/types';
import type { LessonPlan } from '@/lib/types/database';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/context/AuthContext';
import { TopicItem } from './TopicItem';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { handleDbError } from '@/lib/db/client';
import { ErrorMessage } from '@/components/ui/error-message';
import { validateConfig } from '@/lib/config/validator';

export default function TopicsList() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newTopic, setNewTopic] = useState('');
  const [sortBy, setSort] = useState('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [configError, setConfigError] = useState<{title: string; message: string} | null>(null);

  const loadTopics = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const loadedTopics = await TopicService.getUserTopics(user.id);
      const convertedTopics: Topic[] = loadedTopics.map(topic => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        progress: topic.progress || 0,
        user_id: topic.userId,
        lesson_plan: {
          mainTopics: topic.lessonPlan.mainTopics.map(mainTopic => ({
            name: mainTopic.name,
            subtopics: mainTopic.subtopics.map(subtopic => ({
              name: subtopic.name,
              status: subtopic.status,
              icon: undefined
            }))
          })),
          currentTopic: topic.lessonPlan.currentTopic,
          completedTopics: topic.lessonPlan.completedTopics
        },
        created_at: Math.floor(new Date(topic.createdAt).getTime() / 1000),
        updated_at: Math.floor(new Date(topic.updatedAt).getTime() / 1000)
      }));
      setTopics(convertedTopics);
      setError(null);
    } catch (error) {
      console.error('Error loading topics:', error);
      if (error instanceof Error && 'details' in error) {
        setError((error as any).details);
      } else {
        setError({
          title: 'Error Loading Topics',
          message: 'Unable to load your topics. Please try again later.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    console.log('TopicsList: Running config validation');
    const config = validateConfig();
    console.log('TopicsList: Config validation result:', config);

    if (!config.isValid && config.error) {
      console.log('TopicsList: Setting config error:', config.error);
      setConfigError({
        title: config.error.title,
        message: `${config.error.message}\n\nMissing: ${config.error.details}`
      });
      return;
    }
    loadTopics();
  }, [loadTopics]);

  const handleStartNewTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !user?.id || isCreating) return;

    setIsCreating(true);
    try {
      const defaultLessonPlan: LessonPlan = {
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

      const topic = await TopicService.createTopic(
        user.id,
        newTopic,
        'Start your learning journey with personalized guidance',
        defaultLessonPlan
      );

      const uiTopic: Topic = {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        progress: topic.progress || 0,
        user_id: topic.userId,
        lesson_plan: {
          mainTopics: topic.lessonPlan.mainTopics.map(mainTopic => ({
            name: mainTopic.name,
            subtopics: mainTopic.subtopics.map(subtopic => ({
              name: subtopic.name,
              status: subtopic.status,
              icon: undefined
            }))
          })),
          currentTopic: topic.lessonPlan.currentTopic,
          completedTopics: topic.lessonPlan.completedTopics
        },
        created_at: Math.floor(new Date(topic.createdAt).getTime() / 1000),
        updated_at: Math.floor(new Date(topic.updatedAt).getTime() / 1000)
      };

      setTopics(prevTopics => [...prevTopics, uiTopic]);
      setNewTopic('');
      navigate(`/topic/${uiTopic.id}`);
    } catch (error) {
      console.error('Failed to create topic:', error);
      toast({
        title: "Error",
        description: "Failed to create new topic. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

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
    console.log('TopicsList: Rendering config error:', configError);
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

  if (error) {
    console.log('TopicsList: Rendering error:', error);
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-bold">Your Topics</h2>
          <ErrorMessage
            title={error.title}
            message={error.message}
            className="mt-4"
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading topics...</div>
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

        <form onSubmit={handleStartNewTopic} className="flex flex-col sm:flex-row gap-4">
          <Input
            className="flex-1"
            placeholder="Enter a topic to start learning..."
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
          />
          <Button
            type="submit"
            className="w-full sm:w-auto whitespace-nowrap"
            disabled={isCreating || !newTopic.trim()}
          >
            Start Learning
          </Button>
        </form>

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
