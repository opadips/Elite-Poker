import React, { useMemo } from 'react';

const TOTAL_SECONDS = 20;

export default function TimerRing({ remainingSec, width, height }) {
  if (!width || !height || remainingSec <= 0) return null;

  const progress = Math.max(0, Math.min(remainingSec / TOTAL_SECONDS, 1));
  const rx = 16;
  const ry = 16;

  const perimeter =
    2 * (width - 2 * rx) +
    2 * (height - 2 * ry) +
    2 * Math.PI * rx;

  const dashOffset = perimeter * (1 - progress);

  const color = useMemo(() => {
    if (remainingSec > 15) return '#3b82f6';
    if (remainingSec > 10) return '#22c55e';
    if (remainingSec > 5) return '#f7b731';
    return '#dc2626';
  }, [remainingSec]);

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{ zIndex: 25 }}
    >
      <defs>
        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect
        x={2}
        y={2}
        width={width - 4}
        height={height - 4}
        rx={rx}
        ry={ry}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={perimeter}
        strokeDashoffset={dashOffset}
        filter="url(#neonGlow)"
        style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.5s linear' }}
      />
    </svg>
  );
}