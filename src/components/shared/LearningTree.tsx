import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Subtopic } from '@/lib/types';

interface Topic {
  name: string;
  icon: LucideIcon;
  subtopics: Subtopic[];
}

interface LearningTreeProps {
  topics: Topic[];
}

export function LearningTree({ topics }: LearningTreeProps) {
  return (
    <div className="space-y-4">
      {topics.map((topic) => (
        <div key={topic.name} className="space-y-4">
          <div className="flex items-center gap-2">
            {topic.icon && <topic.icon className="w-5 h-5 text-primary" />}
            <h3 className="font-medium">{topic.name}</h3>
          </div>

          <div className="pl-6 space-y-1.5">
            {topic.subtopics.map((subtopic) => (
              <div key={subtopic.name} className="relative">
                <div className="absolute left-[-12px] top-0 h-full border-l-2 border-border" />
                <div className="absolute left-[-12px] top-[50%] w-3 border-t-2 border-border" />
                <div className="flex items-center gap-2 bg-card/50 rounded-lg py-1.5 px-2 relative">
                  <span className={cn(
                    "text-sm",
                    subtopic.status === 'current' ? 'text-foreground font-medium' :
                    subtopic.status === 'completed' ? 'text-green-500' :
                    'text-muted-foreground'
                  )}>
                    {subtopic.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
