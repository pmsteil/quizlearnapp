import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import type { Topic } from '@/lib/services';
import { useProgress } from '@/lib/hooks/useProgress';

interface TopicItemProps {
  topic: Topic;
  isLoading?: boolean;
}

export function TopicItemSkeleton() {
  return (
    <div className="topic-card rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-6" />
      </div>
      <Skeleton className="h-2 w-full mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function TopicItem({ topic, isLoading = false }: TopicItemProps) {
  const navigate = useNavigate();
  const { topicProgress } = useProgress(topic.id);

  const getTopicStatus = (progress: number) => {
    if (progress === 0) return 'new';
    if (progress === 100) return 'completed';
    return 'in-progress';
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return <TopicItemSkeleton />;
  }

  if (!topic) {
    return (
      <div className="topic-card rounded-xl p-6 border border-destructive/50 bg-destructive/10">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <p>Error loading topic</p>
        </div>
      </div>
    );
  }

  const progress = topicProgress?.completion_percentage ?? topic.progress;

  return (
    <div
      className="topic-card rounded-xl p-6 cursor-pointer border border-border hover:shadow-lg transition-all duration-200"
      onClick={() => navigate(`/topic/${topic.id}`)}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-medium">{topic.title}</h3>
            <Badge variant={progress === 100 ? 'default' : 'secondary'}>
              {getTopicStatus(progress)}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{topic.description}</p>
        </div>
        <div className="text-gray-400 text-2xl font-bold chevron-right">›</div>
      </div>

      <Progress
        value={progress}
        className="h-2 mb-4"
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>Last updated: {formatDate(topic.updated_at)}</span>
        </div>
        <div className="flex items-center space-x-4">
          {topicProgress && (
            <>
              <span>
                {topicProgress.correct_answers}/{topicProgress.total_questions} Questions
              </span>
              <span>•</span>
            </>
          )}
          <span>{progress}% Complete</span>
        </div>
      </div>
    </div>
  );
}
