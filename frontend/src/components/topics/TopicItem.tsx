import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import type { Topic } from '@/lib/services';

interface TopicItemProps {
  topic: Topic;
  onClick?: () => void;
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

export function TopicItem({ topic, onClick }: TopicItemProps) {
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

  const getProgress = () => {
    const total = topic.lessonPlan.mainTopics.reduce(
      (acc, topic) => acc + topic.subtopics.length,
      0
    );
    const completed = topic.lessonPlan.completedTopics.length;
    return Math.round((completed / total) * 100);
  };

  const progress = getProgress();

  return (
    <div 
      className="group rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold">{topic.title}</h3>
          <p className="text-sm text-muted-foreground">{topic.description}</p>
        </div>
        <Badge variant={progress === 100 ? "default" : "secondary"}>
          {progress}% Complete
        </Badge>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Updated {formatDate(topic.updatedAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Current: {topic.lessonPlan.currentTopic}</span>
        </div>
      </div>
    </div>
  );
}
