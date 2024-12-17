import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { PageLayout } from '../shared/PageLayout';
import { ChatInterface } from '../shared/ChatInterface';
import { LearningTree } from '../shared/LearningTree';
import { LessonContent } from '../lesson/LessonContent';
import { LearningProgress } from './LearningProgress';
import { Topic, topicsService } from '@/lib/services/topics.service';
import { TopicLesson, UserLessonProgress, ProgressStatus } from '@/lib/types';
import { lessonsService } from '@/lib/services/lessons.service';
import { useAuth } from '@/lib/contexts/auth.context';
import { toast } from '@/components/ui/use-toast';
import type { Message } from '@/lib/types';
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
import { Card } from "@/components/ui/card";

export default function TopicLearning() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [lessons, setLessons] = useState<TopicLesson[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const loadTopic = async () => {
      if (!id) return;

      try {
        const [topicData, lessonsData] = await Promise.all([
          topicsService.getTopic(id),
          lessonsService.getLessonsForTopic(id)
        ]);

        if (!topicData) {
          toast.error('Topic not found');
          return;
        }

        setTopic(topicData);
        setLessons(lessonsData);

        // Set current lesson to first lesson if available
        if (lessonsData.length > 0) {
          setCurrentLessonId(lessonsData[0].lesson_id);
        }
      } catch (error) {
        console.error('Error loading topic:', error);
        toast.error('Failed to load the topic. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTopic();
  }, [id, navigate]);

  const handleUpdateTopic = (updatedTopic: Topic) => {
    setTopic(updatedTopic);
  };

  const handleDeleteTopic = async () => {
    if (!id) return;

    try {
      await topicsService.deleteTopic(id);
      toast({
        title: "Success",
        description: "Topic deleted successfully"
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast({
        title: "Error",
        description: "Failed to delete topic",
        variant: "destructive"
      });
    }
  };

  const handleLessonSelect = (lessonId: number) => {
    setCurrentLessonId(lessonId);
  };

  if (!id) {
    return null;
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Brain className="w-8 h-8 animate-pulse" />
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

  const currentLesson = currentLessonId
    ? lessons.find(l => l.lesson_id === currentLessonId)
    : null;

  return (
    <PageLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
        {/* Top Section */}
        <div className="container mx-auto px-4 py-2">
          <div className="bg-card rounded-xl p-6 shadow-sm">
            <LearningProgress 
              topic={topic} 
              onUpdate={handleUpdateTopic}
              onDelete={() => setShowDeleteDialog(true)}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 container mx-auto px-4 py-4 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Left Sidebar */}
            <div className="col-span-3 bg-card rounded-xl shadow-sm overflow-auto">
              <LearningTree 
                topic={{ ...topic, lessons }} 
                onSelectLesson={handleLessonSelect}
              />
            </div>

            {/* Lesson Content */}
            <div className="col-span-9 bg-card rounded-xl shadow-sm overflow-hidden">
              {currentLesson ? (
                <LessonContent
                  lesson={currentLesson}
                  onEdit={async (content) => {
                    try {
                      await lessonsService.updateLesson(currentLesson.lesson_id, {
                        ...currentLesson,
                        content
                      });
                      toast.success('Lesson updated successfully');
                      // Refresh lessons
                      const updatedLessons = await lessonsService.getLessonsForTopic(id);
                      setLessons(updatedLessons);
                    } catch (error) {
                      console.error('Error updating lesson:', error);
                      toast.error('Failed to update lesson');
                    }
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Brain className="h-12 w-12 mb-4" />
                  <p className="text-lg">Select a lesson to begin learning</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this topic and all associated data.
              This action cannot be undone.
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
  );
}
