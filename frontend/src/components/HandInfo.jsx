// src/components/HandInfo.jsx
import React, { useEffect, useState } from 'react';
import { calculateEquity } from '../utils/equity';

export default function HandInfo({ holeCards, communityCards, round, playerName, opponentsCount = 0 }) {
  const [handStrength, setHandStrength] = useState('');
  const [advice, setAdvice] = useState('');
  const [equity, setEquity] = useState(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (!holeCards || holeCards.length === 0) {
      setHandStrength('');
      setAdvice('');
      return;
    }
    const ranks = holeCards.map(c => c.rank);
    const suited = holeCards[0].suit === holeCards[1].suit;
    let strength = '';
    let suggestion = '';

    if (round === 'preflop') {
      if (ranks[0] === ranks[1]) {
        strength = 'Pair';
        suggestion = ranks[0] === 'A' || ranks[0] === 'K' ? 'Raise!' : 'Playable';
      } else if (suited && (ranks.includes('A') || ranks.includes('K'))) {
        strength = 'Suited high';
        suggestion = 'Raise';
      } else if (ranks.includes('A') && ranks.includes('K')) {
        strength = 'AK';
        suggestion = 'Raise';
      } else if (ranks.includes('A')) {
        strength = 'Ace high';
        suggestion = 'Decent';
      } else {
        strength = 'Weak';
        suggestion = 'Fold?';
      }
    } else {
      const allCards = [...holeCards, ...communityCards];
      const rankCounts = {}; const suitCounts = {};
      for (let c of allCards) {
        rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
        suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
      }
      const maxRank = Math.max(...Object.values(rankCounts), 0);
      if (maxRank === 4) strength = 'Quads!';
      else if (maxRank === 3) strength = 'Trips';
      else if (maxRank === 2) {
        const pairs = Object.values(rankCounts).filter(v => v === 2).length;
        strength = pairs === 2 ? 'Two Pair' : 'One Pair';
      } else strength = 'High Card';
      if (Math.max(...Object.values(suitCounts), 0) >= 4) suggestion = 'Flush draw';
      if (Math.max(...Object.values(suitCounts), 0) >= 5) suggestion = 'Flush!';
    }
    setHandStrength(strength);
    setAdvice(suggestion);
  }, [holeCards, communityCards, round]);

  useEffect(() => {
    if (!holeCards || holeCards.length < 2) {
      setEquity(null);
      return;
    }
    if (opponentsCount <= 0) {
      setEquity(100);
      return;
    }
    setCalculating(true);
    const timer = setTimeout(() => {
      try {
        const eq = calculateEquity(holeCards, communityCards, opponentsCount, 2000);
        setEquity(eq);
      } catch (e) {
        setEquity(null);
      }
      setCalculating(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [holeCards, communityCards, opponentsCount]);

  const getEquityColor = (val) => {
    if (val <= 30) return 'bg-gradient-to-r from-green-500 to-green-400';
    if (val <= 60) return 'bg-gradient-to-r from-orange-400 to-orange-500';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  return (
    <div className="mt-1 w-full text-white text-xs bg-black/70 rounded-lg p-1.5 backdrop-blur-sm">
      <div className="flex justify-between items-center">
        <span className="text-green-300 font-semibold">{handStrength}</span>
        <span className="text-blue-300">{advice}</span>
      </div>
      <div className="mt-1.5">
        <div className="flex justify-between text-gray-400 text-[10px] mb-0.5">
          <span>Win</span>
          <span>{calculating ? '...' : equity !== null ? `${equity}%` : '-'}</span>
        </div>
        <div className="w-full h-2.5 bg-gray-800/80 rounded-full overflow-hidden">
          {equity !== null && !calculating && (
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${getEquityColor(equity)}`}
              style={{ width: `${Math.min(equity, 100)}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}