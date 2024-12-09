import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface SubTopic {
  name: string;
  icon?: LucideIcon;
}

interface Topic {
  name: string;
  icon: LucideIcon;
  subtopics: SubTopic[];
}

interface LearningTreeProps {
  title: string;
  topics: Topic[];
}

export function LearningTree({ title, topics }: LearningTreeProps) {
  const IconComponent = topics[0].icon;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        {/* <IconComponent className="w-5 h-5 text-primary" />
        <h3 className="font-medium">{title}</h3> */}
      </div>

      <div className="space-y-6">
        {topics.map((topic, topicIndex) => {
          const TopicIcon = topic.icon;
          return (
            <div key={topicIndex} className="relative">
              <div className="flex items-center gap-2 mb-2">
                <TopicIcon className="w-5 h-5 text-primary" />
                <h4 className="font-medium">{topic.name}</h4>
              </div>

              <div className="pl-6 space-y-1.5">
                {topic.subtopics.map((subtopic, index) => (
                  <div key={index} className="relative">
                    <div className="absolute left-[-12px] top-0 h-full border-l-2 border-border" />
                    <div className="absolute left-[-12px] top-[50%] w-3 border-t-2 border-border" />
                    <div className="flex items-center gap-2 bg-card/50 rounded-lg py-1.5 px-2 relative">
                      <span className="text-sm text-muted-foreground">{subtopic.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
