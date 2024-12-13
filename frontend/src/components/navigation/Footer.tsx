import { Brain, Clock, BookOpen } from 'lucide-react';

export default function Footer() {
  const metrics = [
    { icon: Brain, label: 'Questions Answered', value: '1,234' },
    { icon: Clock, label: 'Learning Time', value: '48h 23m' },
    { icon: BookOpen, label: 'Active Topics', value: '5' },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-center gap-16">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex items-center gap-3">
                <metric.icon className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">{metric.label}</div>
                  <div className="font-medium">{metric.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground text-center border-t border-border pt-4">
            © 2024 QuizLearn. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}