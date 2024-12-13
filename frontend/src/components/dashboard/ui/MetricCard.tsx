import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Metric } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title?: string;
  value?: string | number;
  description?: string;
  className?: string;
  metric?: Metric;
}

export function MetricCard({ title, value, description, className, metric }: MetricCardProps) {
  if (metric) {
    const Icon = metric.icon as LucideIcon;
    return (
      <Card className={cn("", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {metric.label}
          </CardTitle>
          {Icon && <Icon size={16} />}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metric.value}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
