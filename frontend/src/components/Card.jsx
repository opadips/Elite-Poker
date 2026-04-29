import React from 'react';

const cardBacks = {
  classic: 'bg-gradient-to-br from-amber-700 to-yellow-800 border-amber-500',
  royal: 'bg-gradient-to-br from-yellow-600 to-red-800 border-yellow-500',
  emerald: 'bg-gradient-to-br from-emerald-700 to-green-900 border-emerald-400',
  sapphire: 'bg-gradient-to-br from-blue-800 to-indigo-900 border-blue-300',
  onyx: 'bg-gradient-to-br from-gray-900 to-black border-gray-400',
  pearl: 'bg-gradient-to-br from-gray-200 to-white border-gray-400',
};

export default function Card({ rank, suit, hidden = false, cardBack = 'classic', isSelf = false, isCommunity = false, revealAnim = false }) {
  if (hidden) {
    const backStyle = cardBacks[cardBack] || cardBacks.classic;
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