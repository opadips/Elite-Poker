// src/components/Leaderboard.jsx
import React, { useState } from 'react';

export default function Leaderboard({ players, currentRound }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const activePlayers = players.filter(p => !p.isSpectator);
  const sorted = [...activePlayers].sort((a, b) => (b.score || 0) - (a.score || 0) || b.chips - a.chips);

  const togglePlayer = (id) => {
    setExpandedPlayer(prev => prev === id ? null : id);
  };

  return (
    <div className={`fixed top-4 left-24 z-30 bg-black/70 backdrop-blur-md rounded-xl shadow-2xl border border-amber-700/50 transition-all duration-300 ${isMinimized ? 'w-auto' : 'w-72'}`}>
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
          <div className="max-h-80 overflow-y-auto px-2 pb-2 space-y-1">
            {sorted.map((p, i) => (
              <div key={p.id}>
                <div
                  className="flex justify-between items-center text-sm bg-gray-800/50 rounded-lg px-2 py-1 cursor-pointer hover:bg-gray-700/50"
                  onClick={() => togglePlayer(p.id)}
                >
                  <div className="flex gap-2 items-center">
                    <span className="text-amber-500 font-bold w-5">{i+1}</span>
                    <span className="text-white truncate max-w-[80px]">{p.name}</span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-yellow-400">🏅 {p.score || 0}</span>
                    <span className="text-green-400 font-mono">💰 {p.chips}</span>
                  </div>
                </div>
                {expandedPlayer === p.id && p.stats && (
                  <div className="bg-gray-900/80 rounded-lg mt-1 p-2 text-xs text-gray-300 space-y-1">
                    <div>🃏 Hands Played: {p.stats.handsPlayed}</div>
                    <div>🏆 Pots Won: {p.stats.potsWon}</div>
                    <div>❌ Losses: {p.stats.losses}</div>
                    <div>💰 Biggest Pot: {p.stats.biggestPot}</div>
                    <div>✨ Best Hand: {p.stats.bestHand || 'N/A'}</div>
                  </div>
                )}
              </div>
            ))}
            {activePlayers.length === 0 && (
              <div className="text-center text-gray-400 text-xs py-2">No active players</div>
            )}
          </div>
          <div className="text-[10px] text-center text-gray-400 mt-1 mb-1 border-t border-gray-700 pt-1">
            Score = rounds won
          </div>
        </>
      )}
    </div>
  );
}