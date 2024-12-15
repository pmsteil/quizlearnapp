import { useState } from 'react';
import { ChevronDown, ChevronRight, Circle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TopicLesson, UserLessonProgress } from '@/lib/types';

interface LearningTreeProps {
  lessons: TopicLesson[];
  progress: UserLessonProgress[];
  onSelectLesson: (lessonId: number) => void;
  currentLessonId?: number;
}

export function LearningTree({ lessons = [], progress, onSelectLesson, currentLessonId }: LearningTreeProps) {
  const [expandedLessons, setExpandedLessons] = useState<number[]>([]);

  const toggleLesson = (lessonId: number) => {
    setExpandedLessons(prev => 
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const getLessonStatus = (lessonId: number): 'completed' | 'in_progress' | 'not_started' => {
    const lessonProgress = progress.find(p => p.lesson_id === lessonId);
    return lessonProgress?.status || 'not_started';
  };

  const getStatusIcon = (status: 'completed' | 'in_progress' | 'not_started') => {
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
    const status = getLessonStatus(lesson.lesson_id);
    const isCurrentLesson = currentLessonId === lesson.lesson_id;

    return (
      <div key={lesson.lesson_id} className="space-y-1" style={{ marginLeft: `${depth * 1.5}rem` }}>
        <Button
          variant={isCurrentLesson ? "secondary" : "ghost"}
          className="w-full justify-start px-2 py-1 h-auto font-medium"
          onClick={() => {
            if (hasChildren) {
              toggleLesson(lesson.lesson_id);
            }
            onSelectLesson(lesson.lesson_id);
          }}
        >
          <div className="flex items-center gap-2 flex-1">
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
              {getStatusIcon(status)}
            </span>
            <span className="truncate">{lesson.title}</span>
          </div>
        </Button>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {lesson.children!.map(child => renderLesson(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Filter root-level lessons (those without parent)
  const rootLessons = Array.isArray(lessons) ? lessons.filter(lesson => !lesson.parent_lesson_id) : [];

  return (
    <div className="p-4 space-y-2">
      {rootLessons.map(lesson => renderLesson(lesson))}
    </div>
  );
}
