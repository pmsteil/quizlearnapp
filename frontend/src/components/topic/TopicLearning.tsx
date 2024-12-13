import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, AlertCircle } from 'lucide-react';
import { PageLayout } from '../shared/PageLayout';
import { ChatInterface } from '../shared/ChatInterface';
import { LearningTree } from '../shared/LearningTree';
import { LearningProgress } from './LearningProgress';
import { useAuth } from '@/lib/contexts/auth.context';
import { useToast } from '@/lib/contexts/toast.context';
import { useLearning } from '@/lib/hooks/useLearning';
import { useProgress } from '@/lib/hooks/useProgress';
import { useQuestions } from '@/lib/hooks/useQuestions';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import type { Message } from '@/lib/types';
import type { Topic } from '@/lib/types/database';
import type { Subtopic } from '@/lib/types';
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
import { topicsService } from '@/lib/services/topics.service';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    learningPath,
    recommendation,
    pathError,
    fetchLearningPath,
    fetchRecommendation,
    completeSubtopic,
    adjustDifficulty,
    generateMaterials,
  } = useLearning(id!, {
    onError: (error) => {
      showToast(error.message, 'error');
    },
  });

  const {
    topicProgress,
    progressError,
    fetchTopicProgress,
    updateSubtopicStatus,
  } = useProgress(id!, {
    onError: (error) => {
      showToast(error.message, 'error');
    },
  });

  const {
    questions,
    currentQuestion,
    answeredQuestions,
    questionsError,
    fetchQuestionsBySubtopic,
    submitAnswer,
    generateQuestions,
  } = useQuestions(id!, {
    onError: (error) => {
      showToast(error.message, 'error');
    },
  });

  useEffect(() => {
    if (!id || !user) return;

    const initializeTopic = async () => {
      try {
        await Promise.all([
          fetchLearningPath(),
          fetchTopicProgress(),
          fetchRecommendation(),
        ]);
      } catch (error) {
        // Errors are handled by individual hooks
      }
    };

    initializeTopic();
  }, [id, user, fetchLearningPath, fetchTopicProgress, fetchRecommendation]);

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content
    };

    setMessages(prev => [...prev, newMessage]);

    // If this is the first user message (excluding the welcome message), update progress
    if (messages.length === 1 && topicProgress?.completion_percentage === 0) {
      try {
        await updateSubtopicStatus(learningPath?.current_subtopic || '', 'in_progress');
      } catch (error) {
        // Error is handled by the hook
      }
    }

    // Generate AI response based on the current learning context
    setTimeout(async () => {
      try {
        if (recommendation) {
          const materials = await generateMaterials(recommendation.subtopic);
          const aiResponse: Message = {
            id: messages.length + 2,
            type: 'ai',
            content: `Let's focus on ${recommendation.subtopic}. Here are some resources to help you:
${materials.map(m => `- ${m.title} (${m.type})`).join('\n')}

Would you like to start with any of these?`
          };
          setMessages(prev => [...prev, aiResponse]);
        } else {
          const aiResponse: Message = {
            id: messages.length + 2,
            type: 'ai',
            content: `I understand you want to learn about "${content}". Let's explore that topic together. What specific aspects would you like to focus on?`
          };
          setMessages(prev => [...prev, aiResponse]);
        }
      } catch (error) {
        showToast('Failed to generate learning materials', 'error');
      }
    }, 1000);
  };

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

  if (pathError || progressError || questionsError) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-destructive mb-4">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Error Loading Topic</h2>
          <p className="text-muted-foreground mb-4">
            {pathError?.message || progressError?.message || questionsError?.message}
          </p>
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

  if (!learningPath || !topicProgress) {
    return (
      <PageLayout>
        <TopicLearningSkeleton />
      </PageLayout>
    );
  }

  return (
    <ErrorBoundary>
      <PageLayout>
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
          <div className="container mx-auto px-4 py-2">
            <LearningProgress
              topic={topic!}
              progress={topicProgress}
              onDelete={() => setShowDeleteDialog(true)}
            />
          </div>

          <div className="flex-1 container mx-auto px-4 min-h-0">
            <div className="grid grid-cols-3 gap-8 h-full">
              <div className="col-span-2 h-full flex flex-col min-h-0">
                <div className="flex-1 overflow-hidden">
                  <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                  />
                </div>
              </div>

              <div className="overflow-y-auto">
                <LearningTree
                  topics={[{
                    name: learningPath.current_subtopic || "Learning Path",
                    icon: Brain,
                    subtopics: Object.entries(topicProgress.subtopic_progress).map(([name, progress]) => ({
                      name,
                      status: progress.status
                    }))
                  }]}
                />
              </div>
            </div>
          </div>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Topic</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this topic? This action cannot be undone.
                All associated questions and progress will also be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTopic}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageLayout>
    </ErrorBoundary>
  );
}
