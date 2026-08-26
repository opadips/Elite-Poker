import React from 'react';
import { getSuitIcon, SuitSpade } from './icons.jsx';

const patternDefs = {
  classic: {
    bg: '#101826',
    borderOuter: '#c9a227',
    borderInner: '#e7cf7a',
    label: 'Midnight',
    pattern: (
      <pattern id="classic" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill="#101826" />
        <path d="M7,3 L10,7 L7,11 L4,7 Z" fill="none" stroke="#c9a227" strokeWidth="1" opacity="0.75" />
        <circle cx="7" cy="7" r="0.9" fill="#c9a227" opacity="0.7" />
      </pattern>
    ),
  },
  royal: {
    bg: '#241043',
    borderOuter: '#a78bfa',
    borderInner: '#ddd0ff',
    label: 'Royal',
    pattern: (
      <pattern id="royal" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill="#241043" />
        <path d="M7,2.5 L8.4,5.6 L11.5,7 L8.4,8.4 L7,11.5 L5.6,8.4 L2.5,7 L5.6,5.6 Z" fill="#a78bfa" opacity="0.65" />
      </pattern>
    ),
  },
  emerald: {
    bg: '#062b1e',
    borderOuter: '#46b57f',
    borderInner: '#a7f3d0',
    label: 'Emerald',
    pattern: (
      <pattern id="emerald" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill="#062b1e" />
        <path d="M7,2 Q10.5,7 7,12 Q3.5,7 7,2 Z" fill="none" stroke="#46b57f" strokeWidth="1" opacity="0.75" />
        <circle cx="7" cy="7" r="1" fill="#46b57f" opacity="0.8" />
      </pattern>
    ),
  },
  sapphire: {
    bg: '#122a52',
    borderOuter: '#60a5fa',
    borderInner: '#bfdbfe',
    label: 'Sapphire',
    pattern: (
      <pattern id="sapphire" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
        <rect width="14" height="14" fill="#122a52" />
        <polygon points="7,2.5 8.3,5.7 11.5,7 8.3,8.3 7,11.5 5.7,8.3 2.5,7 5.7,5.7" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.8" />
        <circle cx="7" cy="7" r="0.8" fill="#60a5fa" opacity="0.9" />
      </pattern>
    ),
  },
  onyx: {
    bg: '#0d0f12',
    borderOuter: '#9ca3af',
    borderInner: '#d1d5db',
    label: 'Onyx',
    pattern: (
      <pattern id="onyx" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="#0d0f12" />
        <path d="M0,0 L10,10 M10,0 L0,10" stroke="#9ca3af" strokeWidth="0.7" opacity="0.4" />
        <circle cx="5" cy="5" r="1.4" fill="none" stroke="#9ca3af" strokeWidth="0.9" opacity="0.7" />
      </pattern>
    ),
  },
  pearl: {
    bg: '#efe9dd',
    borderOuter: '#a89f90',
    borderInner: '#d6cec0',
    label: 'Pearl',
    pattern: (
      <pattern id="pearl" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="12" height="12" fill="#efe9dd" />
        <circle cx="6" cy="6" r="3" fill="none" stroke="#a89f90" strokeWidth="1" opacity="0.8" />
        <circle cx="6" cy="6" r="0.9" fill="#a89f90" opacity="0.7" />
      </pattern>
    ),
  },
};

export { patternDefs };

function CardBack({ cardBack }) {
  const def = patternDefs[cardBack] || patternDefs.classic;
  const id = `cardback-${cardBack}`;
  return (
    <div
      className="relative w-14 h-20 rounded-lg shadow-md flex items-center justify-center"
      style={{
        background: `linear-gradient(150deg, ${def.borderOuter} 0%, ${def.bg} 50%, ${def.borderOuter} 100%)`,
        padding: '2px',
      }}
    >
      <div
        className="relative w-full h-full rounded-md overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: def.bg, padding: '3px' }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '4px' }}>
          <defs>
            {React.cloneElement(def.pattern, { id })}
          </defs>
          <rect width="100%" height="100%" fill={`url(#${id})`} />
          <rect x="0.5" y="0.5" width="99%" height="99%" fill="none" stroke={def.borderInner} strokeWidth="1" opacity="0.65" rx="3" />
        </svg>
        {/* Center medallion */}
        <div
          className="absolute flex items-center justify-center rounded-full"
          style={{
            width: 22,
            height: 22,
            background: def.bg,
            border: `1.5px solid ${def.borderOuter}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          <SuitSpade size={12} style={{ color: def.borderOuter }} />
        </div>
      </div>
    </div>
  );
}

function CardFace({ rank, suit, isRed, isCommunity, isSelf, revealAnim }) {
  const Suit = getSuitIcon(suit);
  const corner = (
    <>
      <span className="text-[11px] font-bold leading-none">{rank}</span>
      {Suit && <Suit size={9} />}
    </>
  );

  return (
    <div
      className={`relative w-14 h-20 rounded-lg shadow-md select-none overflow-hidden
        ${isCommunity ? 'community-card hover:scale-150 hover:z-20 hover:shadow-2xl' : ''}
        ${isSelf ? 'self-card' : ''}
        ${revealAnim ? 'card-reveal-all' : ''}
      `}
    >
      {/* subtle inner sheen */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.28) 0%, transparent 38%)' }}
      />
      {/* top-left index */}
      <div className={`absolute top-1 left-1 flex flex-col items-center leading-none ${isRed ? 'suit-red' : 'suit-black'}`}>
        {corner}
      </div>
      {/* bottom-right index (rotated) */}
      <div className={`absolute bottom-1 right-1 rotate-180 flex flex-col items-center leading-none ${isRed ? 'suit-red' : 'suit-black'}`}>
        {corner}
      </div>
      {/* center pip */}
      <div className={`absolute inset-0 flex items-center justify-center ${isRed ? 'suit-red' : 'suit-black'}`}>
        {Suit && <Suit size={26} />}
      </div>
    </div>
  );
}

export default function Card({
  rank,
  suit,
  hidden = false,
  cardBack = 'classic',
  isSelf = false,
  isCommunity = false,
  revealAnim = false,
}) {
  if (hidden) {
    return <CardBack cardBack={cardBack} />;
  }

  const isRed = suit === '♥' || suit === '♦';

  return (
    <div
      className="card w-14 h-20 rounded-lg cursor-pointer"
      style={{ backgroundColor: 'var(--card-bg)', color: 'var(--card-text)' }}
    >
      <CardFace rank={rank} suit={suit} isRed={isRed} isCommunity={isCommunity} isSelf={isSelf} revealAnim={revealAnim} />
    </div>
  );
}
