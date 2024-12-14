import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { PageLayout } from '../shared/PageLayout';
import { LearningTree } from '../shared/LearningTree';
import { LessonContent } from '../lesson/LessonContent';
import { LearningProgress } from './LearningProgress';
import { Topic, topicsService } from '@/lib/services/topics.service';
import { TopicLesson, UserLessonProgress, ProgressStatus } from '@/lib/types';
import { lessonsService } from '@/lib/services/lessons.service';
import { useAuth } from '@/lib/contexts/auth.context';
import { toast } from '@/components/ui/use-toast';
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

export default function TopicLearning() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [lessons, setLessons] = useState<TopicLesson[]>([]);
  const [progress, setProgress] = useState<UserLessonProgress[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [topicData, lessonsData, progressData] = await Promise.all([
          topicsService.getTopic(id),
          lessonsService.getLessonsForTopic(id),
          lessonsService.getTopicProgress(id)
        ]);
        
        setTopic(topicData);
        setLessons(lessonsData);
        setProgress(progressData);

        // Set current lesson to first incomplete lesson or first lesson
        const firstIncomplete = progressData.find(p => p.status !== 'completed')?.lesson_id;
        setCurrentLessonId(firstIncomplete || lessonsData[0]?.lesson_id || null);
      } catch (error) {
        console.error('Error loading topic data:', error);
        toast({
          title: "Error",
          description: "Failed to load topic data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleUpdateTopic = async (updates: Partial<Topic>) => {
    if (!id || !topic) return;

    try {
      const updatedTopic = await topicsService.updateTopic(id, updates);
      setTopic(updatedTopic);
      toast({
        title: "Success",
        description: "Topic updated successfully",
      });
    } catch (error) {
      console.error('Error updating topic:', error);
      toast({
        title: "Error",
        description: "Failed to update topic",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTopic = async () => {
    if (!id) return;

    try {
      await topicsService.deleteTopic(id);
      toast({
        title: "Success",
        description: "Topic deleted successfully",
      });
      navigate('/topics');
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast({
        title: "Error",
        description: "Failed to delete topic",
        variant: "destructive",
      });
    }
  };

  const handleLessonSelect = (lessonId: number) => {
    setCurrentLessonId(lessonId);
  };

  const handleProgressUpdate = async (lessonId: number, status: ProgressStatus) => {
    try {
      const updatedProgress = await lessonsService.updateLessonProgress(lessonId, status);
      setProgress(prev => {
        const index = prev.findIndex(p => p.lesson_id === lessonId);
        if (index === -1) {
          return [...prev, updatedProgress];
        }
        return [
          ...prev.slice(0, index),
          updatedProgress,
          ...prev.slice(index + 1)
        ];
      });
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      throw error; // Let LessonContent handle the error
    }
  };

  const currentLesson = currentLessonId 
    ? lessons.find(l => l.lesson_id === currentLessonId)
    : null;

  const currentProgress = currentLessonId
    ? progress.find(p => p.lesson_id === currentLessonId)
    : null;

  if (!topic || isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Brain className="h-8 w-8 animate-pulse text-muted-foreground" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto py-6 grid grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="col-span-3 space-y-6">
          <LearningProgress
            topic={topic}
            onDelete={() => setShowDeleteDialog(true)}
            onUpdate={handleUpdateTopic}
          />
          <div className="bg-card rounded-lg border shadow-sm">
            <LearningTree
              lessons={lessons}
              progress={progress}
              onSelectLesson={handleLessonSelect}
              currentLessonId={currentLessonId || undefined}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          {currentLesson ? (
            <LessonContent
              lesson={currentLesson}
              progress={currentProgress}
              onProgressUpdate={handleProgressUpdate}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
              Select a lesson to begin
            </div>
          )}
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
