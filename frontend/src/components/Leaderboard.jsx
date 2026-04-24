import React, { useState } from 'react';

export default function Leaderboard({ players, currentRound }) {
  const [isMinimized, setIsMinimized] = useState(false);

  const sorted = [...players].sort((a, b) => {
    if (a.score !== b.score) return (b.score || 0) - (a.score || 0);
    return b.chips - a.chips;
  });

  return (
    <div className={`fixed top-4 left-24 z-30 bg-black/70 backdrop-blur-md rounded-xl shadow-2xl border border-amber-700/50 transition-all duration-300 ${isMinimized ? 'w-auto' : 'w-64'}`}>
      {/* هدر لیدربورد - قابل کلیک برای minimize/expand */}
      <div 
        className="flex justify-between items-center text-amber-400 font-bold border-b border-amber-700/50 px-3 py-2 cursor-pointer hover:bg-amber-900/20"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <span>🏆 LEADERBOARD</span>
        <span className="text-sm">{isMinimized ? '▼' : '▲'}</span>
      </div>
      
      {!isMinimized && (
        <>
          <div className="text-white text-xs text-center mt-1 mb-1">Round: {currentRound}</div>
          <div className="max-h-72 overflow-y-auto px-2 pb-2 space-y-1">
            {sorted.map((p, i) => (
              <div key={p.id} className="flex justify-between items-center text-sm bg-gray-800/50 rounded-lg px-2 py-1">
                <div className="flex gap-2 items-center">
                  <span className="text-amber-500 font-bold w-5">{i+1}</span>
                  <span className="text-white truncate max-w-[80px]">{p.name}</span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-yellow-400">🏅 {p.score || 0}</span>
                  <span className="text-green-400 font-mono">💰 {p.chips}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-center text-gray-400 mt-1 mb-1 border-t border-gray-700 pt-1">
            Score = rounds won
          </div>
        </>
      )}
    </div>
  );
}