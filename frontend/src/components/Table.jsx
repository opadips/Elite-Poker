import React from 'react';
import Card from './Card.jsx';

function formatChips(amount) {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return amount.toString();
}

export default function Table({
  tableContainerRef,
  tableRef,
  gameState,
  newCardIndices,
  prevCommunityLengthRef,
}) {
  return (
    <div ref={tableContainerRef} className="relative w-full h-full">
      <div ref={tableRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[65%] h-[55%] rounded-full bg-amber-800/30 shadow-2xl border-8 border-amber-700/40 backdrop-blur-sm game-table">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          <div className="bg-black/60 text-white px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap shadow-lg" style={{ background: 'var(--pot-bg)' }}>
            💰 Pot: {formatChips(gameState.totalPot)}
          </div>
          <div className="flex gap-3 p-4 bg-amber-950/50 rounded-3xl">
            {gameState.communityCards.map((card, i) => (
              <div key={i} className={newCardIndices.includes(i) ? 'card-reveal-spin' : ''}
                style={{ animationDelay: newCardIndices.includes(i) ? `${(i - (prevCommunityLengthRef.current - newCardIndices.length)) * 0.15}s` : '0s' }}>
                <Card rank={card.rank} suit={card.suit} isCommunity={true} />
              </div>
            ))}
            {gameState.communityCards.length === 0 && <div className="text-white text-sm">Flop</div>}
          </div>
        </div>
      </div>
    </div>
  );
}