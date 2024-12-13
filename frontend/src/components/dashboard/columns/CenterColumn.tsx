import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Progress } from '@/components/ui/progress';
import { Clock, PlayCircle } from 'lucide-react';
import { RecommendedTopicCard } from '../ui/RecommendedTopicCard';
import { RECOMMENDED_TOPICS } from '@/lib/constants';

export default function CenterColumn() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">Python Advanced Concepts</h2>
            <p className="text-muted-foreground">Continue where you left off</p>
          </div>
          <Button size="lg">
            <PlayCircle className="mr-2 h-4 w-4" />
            Resume
          </Button>
        </div>
        <Progress value={65} className="h-2 mb-4" />
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="w-4 h-4 mr-1" />
          <span>Last activity: 2 hours ago</span>
        </div>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Recommended Next Steps</h3>
        <Carousel className="w-full">
          <CarouselContent>
            {RECOMMENDED_TOPICS.map((topic) => (
              <CarouselItem key={topic.id} className="md:basis-1/2 lg:basis-1/3">
                <RecommendedTopicCard topic={topic} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
}