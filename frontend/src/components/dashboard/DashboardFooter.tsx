import { Separator } from '@/components/ui/separator';
import { MetricCard } from './ui/MetricCard';
import { FOOTER_METRICS } from '@/lib/constants';

export default function DashboardFooter() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-8">
            {FOOTER_METRICS.map((metric, index) => (
              <div key={metric.label} className="flex items-center">
                <MetricCard metric={metric} />
                {index < FOOTER_METRICS.length - 1 && (
                  <Separator orientation="vertical" className="h-8 hidden md:block ml-8" />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            © 2024 QuizLearn. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}