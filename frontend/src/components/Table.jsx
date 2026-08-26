import React from 'react';
import Card from './Card.jsx';
import ChipStack from './ChipStack.jsx';
import { SuitSpade } from './icons.jsx';

export default function Table({
  tableContainerRef,
  tableRef,
  gameState,
  newCardIndices,
  prevCommunityLengthRef,
}) {
  return (
    <div ref={tableContainerRef} className="relative w-full h-full">
      {/* Outer rail */}
      <div
        ref={tableRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[65%] h-[55%] rounded-[50%] game-table"
        style={{
          padding: '16px',
          background: 'var(--table-rim)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 50px var(--accent-soft)',
          border: '1px solid rgba(0,0,0,0.65)',
        }}
      >
        {/* Inner felt */}
        <div
          className="w-full h-full rounded-[50%] flex items-center justify-center"
          style={{
            background: 'var(--table-felt)',
            boxShadow:
              'inset 0 4px 18px rgba(0,0,0,0.65), inset 0 0 90px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
            border: '1px solid rgba(0,0,0,0.5)',
          }}
        >
          {/* Betting line */}
          <div
            className="absolute rounded-[50%] pointer-events-none"
            style={{
              inset: '11%',
              border: '1.5px solid rgba(255,255,255,0.09)',
            }}
          />
          <SuitSpade
            size={110}
            style={{
              position: 'absolute',
              opacity: 0.06,
              color: '#ffffff',
              pointerEvents: 'none',
            }}
          />

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10">
            <div className="pot-chip-stack">
              <ChipStack amount={gameState.totalPot} />
            </div>
            <div
              className="flex gap-3 p-4 rounded-3xl backdrop-blur-sm"
              style={{
                background: 'var(--pot-bg)',
                border: '1px solid var(--panel-border)',
              }}
            >
              {gameState.communityCards.map((card, i) => (
                <div key={i} className={newCardIndices.includes(i) ? 'card-reveal-spin' : ''}
                  style={{ animationDelay: newCardIndices.includes(i) ? `${(i - (prevCommunityLengthRef.current - newCardIndices.length)) * 0.15}s` : '0s' }}>
                  <Card rank={card.rank} suit={card.suit} isCommunity={true} />
                </div>
              ))}
              {gameState.communityCards.length === 0 && (
                <div className="text-xs tracking-[0.3em] uppercase py-3 px-2" style={{ color: 'var(--text-muted)' }}>
                  Waiting for deal
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
