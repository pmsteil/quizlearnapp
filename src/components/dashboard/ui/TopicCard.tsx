import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import type { Topic } from '@/lib/types';

interface TopicCardProps {
  topic: Topic;
}

export function TopicCard({ topic }: TopicCardProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-medium">{topic.name}</span>
        <Badge variant={topic.status === 'behind' ? 'destructive' : 'default'}>
          {topic.status}
        </Badge>
      </div>
      <Progress value={topic.progress} className="h-2" />
      <div className="flex items-center text-sm text-muted-foreground">
        <Clock className="w-4 h-4 mr-1" />
        <span>{topic.lastActivity}</span>
      </div>
    </div>
  );
}