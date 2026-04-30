import React from 'react';
import Card from './Card.jsx';
import ChipStack from './ChipStack.jsx';

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
          <div className="pot-chip-stack">
            <ChipStack amount={gameState.totalPot} />
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