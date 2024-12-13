import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { DifficultyStars } from './DifficultyStars';
import type { RecommendedTopic } from '@/lib/types';

interface RecommendedTopicCardProps {
  topic: RecommendedTopic;
}

export function RecommendedTopicCard({ topic }: RecommendedTopicCardProps) {
  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-2">{topic.title}</h4>
      <div className="flex items-center gap-2 mb-2">
        <DifficultyStars difficulty={topic.difficulty} />
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {topic.duration}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{topic.description}</p>
    </Card>
  );
}