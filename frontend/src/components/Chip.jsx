import React from 'react';

export default function Chip({ value, stacked = false }) {
  let chipColor = 'bg-amber-500';
  if (value >= 100) chipColor = 'bg-amber-600';
  else if (value >= 50) chipColor = 'bg-blue-500';
  else if (value >= 25) chipColor = 'bg-green-500';
  else chipColor = 'bg-red-500';
  
  return (
    <div className={`${chipColor} rounded-full w-8 h-8 flex items-center justify-center text-white font-bold shadow-md border border-yellow-300 ${stacked ? '-mt-2 first:mt-0' : ''}`}>
      {value}
    </div>
  );
}