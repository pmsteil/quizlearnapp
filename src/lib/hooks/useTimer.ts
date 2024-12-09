import { useState, useEffect, useCallback } from 'react';

export function useTimer(onMinute: (minutes: number) => void) {
  const [seconds, setSeconds] = useState(0);

  const tick = useCallback(() => {
    setSeconds(prev => {
      const newSeconds = prev + 1;
      if (newSeconds % 60 === 0) {
        onMinute(newSeconds / 60);
      }
      return newSeconds;
    });
  }, [onMinute]);

  useEffect(() => {
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [tick]);

  return {
    minutes: Math.floor(seconds / 60),
    seconds: seconds % 60
  };
}