// src/components/BettingPanel.jsx
import React, { useState } from 'react';

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
  if (hasBet) return <div className="fixed bottom-24 left-4 z-20 bg-black/60 p-2 rounded text-green-400 text-xs">Bet placed ✓</div>;

  const activePlayers = players.filter(p => !p.folded && !p.isAllIn && p.id !== playerId);

  return (
    <div
      className="fixed bottom-24 left-4 z-20 backdrop-blur-md rounded-xl p-3 w-72 text-white text-sm shadow-lg"
      style={{
        backgroundColor: 'var(--sidebet-bg)',
        border: '1px solid var(--sidebet-border)',
        color: 'var(--sidebet-text)'
      }}
    >
      <div className="font-bold text-center mb-2" style={{ color: 'var(--sidebet-text)' }}>
        🎲 Side Bet (50% profit)
      </div>
      <select
        className="w-full bg-gray-800 rounded p-1 mb-2 text-white"
        value={selectedTarget}
        onChange={(e) => setSelectedTarget(e.target.value)}
      >
        <option value="">Select player to win...</option>
        {activePlayers.map(p => <option key={p.id} value={p.id}>{p.name} (💰{p.chips})</option>)}
      </select>
      <div className="flex gap-2 mb-2">
        <button onClick={() => setPercentage(10)} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs">10%</button>
        <button onClick={() => setPercentage(20)} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs">20%</button>
        <button onClick={() => setPercentage(50)} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs">50%</button>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Amount"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          className="flex-1 bg-gray-800 rounded p-1 text-white"
        />
        <button
          onClick={handlePlaceBet}
          className="px-3 py-1 rounded font-bold"
          style={{ backgroundColor: 'var(--button-primary)', color: 'white' }}
        >
          Bet
        </button>
      </div>
      {message && <div className="text-xs text-center mt-2 text-yellow-300">{message}</div>}
      <div className="text-xs text-gray-400 mt-1">You win 1.5x if your pick wins!</div>
    </div>
  );
}