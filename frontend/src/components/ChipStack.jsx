import React from 'react';
import Chip from './Chip.jsx';

export default function ChipStack({ amount }) {
  const denominations = [100, 50, 25, 10, 5];
  let remaining = amount;
  const chips = [];
  for (let denom of denominations) {
    const count = Math.floor(remaining / denom);
    for (let i = 0; i < Math.min(count, 5); i++) chips.push(denom);
    remaining %= denom;
  }
  return (
    <div className="flex flex-col items-center justify-center">
      {chips.slice(0, 6).map((val, idx) => <Chip key={idx} value={val} stacked={idx > 0} />)}
      {amount > 0 && <span className="text-xs text-white mt-1 font-bold">{amount}</span>}
    </div>
  );
}