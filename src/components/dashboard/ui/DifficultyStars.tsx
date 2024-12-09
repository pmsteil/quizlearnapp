import { Star } from 'lucide-react';

interface DifficultyStarsProps {
  difficulty: number;
  maxStars?: number;
}

export function DifficultyStars({ difficulty, maxStars = 5 }: DifficultyStarsProps) {
  return (
    <div className="flex">
      {Array.from({ length: maxStars }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < difficulty ? 'text-yellow-500' : 'text-muted-foreground'
          }`}
        />
      ))}
    </div>
  );
}