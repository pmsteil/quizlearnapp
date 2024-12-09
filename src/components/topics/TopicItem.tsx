import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Topic } from '@/lib/types/database';

interface TopicItemProps {
  topic: Topic;
}

export function TopicItem({ topic }: TopicItemProps) {
  const navigate = useNavigate();

  const getTopicStatus = (progress: number) => {
    if (progress === 0) return 'new';
    if (progress === 100) return 'completed';
    return 'in-progress';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className="topic-card rounded-xl p-6 cursor-pointer border border-border hover:shadow-lg transition-all duration-200"
      onClick={() => navigate(`/topic/${topic.id}`)}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-medium">{topic.title}</h3>
            <Badge variant={topic.progress === 100 ? 'default' : 'secondary'}>
              {getTopicStatus(topic.progress)}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{topic.description}</p>
        </div>
        <div className="text-gray-400 text-2xl font-bold chevron-right">›</div>
      </div>

      <Progress
        value={topic.progress}
        className="h-2 mb-4"
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>Last updated: {formatDate(topic.updatedAt)}</span>
        </div>
        <span>{topic.progress}% Complete</span>
      </div>
    </div>
  );
}
