import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export function LearningProgress() {
  return (
    <Card className="p-6 mb-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Current Progress</div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-500 font-medium">2 correct</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-500 font-medium">1 incorrect</span>
            </div>
            <span className="text-muted-foreground">7 questions remaining</span>
          </div>
        </div>
        <div className="flex items-center space-x-8 text-sm text-muted-foreground">
          <div>
            <span className="block text-foreground text-lg">15m</span>
            <span>Time spent</span>
          </div>
          <div>
            <span className="block text-foreground text-lg">85%</span>
            <span>Accuracy</span>
          </div>
        </div>
      </div>
      <Progress value={30} className="h-2 mt-4" />
    </Card>
  );
}