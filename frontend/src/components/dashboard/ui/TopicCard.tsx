import { cn } from "@/lib/utils";
import type { Topic } from "@/lib/services";
import { formatDistanceToNow } from "date-fns";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface TopicCardProps {
  topic: Topic;
  className?: string;
  onClick?: () => void;
}

export function TopicCard({ topic, className, onClick }: TopicCardProps) {
  const getTopicStatus = (progress: number) => {
    if (progress === 0) return { label: 'New', variant: 'secondary' as const };
    if (progress === 100) return { label: 'Completed', variant: 'success' as const };
    return { label: 'In Progress', variant: 'default' as const };
  };

  const status = getTopicStatus(topic.progress);

  return (
    <Card
      className={cn("hover:shadow-lg transition-all duration-200 cursor-pointer", className)}
      onClick={onClick}
    >
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-medium">{topic.title}</h3>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="text-muted-foreground">{topic.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={topic.progress} className="h-2" />
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="w-4 h-4 mr-2" />
          <span>
            Last updated {formatDistanceToNow(new Date(topic.updatedAt * 1000), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
