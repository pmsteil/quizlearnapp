export function calculateProgress(correct: number, total: number) {
  return {
    percentage: Math.round((correct / total) * 100),
    remaining: total - (correct + 1),
    accuracy: `${Math.round((correct / (correct + 1)) * 100)}%`
  };
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}