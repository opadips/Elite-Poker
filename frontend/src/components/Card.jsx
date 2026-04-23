import React from 'react';

export default function Card({ rank, suit, hidden = false }) {
  if (hidden) {
    return (
      <div className="w-14 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-md shadow-md border border-gray-600 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-gray-600 animate-pulse"></div>
      </div>
    );
  }
  const suitColor = suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-black';
  return (
    <div className="w-14 h-20 bg-white rounded-md shadow-md border border-gray-300 flex flex-col items-center justify-between p-1 font-bold transform transition-transform hover:scale-105">
      <div className="text-sm">{rank}</div>
      <div className={`text-2xl ${suitColor}`}>{suit}</div>
      <div className="text-sm rotate-180">{rank}</div>
    </div>
  );
}