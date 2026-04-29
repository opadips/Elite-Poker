import React, { useMemo } from 'react';

const TOTAL_SECONDS = 20;

export default function TimerRing({ remainingSec, size = 200, strokeWidth = 6 }) {
  const progress = Math.max(0, Math.min(remainingSec / TOTAL_SECONDS, 1));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const color = useMemo(() => {
    if (remainingSec > 15) return '#3b82f6';
    if (remainingSec > 5) return '#f7b731';
    return '#e74c3c';
  }, [remainingSec]);

  return (
    <svg
      width={size}
      height={size}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{ zIndex: 25 }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.5s linear' }}
      />
    </svg>
  );
}