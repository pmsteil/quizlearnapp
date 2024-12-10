import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Brain, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';
import { TopicService } from '@/lib/services/topic';
import type { Topic } from '@/lib/types';
import { toast } from '@/components/ui/use-toast';
import { UserMenu } from '../auth/UserMenu';
import { ModeToggle } from '@/components/theme/mode-toggle';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNotHome = location.pathname !== '/';
  const [topic, setTopic] = useState<Topic | null>(null);

  useEffect(() => {
    const loadTopic = async () => {
      const topicMatch = location.pathname.match(/\/topic\/(.+)/);
      if (!topicMatch) {
        setTopic(null);
        return;
      }

      try {
        const loadedTopic = await TopicService.getTopic(topicMatch[1]);
        if (!loadedTopic) {
          navigate('/dashboard');
          return;
        }

        // Convert database topic to UI topic
        setTopic({
          ...loadedTopic,
          user_id: loadedTopic.userId,
          lesson_plan: {
            ...loadedTopic.lessonPlan,
            mainTopics: loadedTopic.lessonPlan.mainTopics.map(topic => ({
              ...topic,
              subtopics: topic.subtopics.map(subtopic => ({
                ...subtopic,
                icon: undefined // Remove icon since it's incompatible
              }))
            }))
          },
          created_at: Math.floor(loadedTopic.createdAt.getTime() / 1000),
          updated_at: Math.floor(loadedTopic.updatedAt.getTime() / 1000)
        });

      } catch (error) {
        console.error('Error loading topic:', error);
        toast({
          title: "Error",
          description: "Failed to load the topic. Please try again.",
          variant: "destructive"
        });
        navigate('/dashboard');
      }
    };

    loadTopic();
  }, [location.pathname, navigate]);

  const getWelcomeMessage = () => {
    if (!user) return null;
    const firstName = user.name.split(' ')[0];
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    return `Welcome back, ${capitalizedName}!`;
  };

  const getDescription = () => {
    if (topic) {
      return topic.title;
    }
    return '🔥 7 day streak | Today\'s Goal: 2/3';
  };

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary hover:text-primary/80 transition-colors">
              <Brain className="h-8 w-8" />
              QuizLearn
            </Link>

            {/* Page Title/Info */}
            {user && (
              <div className="min-w-0">
                <h1 className="text-xl font-bold truncate">
                  {getWelcomeMessage()}
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  {getDescription()}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isNotHome && (
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 hidden sm:flex"
              onClick={() => navigate('/admin')}
            >
              <Database className="h-6 w-6" />
            </Button>
            <ModeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
