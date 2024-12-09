import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Award } from 'lucide-react';
import { TopicCard } from '../ui/TopicCard';
import { ACTIVE_TOPICS } from '@/lib/constants';

export default function LeftColumn() {
  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Active Topics</h2>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {ACTIVE_TOPICS.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Achievements</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((badge) => (
            <div key={badge} className="flex items-center gap-3">
              <Award className="w-8 h-8 text-yellow-500" />
              <div>
                <div className="font-medium">Python Master</div>
                <div className="text-sm text-muted-foreground">Completed advanced course</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}