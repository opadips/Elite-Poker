import React, { useEffect, useState, useRef } from 'react';

export default function TurnTimer({ duration = 20, onTimeout, resetTrigger }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef(null);
  const timeoutCalledRef = useRef(false);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    timeoutCalledRef.current = false;
    setTimeLeft(duration);
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimer();
          if (!timeoutCalledRef.current) {
            timeoutCalledRef.current = true;
            if (onTimeout) onTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startTimer();
    return () => clearTimer();
  }, [resetTrigger]);

  return (
    <div className={`text-center text-sm font-mono font-bold px-2 py-1 rounded-full shadow-md
      ${timeLeft <= 3 ? 'bg-red-600 text-white animate-pulse' : 'bg-black/60 text-yellow-300'}`}>
      ⏱️ {timeLeft}s
    </div>
  );
}