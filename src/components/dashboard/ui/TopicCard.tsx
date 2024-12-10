import { cn } from "@/lib/utils";
import type { Topic } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface TopicCardProps {
  topic: Topic;
  className?: string;
}

export function TopicCard({ topic, className }: TopicCardProps) {
  return (
    <div className={cn("p-4 border rounded-lg", className)}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium">{topic.title}</h3>
          <p className="text-sm text-muted-foreground">{topic.description}</p>
        </div>
        <div className="text-sm font-medium">
          {topic.progress}% Complete
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        Last updated: {formatDistanceToNow(new Date(topic.updated_at * 1000), { addSuffix: true })}
      </div>
    </div>
  );
}
