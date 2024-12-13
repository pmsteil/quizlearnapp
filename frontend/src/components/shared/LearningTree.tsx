import { useState } from 'react';
import { ChevronDown, ChevronRight, Circle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Topic } from '@/lib/services/topics.service';

interface LearningTreeProps {
  topic: Topic;
  onSelectTopic?: (mainTopic: string, subtopic: string) => void;
}

export function LearningTree({ topic, onSelectTopic }: LearningTreeProps) {
  const mainTopics = topic.lessonPlan?.mainTopics ?? [];
  const [expandedTopics, setExpandedTopics] = useState<string[]>(() => 
    // Initialize with all main topics expanded
    mainTopics.map(topic => topic.name)
  );

  const toggleTopic = (topicName: string) => {
    setExpandedTopics(prev => 
      prev.includes(topicName)
        ? prev.filter(t => t !== topicName)
        : [...prev, topicName]
    );
  };

  const getStatusIcon = (status: 'current' | 'upcoming' | 'completed') => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'current':
        return <Circle className="h-4 w-4 text-blue-500" />;
      case 'upcoming':
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-4 space-y-2">
      {mainTopics.map((mainTopic) => {
        const isExpanded = expandedTopics.includes(mainTopic.name);
        const subtopics = mainTopic.subtopics ?? [];
        return (
          <div key={mainTopic.name} className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start px-2 py-1 h-auto font-medium"
              onClick={() => toggleTopic(mainTopic.name)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              {mainTopic.name}
            </Button>
            
            {isExpanded && (
              <div className="ml-6 space-y-1">
                {subtopics.map((subtopic) => (
                  <Button
                    key={subtopic.name}
                    variant="ghost"
                    className="w-full justify-start px-2 py-1 h-auto text-sm"
                    onClick={() => onSelectTopic?.(mainTopic.name, subtopic.name)}
                  >
                    <span className="mr-2">
                      {getStatusIcon(subtopic.status)}
                    </span>
                    {subtopic.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
