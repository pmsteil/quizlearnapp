import { Card } from '@/components/ui/card';
import type { Metric } from '@/lib/types';

interface MetricCardProps {
  metric: Metric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const Icon = metric.icon;
  
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-5 h-5 ${metric.color || 'text-primary'}`} />
      <div>
        <div className="text-sm text-muted-foreground">{metric.label}</div>
        <div className="font-medium">{metric.value}</div>
      </div>
    </div>
  );
}