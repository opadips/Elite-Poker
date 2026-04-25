// src/components/AnimatedChip.jsx
import React, { useEffect, useState } from 'react';
import './../styles/animations.css';

export default function AnimatedChip({ value, fromPosition, toPosition, onComplete }) {
  const chipSize = value >= 500 ? 'w-10 h-10 text-sm' : value >= 200 ? 'w-9 h-9 text-xs' : 'w-8 h-8 text-xs';
  const chipColor = value >= 500 ? 'from-red-500 to-rose-700 border-rose-300' :
                     value >= 200 ? 'from-amber-400 to-amber-700 border-yellow-300' :
                     'from-emerald-400 to-emerald-600 border-green-300';

  const [style, setStyle] = useState({
    left: fromPosition.x,
    top: fromPosition.y,
    opacity: 1,
    transform: 'scale(1)'
  });

  useEffect(() => {
    const targetX = toPosition ? toPosition.x : window.innerWidth / 2;
    const targetY = toPosition ? toPosition.y : window.innerHeight / 2;

    setStyle({
      left: targetX,
      top: targetY,
      opacity: 1,
      transform: 'scale(0.85)'
    });

    const moveDuration = 800;
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, moveDuration);

    return () => clearTimeout(completeTimer);
  }, [fromPosition, toPosition, onComplete]);

  return (
    <div className="chip-animated" style={style}>
      <div className={`${chipSize} rounded-full bg-gradient-to-br ${chipColor} shadow-lg border-2 flex items-center justify-center font-bold text-white`}>
        {value}
      </div>
    </div>
  );
}