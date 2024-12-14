import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Brain, LayoutDashboard, ShieldCheck, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/auth.context';
import { topicsService } from '@/lib/services/topics.service';
import { toast } from '@/components/ui/use-toast';
import { UserMenu } from '../auth/UserMenu';
import { useTheme } from '@/components/theme-provider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const isNotHome = location.pathname !== '/';
  const [topic, setTopic] = useState<Topic | null>(null);
  const isAdmin = user?.roles?.includes('role_admin');

  console.log('Navbar user:', user);
  console.log('isAdmin:', isAdmin);

  useEffect(() => {
    const loadTopic = async () => {
      const topicMatch = location.pathname.match(/\/topic\/(.+)/);
      if (!topicMatch) {
        setTopic(null);
        return;
      }

      try {
        const loadedTopic = await topicsService.getTopic(topicMatch[1]);
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
          }
        });

      } catch (error) {
        console.error('Error loading topic:', error);
        // Only show error toast, don't navigate away
        toast({
          title: "Error",
          description: "Failed to load the topic. Please try refreshing the page.",
          variant: "destructive"
        });
      }
    };

    loadTopic();
  }, [location.pathname, navigate]);

  const getWelcomeMessage = () => {
    if (!user || !user.name) return 'Welcome!';
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
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link className="mr-6 flex items-center space-x-2" to="/">
            <Brain className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              QuizLearn
            </span>
          </Link>
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
        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="flex items-center space-x-4">
            {isNotHome && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate('/dashboard')}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dashboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/admin">
                      <Button variant="ghost" size="icon">
                        <ShieldCheck className="h-5 w-5" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Admin Dashboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newTheme = theme === "light" ? "dark" : "light";
                        setTheme(newTheme);
                        console.log('Switching to theme:', newTheme);
                      }}
                    >
                      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{theme === 'light' ? 'Dark Theme' : 'Light Theme'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
