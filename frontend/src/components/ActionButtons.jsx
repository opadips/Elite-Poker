import React, { useState } from 'react';

const PCT_OPTIONS = [25, 50, 100, 150, 200];

export default function ActionButtons({
  onFold,
  onCheck,
  onCall,
  onRaise,
  onAllIn,
  toCall,
  minRaise,
  playerChips,
  currentPot,
  myTurn,
  canReveal,
  onReveal,
}) {
  const [raiseAmount, setRaiseAmount] = useState(minRaise);
  const [raiseOpen, setRaiseOpen] = useState(false);

  const showCall = toCall > 0;
  const showCheck = toCall === 0;
  const minRaiseAmount = toCall + minRaise;
  const canRaise = playerChips >= minRaiseAmount;
  const canCall = playerChips > 0 && showCall;
  const canAllIn = playerChips > 0;

  if (canReveal) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onReveal}
          className="px-6 py-3 rounded-xl font-bold text-sm shadow-xl transition-colors"
          style={{
            backgroundColor: '#7e22ce',
            color: '#fff',
          }}
        >
          Show Cards
        </button>
      </div>
    );
  }

  if (!myTurn) return null;

  const setPct = (pct) => {
    const amt = Math.floor((currentPot * pct) / 100);
    const clamped = Math.min(Math.max(amt, minRaiseAmount), playerChips);
    setRaiseAmount(clamped);
  };

  const commitRaise = () => {
    onRaise(raiseAmount);
    setRaiseOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {raiseOpen && (
        <div
          className="flex flex-col gap-2 p-3 rounded-xl backdrop-blur-md border shadow-2xl w-64"
          style={{
            backgroundColor: 'var(--raise-panel-bg, rgba(0,0,0,0.7))',
            borderColor: 'var(--action-bar-border, rgba(255,255,255,0.2))',
          }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRaiseAmount((p) => Math.max(minRaiseAmount, p - minRaise))}
              className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold"
            >
              −
            </button>
            <input
              type="number"
              value={raiseAmount}
              onChange={(e) => {
                let val = parseInt(e.target.value) || minRaiseAmount;
                if (val < minRaiseAmount) val = minRaiseAmount;
                if (val > playerChips) val = playerChips;
                setRaiseAmount(val);
              }}
              className="flex-1 bg-gray-900 text-white text-center rounded-lg py-1 border border-gray-600 focus:border-amber-400 outline-none"
            />
            <button
              onClick={() => setRaiseAmount((p) => Math.min(playerChips, p + minRaise))}
              className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold"
            >
              +
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PCT_OPTIONS.map((pct) => (
              <button
                key={pct}
                onClick={() => setPct(pct)}
                className="px-2 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>

          <button
            onClick={commitRaise}
            className="w-full py-2 rounded-lg font-bold text-sm text-white transition-colors"
            style={{ backgroundColor: 'var(--btn-raise-bg, #2563eb)' }}
          >
            Raise to {raiseAmount}
          </button>
        </div>
      )}

      {/* Main action bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md border shadow-2xl"
        style={{
          backgroundColor: 'var(--action-bar-bg, rgba(0,0,0,0.6))',
          borderColor: 'var(--action-bar-border, rgba(255,255,255,0.1))',
        }}
      >
        <button
          onClick={onFold}
          className="px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-md"
          style={{ backgroundColor: 'var(--btn-fold-bg, #dc2626)', color: 'var(--btn-text, #fff)' }}
        >
          Fold
        </button>

        {showCheck && (
          <button
            onClick={onCheck}
            className="px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-md"
            style={{ backgroundColor: 'var(--btn-check-bg, #4b5563)', color: 'var(--btn-text, #fff)' }}
          >
            Check
          </button>
        )}

        {canCall && (
          <button
            onClick={onCall}
            className="px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-md"
            style={{ backgroundColor: 'var(--btn-call-bg, #16a34a)', color: 'var(--btn-text, #fff)' }}
          >
            Call {toCall}
          </button>
        )}

        <button
          onClick={() => {
            if (canRaise) setRaiseOpen(!raiseOpen);
          }}
          disabled={!canRaise}
          className="px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-md"
          style={{
            backgroundColor: canRaise ? 'var(--btn-raise-bg, #2563eb)' : 'var(--btn-disabled-bg, #6b7280)',
            color: 'var(--btn-text, #fff)',
            opacity: canRaise ? 1 : 0.5,
            cursor: canRaise ? 'pointer' : 'not-allowed',
          }}
        >
          Raise
        </button>

        {canAllIn && (
          <button
            onClick={onAllIn}
            className="px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-md animate-pulse"
            style={{ backgroundColor: 'var(--btn-allin-bg, #ea580c)', color: 'var(--btn-text, #fff)' }}
          >
            All‑in {playerChips}
          </button>
        )}
      </div>
    </div>
  );
}