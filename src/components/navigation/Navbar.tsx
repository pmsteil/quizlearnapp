import { Moon, Sun, Brain, ArrowLeft, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/context/ThemeContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UserMenu } from '../auth/UserMenu';
import { useAuth } from '@/lib/context/AuthContext';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { TopicService } from '@/lib/services/topic';
import type { Topic } from '@/lib/types/database';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isNotHome = location.pathname !== '/';
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', protected: true },
    { label: 'Admin', href: '/admin', protected: false },
  ];

  useEffect(() => {
    const loadTopic = async () => {
      const topicMatch = location.pathname.match(/\/topic\/(.+)/);
      if (topicMatch) {
        const topicId = topicMatch[1];
        try {
          const topic = await TopicService.getTopic(topicId);
          setCurrentTopic(topic);
        } catch (error) {
          console.error('Error loading topic:', error);
          setCurrentTopic(null);
        }
      } else {
        setCurrentTopic(null);
      }
    };

    loadTopic();
  }, [location.pathname]);

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-8">
            {isNotHome ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-xl font-bold text-primary hover:text-primary/80 transition-colors -ml-2"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-8 w-8" />
              </Button>
            ) : (
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary hover:text-primary/80 transition-colors">
                <Brain className="h-8 w-8" />
                QuizLearn
              </Link>
            )}

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                (!item.protected || isAuthenticated) && (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      location.pathname === item.href
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>

            {/* Page Title/Info */}
            <div>
              {currentTopic ? (
                <>
                  <h1 className="text-xl font-bold">{currentTopic.title}</h1>
                  <p className="text-sm text-muted-foreground">{currentTopic.description}</p>
                </>
              ) : location.pathname.includes('/new-topic') ? (
                <>
                  <h1 className="text-xl font-bold">New Learning Journey</h1>
                  <p className="text-sm text-muted-foreground">Creating your personalized learning path</p>
                </>
              ) : location.pathname === '/admin' ? (
                <>
                  <h1 className="text-xl font-bold">Database Administration</h1>
                  <p className="text-sm text-muted-foreground">View and manage database records</p>
                </>
              ) : isAuthenticated && user ? (
                <>
                  <h1 className="text-xl font-bold">Welcome back, {user.name}!</h1>
                  <p className="text-sm text-muted-foreground">🔥 7 day learning streak | Today's Goal: 2/3 topics</p>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-8 w-8" />
              ) : (
                <Moon className="h-8 w-8" />
              )}
            </Button>
            {location.pathname !== '/admin' && <UserMenu />}
          </div>
        </div>
      </div>
    </nav>
  );
}