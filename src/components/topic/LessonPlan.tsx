import { Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';

const lessons = [
  { id: 1, name: 'Function Definition Basics', status: 'completed' },
  { id: 2, name: 'Parameter Syntax', status: 'completed' },
  { id: 3, name: 'Return Values', status: 'completed' },
  { id: 4, name: 'Function Arguments', status: 'current' },
  { id: 5, name: 'Default Parameters', status: 'upcoming' },
  { id: 6, name: 'Keyword Arguments', status: 'upcoming' },
  { id: 7, name: 'Variable Scope', status: 'upcoming' },
  { id: 8, name: 'Lambda Functions', status: 'upcoming' },
  { id: 9, name: 'Function Documentation', status: 'upcoming' },
  { id: 10, name: 'Function Best Practices', status: 'upcoming' }
];

export function LessonPlan() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="font-medium">Python Functions</h3>
      </div>
      
      <div className="space-y-6">
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-primary" />
            <h4 className="font-medium">Core Concepts</h4>
          </div>
          
          <div className="pl-6 space-y-1.5">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="relative">
                <div className="absolute left-[-12px] top-0 h-full border-l-2 border-border" />
                <div className="absolute left-[-12px] top-[50%] w-3 border-t-2 border-border" />
                <div className="flex items-center gap-2 bg-card/50 rounded-lg py-1.5 px-2 relative">
                  <span className={`text-sm ${
                    lesson.status === 'current' ? 'text-foreground' : 
                    lesson.status === 'completed' ? 'text-green-500' : 
                    'text-muted-foreground'
                  }`}>
                    {lesson.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}