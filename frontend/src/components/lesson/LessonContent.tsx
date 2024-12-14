import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import type { TopicLesson, UserLessonProgress, ProgressStatus } from '@/lib/types';

interface LessonContentProps {
  lesson: TopicLesson;
  progress: UserLessonProgress | null;
  onProgressUpdate: (lessonId: number, status: ProgressStatus) => Promise<void>;
}

export function LessonContent({ lesson, progress, onProgressUpdate }: LessonContentProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ProgressStatus>(
    progress?.status || 'not_started'
  );

  useEffect(() => {
    if (progress) {
      setCurrentStatus(progress.status);
    }
  }, [progress]);

  const handleStatusUpdate = async (newStatus: ProgressStatus) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      await onProgressUpdate(lesson.lesson_id, newStatus);
      setCurrentStatus(newStatus);
      toast({
        title: "Progress Updated",
        description: `Lesson marked as ${newStatus.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      toast({
        title: "Error",
        description: "Failed to update lesson progress",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Circle className="h-5 w-5 text-blue-500" />;
      case 'not_started':
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'not_started':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold">{lesson.title}</h2>
          <Badge variant="outline" className={getStatusColor()}>
            <span className="flex items-center gap-1.5">
              {getStatusIcon()}
              {currentStatus.replace('_', ' ')}
            </span>
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {currentStatus !== 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate('completed')}
              disabled={isUpdating}
            >
              Mark Complete
            </Button>
          )}
          {currentStatus === 'not_started' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleStatusUpdate('in_progress')}
              disabled={isUpdating}
            >
              Start Lesson
            </Button>
          )}
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        {lesson.content}
      </div>

      {lesson.children && lesson.children.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Sub-lessons</h3>
          <div className="space-y-4">
            {lesson.children.map((child) => (
              <Card key={child.lesson_id} className="p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium">{child.title}</h4>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
