import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

function easeOutQuad(t) {
  return t * (2 - t);
}

export default function AnimatedChip({ value, from, to, onComplete, duration = 800 }) {
  const startTimeRef = useRef(null);
  const completedRef = useRef(false);
  const [pos, setPos] = useState(from);
  const validFrom = from && typeof from.x === 'number' && typeof from.y === 'number';
  const validTo = to && typeof to.x === 'number' && typeof to.y === 'number';

  const chipSize =
    value >= 500 ? 'w-10 h-10 text-sm' :
    value >= 200 ? 'w-9 h-9 text-xs' :
    'w-8 h-8 text-xs';

  const chipColor =
    value >= 500 ? 'from-red-500 to-rose-700 border-rose-300' :
    value >= 200 ? 'from-amber-400 to-amber-700 border-yellow-300' :
    'from-emerald-400 to-emerald-600 border-green-300';

  useEffect(() => {
    if (!validFrom || !validTo) {
      if (onComplete && !completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
      return;
    }

    let rafId;
    const startX = from.x;
    const startY = from.y;
    const deltaX = to.x - startX;
    const deltaY = to.y - startY;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuad(progress);
      const arcHeight = -80 * Math.sin(progress * Math.PI);

      setPos({
        x: startX + deltaX * eased,
        y: startY + deltaY * eased + arcHeight * (1 - eased),
      });

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        if (onComplete && !completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
      }
    };

    rafId = requestAnimationFrame(animate);

    const safetyTimer = setTimeout(() => {
      if (onComplete && !completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, duration + 200);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(safetyTimer);
    };
  }, []);

  if (!validFrom || !validTo) {
    return null;
  }

  const chipElement = (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        pointerEvents: 'none',
        transition: 'none',
      }}
    >
      <div className={`${chipSize} rounded-full bg-gradient-to-br ${chipColor} shadow-lg border-2 flex items-center justify-center font-bold text-white`}>
        {value}
      </div>
    </div>
  );

  return ReactDOM.createPortal(chipElement, document.body);
}