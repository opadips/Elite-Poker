import React from 'react';

export default function Leaderboard({ players, currentRound }) {
  // مرتب‌سازی بر اساس امتیاز (اولویت اول) و بعد چیپ
  const sorted = [...players].sort((a,b) => {
    if (a.score !== b.score) return (b.score || 0) - (a.score || 0);
    return b.chips - a.chips;
  });

  return (
    <div className="fixed top-4 right-4 z-20 bg-black/70 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-amber-700/50 w-64">
      <div className="text-amber-400 font-bold text-center border-b border-amber-700 pb-1 mb-2">🏆 TOURNAMENT SCORES</div>
      <div className="text-white text-xs text-center mb-2">Round: {currentRound}</div>
      <div className="space-y-1 max-h-72 overflow-y-auto">
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
      <div className="text-[10px] text-center text-gray-400 mt-2 border-t border-gray-700 pt-1">
        Score = rounds won
      </div>
    </div>
  );
}