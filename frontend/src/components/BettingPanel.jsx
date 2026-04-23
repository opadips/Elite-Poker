import React, { useState } from 'react';

export default function BettingPanel({ ws, playerId, players, currentRound, chipAmount }) {
  const [selectedTarget, setSelectedTarget] = useState('');
  const [betAmount, setBetAmount] = useState(10);
  const [message, setMessage] = useState('');
  const [hasBet, setHasBet] = useState(false);

  // فقط در صورتی که بازیکن فولد کرده باشد و راند ریور شروع نشده باشد
  const isEligible = (currentRound !== 'river' && currentRound !== 'showdown');

  const handlePlaceBet = () => {
    if (!selectedTarget) {
      setMessage('Select a player to bet on');
      return;
    }
    if (betAmount < 10) {
      setMessage('Minimum bet is 10 chips');
      return;
    }
    const maxBet = Math.floor(chipAmount * 0.5);
    if (betAmount > maxBet) {
      setMessage(`Maximum bet is 50% of your chips (${maxBet})`);
      return;
    }
    ws.send(JSON.stringify({ type: 'sideBet', targetId: selectedTarget, amount: betAmount }));
    setHasBet(true);
    setMessage('Bet placed!');
    setTimeout(() => setMessage(''), 3000);
  };

  if (!isEligible) return null;
  if (hasBet) return <div className="fixed bottom-24 left-4 z-20 bg-black/60 p-2 rounded text-green-400 text-xs">Bet placed ✓</div>;

  const activePlayers = players.filter(p => !p.folded && !p.isAllIn && p.id !== playerId);

  return (
    <div className="fixed bottom-24 left-4 z-20 bg-black/70 backdrop-blur-md rounded-xl p-3 border border-purple-500/50 w-64 text-white text-sm">
      <div className="text-purple-400 font-bold text-center mb-2">🎲 Side Bet (50% profit)</div>
      <select
        className="w-full bg-gray-800 rounded p-1 mb-2 text-white"
        value={selectedTarget}
        onChange={(e) => setSelectedTarget(e.target.value)}
      >
        <option value="">Select player to win...</option>
        {activePlayers.map(p => <option key={p.id} value={p.id}>{p.name} (💰{p.chips})</option>)}
      </select>
      <input
        type="number"
        min="10"
        max={Math.floor(chipAmount * 0.5)}
        value={betAmount}
        onChange={(e) => setBetAmount(parseInt(e.target.value) || 10)}
        className="w-full bg-gray-800 rounded p-1 mb-2 text-white"
      />
      <button
        onClick={handlePlaceBet}
        className="w-full bg-purple-700 hover:bg-purple-600 py-1 rounded font-bold"
      >
        Place Bet
      </button>
      {message && <div className="text-xs text-center mt-2 text-yellow-300">{message}</div>}
      <div className="text-xs text-gray-400 mt-1">You win 1.5x if your pick wins!</div>
    </div>
  );
}