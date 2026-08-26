import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { chipTier } from './ChipStack.jsx';

function easeOutQuad(t) {
  return t * (2 - t);
}

export default function AnimatedChip({ value, from, to, onComplete, duration = 800 }) {
  const startTimeRef = useRef(null);
  const completedRef = useRef(false);
  const [pos, setPos] = useState(from);
  const validFrom = from && typeof from.x === 'number' && typeof from.y === 'number';
  const validTo = to && typeof to.x === 'number' && typeof to.y === 'number';

  const tier = chipTier(value || 0);
  const chipSize = value >= 500 ? 40 : value >= 200 ? 36 : 32;

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
    }, duration + 1000);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(safetyTimer);
      if (onComplete && !completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
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
      <div
        className="rounded-full flex items-center justify-center font-bold"
        style={{
          width: chipSize,
          height: chipSize,
          fontSize: chipSize >= 40 ? '0.8rem' : '0.7rem',
          background: `repeating-conic-gradient(#f3efe4 0deg 16deg, ${tier.base} 16deg 60deg)`,
          boxShadow: '0 3px 8px rgba(0,0,0,0.5)',
        }}
      >
        <span
          className="rounded-full flex items-center justify-center"
          style={{
            width: chipSize - 10,
            height: chipSize - 10,
            background: tier.face,
            boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.4)',
            border: '1.5px dashed rgba(255,255,255,0.55)',
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.7)',
          }}
        >
          {value >= 1000 ? `${Math.round(value / 1000)}K` : value}
        </span>
      </div>
    </div>
  );

  return ReactDOM.createPortal(chipElement, document.body);
}