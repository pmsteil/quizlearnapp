import { Trophy } from 'lucide-react';

export default function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, Alex! 👋</h1>
          <div className="mt-2 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="text-muted-foreground">12 day streak</span>
          </div>
        </div>
      </div>
    </header>
  );
}