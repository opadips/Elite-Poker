// src/components/ActionButtons.jsx
import React, { useState } from 'react';

export default function ActionButtons({ onFold, onCheck, onCall, onRaise, onAllIn, toCall, minRaise, playerChips, currentPot, myTurn, canReveal, onReveal }) {
  const [customRaise, setCustomRaise] = useState('');
  const [showPercent, setShowPercent] = useState(false);

  const potRaise = (percent) => {
    let amount = Math.floor(currentPot * percent / 100);
    if (amount < minRaise) amount = minRaise;
    const totalBet = toCall + amount;
    if (totalBet <= playerChips) onRaise(amount);
    else onRaise(playerChips - toCall);
  };

  const handleCustomRaise = () => {
    let amount = parseInt(customRaise);
    if (isNaN(amount)) amount = minRaise;
    if (amount < minRaise) amount = minRaise;
    const totalBet = toCall + amount;
    if (totalBet > playerChips) amount = playerChips - toCall;
    if (amount >= minRaise && amount <= playerChips) onRaise(amount);
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end gap-2 z-50">
      {myTurn && (
        <div className="flex gap-2 items-center bg-black/70 backdrop-blur-md p-2 rounded-2xl border border-amber-500/40 shadow-2xl">
          <button onClick={onFold} className="w-16 h-10 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs transition-colors shadow-lg">
            Fold
          </button>
          {toCall === 0 ? (
            <button onClick={onCheck} className="w-16 h-10 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-lg">
              Check
            </button>
          ) : (
            <button onClick={onCall} className="w-16 h-10 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-lg">
              Call
            </button>
          )}
          <button onClick={onAllIn} className="w-16 h-10 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs border border-red-400 transition-colors shadow-lg">
            All-in
          </button>
        </div>
      )}

      {canReveal && (
        <div className="bg-black/70 backdrop-blur-md p-2 rounded-2xl border border-purple-500/40 shadow-2xl">
          <button
            onClick={onReveal}
            className="h-10 px-4 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-sm transition-colors shadow-lg flex items-center gap-1"
          >
            <span>👁️</span> Show Cards
          </button>
        </div>
      )}

      {myTurn && (
        <div className="flex gap-2 items-center bg-black/70 backdrop-blur-md p-2 rounded-2xl border border-amber-500/40 shadow-2xl">
          <div className="relative">
            <button
              onClick={() => setShowPercent(!showPercent)}
              className="h-9 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs transition-colors"
            >
              Raise %
            </button>
            {showPercent && (
              <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-xl p-2 flex gap-1 shadow-xl z-30">
                <button onClick={() => potRaise(50)} className="bg-amber-500 px-2 py-1 rounded text-black text-xs">50%</button>
                <button onClick={() => potRaise(75)} className="bg-amber-500 px-2 py-1 rounded text-black text-xs">75%</button>
                <button onClick={() => potRaise(100)} className="bg-amber-500 px-2 py-1 rounded text-black text-xs">Pot</button>
                <button onClick={() => potRaise(150)} className="bg-amber-500 px-2 py-1 rounded text-black text-xs">150%</button>
              </div>
            )}
          </div>
          <input
            type="number"
            placeholder={minRaise.toString()}
            value={customRaise}
            onChange={(e) => setCustomRaise(e.target.value)}
            className="w-20 h-9 rounded-xl bg-gray-800 text-white text-center text-xs border border-amber-600 outline-none"
          />
          <button onClick={handleCustomRaise} className="h-9 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors">
            Raise
          </button>
        </div>
      )}
    </div>
  );
}