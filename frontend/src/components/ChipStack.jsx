import React from 'react';

function formatChips(amount) {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return amount.toString();
}

/* Casino-style denomination tiers */
const TIERS = [
  { min: 100000, base: '#3b3b46', face: '#55555f' }, // platinum/black
  { min: 25000, base: '#1f6f8b', face: '#2a8fb2' },  // cyan-blue
  { min: 5000, base: '#7a3fa0', face: '#9254bd' },   // purple
  { min: 1000, base: '#b8860b', face: '#d9a92c' },   // gold
  { min: 500, base: '#8a2f6b', face: '#a83f85' },    // magenta
  { min: 100, base: '#2b2b33', face: '#43434e' },    // black
  { min: 25, base: '#1e7a46', face: '#27995a' },     // green
  { min: 5, base: '#b0322e', face: '#cc4440' },      // red
  { min: 0, base: '#3d6fa8', face: '#4f8bc9' },      // blue
];

export function chipTier(amount) {
  return TIERS.find(t => amount >= t.min) || TIERS[TIERS.length - 1];
}

export default function ChipStack({ amount, currentBet }) {
  const tier = chipTier(amount || 0);
  return (
    <div
      className="chip-stack"
      style={{ '--chip-base': tier.base, '--chip-face': tier.face }}
    >
      <div className="chip-pile">
        <span className="chips chips1"></span>
        <span className="chips chips2"></span>
        <span className="chips chips3"></span>
        {currentBet > 0 && (
          <span className="bet-badge">{formatChips(currentBet)}</span>
        )}
      </div>
      <span className="chip-amount-text">{formatChips(amount)}</span>
    </div>
  );
}
