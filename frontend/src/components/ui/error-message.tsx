import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  title: string;
  message: string;
  className?: string;
}

export function ErrorMessage({ title, message, className }: ErrorMessageProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-destructive/50 bg-destructive/10 p-4',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
        <div className="space-y-1">
          <h5 className="font-medium text-destructive">{title}</h5>
          <p className="text-sm text-destructive/90">{message}</p>
        </div>
      </div>
    </div>
  );
}
