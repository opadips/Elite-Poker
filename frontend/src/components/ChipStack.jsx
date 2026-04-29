import React from 'react';

function formatChips(amount) {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return amount.toString();
}

export default function ChipStack({ amount, currentBet }) {
  return (
    <div className="chip-stack">
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