import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TopicItem } from './TopicItem';
import { useAuth } from '@/lib/context/AuthContext';
import { TopicService } from '@/lib/services/topic';
import { useToast } from '@/hooks/use-toast';
import type { Topic } from '@/lib/types/database';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TopicsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [sortBy, setSort] = useState('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const loadTopics = async () => {
    if (!user?.id) return;

    try {
      const userTopics = await TopicService.getUserTopics(user.id);
      console.log('Loaded topics:', userTopics); // Debug log
      setTopics(userTopics);
    } catch (error) {
      console.error('Failed to load topics:', error);
      toast({
        title: "Error",
        description: "Failed to load your topics. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, [user?.id]);

  const handleStartNewTopic = async () => {
    if (!newTopic.trim() || !user?.id || isCreating) return;

    setIsCreating(true);
    try {
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

      toast({
        title: "Creating Topic",
        description: "Setting up your new learning journey...",
      });

      const topic = await TopicService.createTopic(
        user.id,
        newTopic,
        'Start your learning journey with personalized guidance',
        defaultLessonPlan
      );

      console.log('Created topic:', topic); // Debug log

      // Reload topics to ensure we have the latest data
      await loadTopics();

      setNewTopic('');
      toast({
        title: "Topic Created",
        description: "Your new topic has been created successfully!",
      });

      navigate(`/topic/${topic.id}`);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStartNewTopic();
    }
  };

  const sortedTopics = [...topics].sort((a, b) => {
    switch (sortBy) {
      case 'progress':
        return b.progress - a.progress;
      case 'name':
        return a.title.localeCompare(b.title);
      case 'recent':
      default:
        return b.updatedAt.getTime() - a.updatedAt.getTime();
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-muted-foreground">Loading topics...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-8">
        <div className="bg-card p-2 sm:p-4 rounded-xl border border-border transition-all hover:border-blue-500">
          <div className="text-xl sm:text-3xl font-bold text-green-500">
            {topics.length}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Active Topics</div>
        </div>
        <div className="bg-card p-2 sm:p-4 rounded-xl border border-border transition-all hover:border-blue-500">
          <div className="text-xl sm:text-3xl font-bold text-blue-500">
            {topics.filter(t => t.progress === 100).length}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Completed</div>
        </div>
        <div className="bg-card p-2 sm:p-4 rounded-xl border border-border transition-all hover:border-blue-500">
          <div className="text-xl sm:text-3xl font-bold text-blue-500">
            {Math.round(topics.reduce((acc, t) => acc + t.progress, 0) / Math.max(topics.length, 1))}%
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Average</div>
        </div>
        <div className="bg-card p-2 sm:p-4 rounded-xl border border-border transition-all hover:border-blue-500">
          <div className="text-xl sm:text-3xl font-bold text-blue-500">
            {topics.filter(t => t.progress > 0 && t.progress < 100).length}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">In Progress</div>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">My Topics</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">
                Sort
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSort('progress')}>Sort by Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort('recent')}>Sort by Recent</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort('name')}>Sort by Name</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Start a new topic..."
              className="w-full bg-muted text-foreground px-4 py-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg shadow-lg transition-all duration-200 hover:bg-muted/80"
              disabled={isCreating}
            />
            {newTopic.trim() && (
              <Button
                onClick={handleStartNewTopic}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : "Let's go!"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {sortedTopics.map((topic) => (
            <TopicItem key={topic.id} topic={topic} />
          ))}
        </div>

        {topics.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground">
              No topics yet. Start your first learning journey!
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}
