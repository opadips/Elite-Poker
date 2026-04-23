import React, { useEffect, useState } from 'react';

export default function TurnTimer({ duration = 15, onTimeout }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft === 0) {
      if (onTimeout) onTimeout();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onTimeout]);

  return (
    <div className={`text-center text-sm font-mono font-bold px-2 py-1 rounded-full shadow-md
      ${timeLeft <= 3 ? 'bg-red-600 text-white animate-pulse' : 'bg-black/60 text-yellow-300'}`}>
      ⏱️ {timeLeft}s
    </div>
  );
}