import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { TopicService, type TopicProgress } from '@/lib/services/topic';
import { formatDuration } from '@/lib/utils/learning';

interface LearningProgressProps {
  topicId: string;
}

export function LearningProgress({ topicId }: LearningProgressProps) {
  const [progress, setProgress] = useState<TopicProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const data = await TopicService.getTopicProgress(topicId);
        setProgress(data);
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [topicId]);

  if (isLoading || !progress) {
    return (
      <Card className="p-6 mb-8">
        <div className="text-muted-foreground">Loading progress...</div>
      </Card>
    );
  }

  const totalAnswered = progress.correctAnswers + progress.incorrectAnswers;
  const remainingQuestions = Math.max(0, progress.totalQuestions - totalAnswered);
  const accuracy = totalAnswered > 0
    ? Math.round((progress.correctAnswers / totalAnswered) * 100)
    : 0;
  const progressPercentage = totalAnswered > 0
    ? Math.round((totalAnswered / progress.totalQuestions) * 100)
    : 0;

  return (
    <Card className="p-6 mb-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Current Progress</div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-500 font-medium">
                {progress.correctAnswers} correct
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-500 font-medium">
                {progress.incorrectAnswers} incorrect
              </span>
            </div>
            <span className="text-muted-foreground">
              {remainingQuestions} questions remaining
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-8 text-sm text-muted-foreground">
          <div>
            <span className="block text-foreground text-lg">
              {formatDuration(progress.timeSpentMinutes)}
            </span>
            <span>Time spent</span>
          </div>
          <div>
            <span className="block text-foreground text-lg">
              {accuracy}%
            </span>
            <span>Accuracy</span>
          </div>
        </div>
      </div>
      <Progress value={progressPercentage} className="h-2 mt-4" />
    </Card>
  );
}
