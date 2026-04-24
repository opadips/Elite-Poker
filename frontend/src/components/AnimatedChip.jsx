// src/components/AnimatedChip.jsx
import React, { useEffect, useState } from 'react';
import './../styles/animations.css'; // ایمپورت CSS جدید

export default function AnimatedChip({ value, fromPosition, onComplete }) {
  const [phase, setPhase] = useState('start'); // start, moving, arrived
  const [style, setStyle] = useState({
    left: fromPosition.x,
    top: fromPosition.y,
    opacity: 1,
    transform: 'scale(1)'
  });

  useEffect(() => {
    // مقصد: مرکز میز (محل پات)
    const targetX = window.innerWidth / 2;
    const targetY = window.innerHeight / 2;

    // فاز حرکت به سمت مقصد
    setPhase('moving');
    setStyle({
      left: targetX,
      top: targetY,
      opacity: 1,
      transform: 'scale(0.9)' // کمی کوچک شدن در مسیر
    });

    // بعد از رسیدن، جهش انجام بده
    const moveDuration = 600; // هماهنگ با transition در CSS
    const bounceTimer = setTimeout(() => {
      setPhase('arrived');
      setStyle(prev => ({
        ...prev,
        transform: 'scale(1.2)' // بزرگ‌تر برای شروع جهش
      }));
    }, moveDuration);

    // اتمام انیمیشن
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, moveDuration + 400);

    return () => {
      clearTimeout(bounceTimer);
      clearTimeout(completeTimer);
    };
  }, [fromPosition, onComplete]);

  return (
    <div className="chip-animated" style={style}>
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 shadow-lg border-2 border-yellow-300 flex items-center justify-center text-xs font-bold text-white
        ${phase === 'arrived' ? 'chip-bounce' : ''}`}>
        {value}
      </div>
    </div>
  );
}