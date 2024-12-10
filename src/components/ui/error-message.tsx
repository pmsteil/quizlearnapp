import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  title: string;
  message: string;
  className?: string;
}

export function ErrorMessage({ title, message, className = '' }: ErrorMessageProps) {
  return (
    <div className={`rounded-lg bg-destructive/15 p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <h3 className="font-medium text-destructive">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-destructive/90">{message}</p>
    </div>
  );
}
