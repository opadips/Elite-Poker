import React from 'react';

const patternDefs = {
  classic: {
    bg: '#78350f',
    borderOuter: '#f59e0b',
    borderInner: '#fbbf24',
    pattern: (
      <pattern id="classic" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#78350f" />
        <path d="M10,2 L18,10 L10,18 L2,10 Z" fill="none" stroke="#f59e0b" strokeWidth="2" />
        <path d="M10,6 L14,10 L10,14 L6,10 Z" fill="#f59e0b" opacity="0.8" />
        <circle cx="10" cy="10" r="1.5" fill="#78350f" />
        <circle cx="10" cy="2" r="1" fill="#f59e0b" opacity="0.6" />
        <circle cx="10" cy="18" r="1" fill="#f59e0b" opacity="0.6" />
      </pattern>
    ),
  },
  royal: {
    bg: '#4c1d95',
    borderOuter: '#c084fc',
    borderInner: '#e9d5ff',
    pattern: (
      <pattern id="royal" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
        <rect width="30" height="30" fill="#4c1d95" />
        <path d="M15,4 L21,26 L9,26 Z" fill="none" stroke="#c084fc" strokeWidth="1.5" />
        <path d="M15,10 L17,15 L22,17 L17,19 L15,24 L13,19 L8,17 L13,15 Z" fill="none" stroke="#c084fc" strokeWidth="1" />
        <circle cx="15" cy="17" r="2" fill="#c084fc" opacity="0.6" />
        <path d="M9,10 Q15,15 21,10" fill="none" stroke="#c084fc" strokeWidth="1" opacity="0.5" />
      </pattern>
    ),
  },
  emerald: {
    bg: '#064e3b',
    borderOuter: '#34d399',
    borderInner: '#a7f3d0',
    pattern: (
      <pattern id="emerald" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill="#064e3b" />
        <path d="M12,2 Q20,12 12,22 Q4,12 12,2 Z" fill="none" stroke="#34d399" strokeWidth="2" />
        <path d="M12,6 L15,12 L12,18 L9,12 Z" fill="#34d399" opacity="0.3" />
        <path d="M2,12 Q12,20 22,12 Q12,4 2,12 Z" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.6" />
        <circle cx="12" cy="12" r="2" fill="#34d399" opacity="0.9" />
      </pattern>
    ),
  },
  sapphire: {
    bg: '#1e3a8a',
    borderOuter: '#60a5fa',
    borderInner: '#bfdbfe',
    pattern: (
      <pattern id="sapphire" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill="#1e3a8a" />
        <polygon points="12,3 15.5,8.5 21,9 17.5,13.5 18.5,19.5 12,16 5.5,19.5 6.5,13.5 3,9 8.5,8.5" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="3" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.7" />
        <circle cx="12" cy="12" r="1.5" fill="#60a5fa" opacity="0.8" />
        <path d="M12,3 L12,21" stroke="#60a5fa" strokeWidth="0.5" opacity="0.4" />
        <path d="M3,12 L21,12" stroke="#60a5fa" strokeWidth="0.5" opacity="0.4" />
      </pattern>
    ),
  },
  onyx: {
    bg: '#0a0a0a',
    borderOuter: '#9ca3af',
    borderInner: '#d1d5db',
    pattern: (
      <pattern id="onyx" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#0a0a0a" />
        <path d="M0,0 L20,20 M20,0 L0,20" stroke="#9ca3af" strokeWidth="1.5" opacity="0.6" />
        <path d="M10,0 L10,20 M0,10 L20,10" stroke="#9ca3af" strokeWidth="1" opacity="0.5" />
        <circle cx="10" cy="10" r="4" fill="none" stroke="#9ca3af" strokeWidth="2" />
        <circle cx="10" cy="10" r="1.5" fill="#9ca3af" opacity="0.8" />
        <rect x="7" y="7" width="6" height="6" fill="none" stroke="#9ca3af" strokeWidth="0.5" opacity="0.3" />
      </pattern>
    ),
  },
  pearl: {
    bg: '#faf7f2',
    borderOuter: '#a8a29e',
    borderInner: '#d6d3d1',
    pattern: (
      <pattern id="pearl" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#faf7f2" />
        <circle cx="10" cy="10" r="6" fill="none" stroke="#a8a29e" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="3" fill="none" stroke="#a8a29e" strokeWidth="1" strokeDasharray="3,3" />
        <circle cx="10" cy="10" r="1" fill="#a8a29e" opacity="0.6" />
        <path d="M5,5 L15,15 M15,5 L5,15" stroke="#a8a29e" strokeWidth="0.5" opacity="0.3" />
        <circle cx="5" cy="5" r="0.8" fill="#a8a29e" opacity="0.4" />
        <circle cx="15" cy="15" r="0.8" fill="#a8a29e" opacity="0.4" />
        <circle cx="5" cy="15" r="0.8" fill="#a8a29e" opacity="0.4" />
        <circle cx="15" cy="5" r="0.8" fill="#a8a29e" opacity="0.4" />
      </pattern>
    ),
  },
};

function CardBack({ cardBack }) {
  const def = patternDefs[cardBack] || patternDefs.classic;
  const id = `cardback-${cardBack}`;
  return (
    <div
      className="w-14 h-20 rounded-md shadow-md border-2 flex items-center justify-center"
      style={{
        borderColor: def.borderOuter,
        padding: '2px',
      }}
    >
      <div
        className="w-full h-full rounded-sm border overflow-hidden"
        style={{
          borderColor: def.borderInner,
          borderWidth: '1px',
        }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {React.cloneElement(def.pattern, { id })}
          </defs>
          <rect width="100%" height="100%" fill={`url(#${id})`} />
        </svg>
      </div>
    </div>
  );
}

export default function Card({ rank, suit, hidden = false, cardBack = 'classic', isSelf = false, isCommunity = false, revealAnim = false }) {
  if (hidden) {
    return <CardBack cardBack={cardBack} />;
  }

  const isRed = suit === '♥' || suit === '♦';
  return (
    <div
      className={`card w-14 h-20 rounded-md shadow-md flex flex-col items-center justify-between p-1 font-bold transition-transform cursor-pointer select-none bg-white text-black
        ${isCommunity ? 'community-card hover:scale-150 hover:z-20 hover:shadow-2xl' : ''}
        ${isSelf ? 'self-card ring-2 ring-yellow-300 shadow-md shadow-yellow-500/50' : ''}
        ${revealAnim ? 'card-reveal-all' : ''}
      `}
    >
      <div className="text-sm">{rank}</div>
      <div className={`text-2xl ${isRed ? 'suit-red' : 'suit-black'}`}>{suit}</div>
      <div className="text-sm rotate-180">{rank}</div>
    </div>
  );
}