// src/components/Card.jsx
import React from 'react';

const cardBacks = {
  default: 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600',
  galaxy: 'bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 border-purple-500',
  gold: 'bg-gradient-to-br from-yellow-600 to-amber-800 border-yellow-500',
  matrix: 'bg-black border-green-500',
  ocean: 'bg-gradient-to-br from-blue-800 to-cyan-600 border-cyan-400',
  ruby: 'bg-gradient-to-br from-red-800 to-rose-900 border-red-500',
};

export default function Card({ rank, suit, hidden = false, cardBack = 'default', isSelf = false, isCommunity = false, revealAnim = false }) {
  if (hidden) {
    const backStyle = cardBacks[cardBack] || cardBacks.default;
    return (
      <div className={`w-14 h-20 rounded-md shadow-md border-2 flex items-center justify-center ${backStyle}`}>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
          🃏
        </div>
      </div>
    );
  }

  const isRed = suit === '♥' || suit === '♦';
  return (
    <div
      className={`card w-14 h-20 rounded-md shadow-md flex flex-col items-center justify-between p-1 font-bold transition-transform cursor-pointer select-none bg-white text-black
        ${isCommunity ? 'community-card hover:scale-150 hover:z-20 hover:shadow-2xl' : ''}
        ${isSelf ? 'self-card ring-2 ring-yellow-300 shadow-md shadow-yellow-500/50' : ''}
        ${revealAnim ? 'card-reveal-all' : ''}
      `}
    >
      <div className="text-sm">{rank}</div>
      <div className={`text-2xl ${isRed ? 'suit-red' : 'suit-black'}`}>{suit}</div>
      <div className="text-sm rotate-180">{rank}</div>
    </div>
  );
}