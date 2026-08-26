import React, { useState } from 'react';
import { IconDices } from './icons.jsx';

export default function BettingPanel({ ws, playerId, players, currentRound, chipAmount }) {
  const [selectedTarget, setSelectedTarget] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [message, setMessage] = useState('');
  const [hasBet, setHasBet] = useState(false);

  const isEligible = (currentRound !== 'river' && currentRound !== 'showdown');

  const handlePlaceBet = () => {
    let amount = parseInt(betAmount);
    if (isNaN(amount)) amount = 10;
    if (!selectedTarget) {
      setMessage('Select a player to bet on');
      return;
    }
    if (amount < 10) {
      setMessage('Minimum bet is 10 chips');
      return;
    }
    const maxBet = Math.floor(chipAmount * 0.5);
    if (amount > maxBet) {
      setMessage(`Maximum bet is 50% of your chips (${maxBet})`);
      return;
    }
    ws.send(JSON.stringify({ type: 'sideBet', targetId: selectedTarget, amount: amount }));
    setHasBet(true);
    setMessage('Bet placed!');
    setTimeout(() => setMessage(''), 3000);
  };

  const setPercentage = (percent) => {
    let amount = Math.floor(chipAmount * percent / 100);
    if (amount < 10) amount = 10;
    else if (amount > Math.floor(chipAmount * 0.5)) amount = Math.floor(chipAmount * 0.5);
    setBetAmount(amount.toString());
  };

  if (!isEligible) return null;
  if (hasBet) return (
    <div
      className="fixed bottom-24 right-4 z-20 p-2 rounded-lg text-xs backdrop-blur-md"
      style={{ background: 'var(--seat-bg)', border: '1px solid var(--panel-border)', color: '#5fd08a' }}
    >
      Bet placed
    </div>
  );

  const activePlayers = players.filter(p => !p.folded && !p.isAllIn && p.id !== playerId);

  return (
    <div
      className="fixed bottom-24 right-4 z-20 backdrop-blur-md rounded-xl p-3 w-72 text-sm shadow-xl"
      style={{
        backgroundColor: 'var(--sidebet-bg)',
        border: '1px solid var(--sidebet-border)',
        color: 'var(--sidebet-text)',
      }}
    >
      <div className="font-bold text-center mb-2 flex items-center justify-center gap-2" style={{ color: 'var(--sidebet-text)' }}>
        <IconDices /> Side Bet (50% profit)
      </div>
      <select
        className="w-full rounded p-1.5 mb-2 outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', color: 'var(--text-primary)' }}
        value={selectedTarget}
        onChange={(e) => setSelectedTarget(e.target.value)}
      >
        <option value="" style={{ color: '#111' }}>Select player to win...</option>
        {activePlayers.map(p => <option key={p.id} value={p.id} style={{ color: '#111' }}>{p.name} ({p.chips})</option>)}
      </select>
      <div className="flex gap-2 mb-2">
        {[10, 20, 50].map(pct => (
          <button
            key={pct}
            onClick={() => setPercentage(pct)}
            className="flex-1 px-2 py-1 rounded text-xs font-semibold transition-all hover:brightness-125"
            style={{ background: 'var(--accent-soft)', border: '1px solid var(--panel-border)', color: 'var(--accent)' }}
          >
            {pct}%
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Amount"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          className="flex-1 rounded p-1.5 outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', color: 'var(--text-primary)' }}
        />
        <button
          onClick={handlePlaceBet}
          className="px-4 py-1 rounded font-bold transition-all hover:brightness-110"
          style={{ background: 'var(--button-primary)', color: '#10131c' }}
        >
          Bet
        </button>
      </div>
      {message && (
        <div className="text-xs text-center mt-2" style={{ color: 'var(--accent)' }}>{message}</div>
      )}
      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>You win 1.5x if your pick wins!</div>
    </div>
  );
}
