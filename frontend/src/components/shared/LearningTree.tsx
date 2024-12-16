import { useState } from 'react';
import { ChevronDown, ChevronRight, Circle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Topic, TopicLesson } from '@/lib/types';

interface LearningTreeProps {
  topic: Topic;
  onSelectLesson?: (lessonId: number) => void;
}

export function LearningTree({ topic, onSelectLesson }: LearningTreeProps) {
  const [expandedLessons, setExpandedLessons] = useState<string[]>([]);

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => 
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const getStatusIcon = (status: 'not_started' | 'in_progress' | 'completed') => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Circle className="h-4 w-4 text-blue-500" />;
      case 'not_started':
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderLesson = (lesson: TopicLesson, depth: number = 0) => {
    const hasChildren = lesson.children && lesson.children.length > 0;
    const isExpanded = expandedLessons.includes(lesson.lesson_id);

    return (
      <div key={lesson.lesson_id} className="space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start px-2 py-1 h-auto font-medium"
          onClick={() => {
            if (hasChildren) {
              toggleLesson(lesson.lesson_id);
            }
            onSelectLesson?.(lesson.lesson_id);
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0" style={{ paddingLeft: `${depth * 1}rem` }}>
            {hasChildren && (
              <span className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            )}
            <span className="flex-shrink-0">
              {getStatusIcon('not_started')}
            </span>
            <span className="truncate">{lesson.title}</span>
          </div>
        </Button>
        
        {hasChildren && isExpanded && (
          <div className="ml-4 space-y-1">
            {lesson.children.map(child => renderLesson(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-2">
      {topic.lessons?.map(lesson => renderLesson(lesson))}
    </div>
  );
}
