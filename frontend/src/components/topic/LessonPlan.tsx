import { Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { LearningTree } from '@/components/shared/LearningTree';
import type { MainTopic } from '@/lib/types';

interface LessonPlanProps {
  mainTopics: MainTopic[];
}

export function LessonPlan({ mainTopics }: LessonPlanProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="font-medium">Learning Path</h3>
      </div>
      <LearningTree topics={mainTopics.map(topic => ({
        name: topic.name,
        icon: Brain,
        subtopics: topic.subtopics
      }))} />
    </Card>
  );
}
