import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { PageLayout } from '../shared/PageLayout';
import { useAuth } from '@/lib/contexts/auth.context';
import { useToast } from '@/lib/contexts/toast.context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Topic, topicsService } from '@/lib/services/topics.service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function TopicLearningSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="container mx-auto px-4 py-2">
        <div className="h-24 bg-muted rounded-xl animate-pulse" />
      </div>
      <div className="flex-1 container mx-auto px-4 min-h-0">
        <div className="grid grid-cols-3 gap-8 h-full">
          <div className="col-span-2 h-full">
            <div className="space-y-4 animate-pulse">
              <div className="h-16 bg-muted rounded" />
              <div className="h-96 bg-muted rounded" />
            </div>
          </div>
          <div>
            <div className="h-full bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TopicLearning() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    const loadTopic = async () => {
      try {
        console.log(`Loading topic ${id}`);
        const topicData = await topicsService.getTopic(id);
        console.log('Topic loaded successfully:', topicData);
        setTopic(topicData);
      } catch (err) {
        console.error('Failed to load topic:', err);
        setError(err instanceof Error ? err : new Error('Failed to load topic'));
        showToast('Failed to load topic', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadTopic();
  }, [id, user, showToast]);

  const handleDeleteTopic = async () => {
    if (!id) return;

    try {
      await topicsService.deleteTopic(id);
      showToast('Topic deleted successfully', 'success');
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to delete topic', 'error');
      }
    }
  };

  if (!id || !user) {
    return null;
  }

  if (isLoading) {
    return <TopicLearningSkeleton />;
  }

  if (error) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-destructive mb-4">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Error Loading Topic</h2>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      </PageLayout>
    );
  }

  if (!topic) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <h2 className="text-2xl font-semibold mb-2">Topic Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested topic could not be found.</p>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{topic.title}</h1>
          <button
            className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-md"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete Topic
          </button>
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <p className="text-muted-foreground">{topic.description}</p>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the topic
                and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTopic}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageLayout>
  );
}
