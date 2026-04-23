import React, { useState } from 'react';

export default function ActionButtons({ onFold, onCheck, onCall, onRaise, onAllIn, toCall, minRaise, playerChips, currentPot }) {
  const [customRaise, setCustomRaise] = useState(minRaise);
  const [showPercent, setShowPercent] = useState(false);

  const potRaise = (percent) => {
    let amount = Math.floor(currentPot * percent / 100);
    if (amount < minRaise) amount = minRaise;
    const totalBet = toCall + amount;
    if (totalBet <= playerChips) onRaise(amount);
    else onRaise(playerChips - toCall);
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 flex flex-wrap justify-center gap-2 bg-black/60 backdrop-blur-md p-3 rounded-2xl mx-2 shadow-2xl border border-amber-700/40">
      <button onClick={onFold} className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-xl font-bold text-sm transition">Fold</button>
      
      {toCall === 0 ? (
        <button onClick={onCheck} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl font-bold text-sm">Check</button>
      ) : (
        <button onClick={onCall} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl font-bold text-sm">Call {toCall}</button>
      )}
      
      <button onClick={onAllIn} className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-xl font-bold text-sm border border-red-400">All-in</button>
      
      <div className="relative">
        <button 
          onClick={() => setShowPercent(!showPercent)}
          className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded-xl font-bold text-sm"
        >
          Raise %
        </button>
        {showPercent && (
          <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-xl p-2 flex gap-2 shadow-xl z-30">
            <button onClick={() => potRaise(50)} className="bg-yellow-500 px-3 py-1 rounded text-black text-xs">50% pot</button>
            <button onClick={() => potRaise(75)} className="bg-yellow-500 px-3 py-1 rounded text-black text-xs">75% pot</button>
            <button onClick={() => potRaise(100)} className="bg-yellow-500 px-3 py-1 rounded text-black text-xs">100% pot</button>
            <button onClick={() => potRaise(150)} className="bg-yellow-500 px-3 py-1 rounded text-black text-xs">150% pot</button>
          </div>
        )}
      </div>
      
      <div className="flex gap-1 bg-gray-800/60 p-1 rounded-xl">
        <input
          type="number"
          min={minRaise}
          max={playerChips}
          value={customRaise}
          onChange={(e) => setCustomRaise(Math.min(playerChips, Math.max(minRaise, parseInt(e.target.value) || 0)))}
          className="w-20 p-1 rounded-lg bg-gray-900 text-white text-center text-sm border border-amber-600"
        />
        <button onClick={() => onRaise(customRaise)} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-xl font-bold text-sm">Raise</button>
      </div>
    </div>
  );
}