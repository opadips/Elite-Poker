import React, { useEffect, useState } from 'react';

export default function AnimatedChip({ value, fromPosition, onComplete }) {
  const [style, setStyle] = useState({
    left: fromPosition.x,
    top: fromPosition.y,
    opacity: 1,
    transform: 'scale(1)'
  });

  useEffect(() => {
    const targetX = window.innerWidth / 2;
    const targetY = window.innerHeight / 2;
    const start = { x: fromPosition.x, y: fromPosition.y };
    const end = { x: targetX, y: targetY };
    
    const animate = () => {
      setStyle({
        left: end.x,
        top: end.y,
        opacity: 0,
        transform: 'scale(0.5)',
        transition: 'all 0.5s ease-out'
      });
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
    };
    setTimeout(animate, 50);
  }, [fromPosition, onComplete]);

  return (
    <div className="fixed z-50 pointer-events-none" style={style}>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 shadow-lg border-2 border-yellow-300 flex items-center justify-center text-xs font-bold text-white">
        {value}
      </div>
    </div>
  );
}