import { Brain, BookOpen, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/navigation/Navbar';

export default function PublicHome() {
  console.log('PublicHome rendering...');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('PublicHome state:', { user, showAuthDialog });

  useEffect(() => {
    console.log('PublicHome useEffect - user changed:', user);
    if (user) {
      console.log('Navigating to dashboard...');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGetStarted = () => {
    console.log('handleGetStarted clicked');
    if (user) {
      console.log('User exists, navigating to dashboard...');
      navigate('/dashboard');
    } else {
      console.log('No user, showing auth dialog...');
      setShowAuthDialog(true);
    }
  };

  console.log('PublicHome rendering UI...');
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background z-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative z-10">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <Brain className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Master Any Topic with QuizLearn
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Personalized learning paths, interactive quizzes, and AI-powered feedback
              to help you achieve your learning goals.
            </p>
            <Button size="lg" onClick={handleGetStarted}>
              {user ? "Go to Dashboard" : "Start Learning Now"}
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Personalized Learning</h3>
              <p className="text-muted-foreground">
                AI-driven paths adapt to your learning style and pace.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Interactive Sessions</h3>
              <p className="text-muted-foreground">
                Engage in dynamic conversations with our AI tutor.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Star className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor your improvement with detailed analytics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to Start Learning?</h2>
          <Button size="lg" onClick={handleGetStarted}>
            {user ? "Go to Dashboard" : "Create Free Account"}
          </Button>
        </div>
      </div>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
}
