// src/components/HandInfo.jsx
import React, { useEffect, useState } from 'react';
import { calculateEquity } from '../utils/equity';

export default function HandInfo({ holeCards, communityCards, round, playerName, opponentsCount = 0 }) {
  const [handStrength, setHandStrength] = useState('');
  const [advice, setAdvice] = useState('');
  const [equity, setEquity] = useState(null); // درصد شانس برد
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
        suggestion = ranks[0] === 'A' || ranks[0] === 'K' ? 'Strong pair, raise!' : 'Playable.';
      } else if (suited && (ranks.includes('A') || ranks.includes('K'))) {
        strength = 'Suited high cards';
        suggestion = 'Good for flush, raise.';
      } else if (ranks.includes('A') && ranks.includes('K')) {
        strength = 'AK';
        suggestion = 'Very strong, raise.';
      } else if (ranks.includes('A')) {
        strength = 'Ace high';
        suggestion = 'Decent.';
      } else {
        strength = 'Weak hand';
        suggestion = 'Fold if raised.';
      }
    } else {
      const allCards = [...holeCards, ...communityCards];
      const rankCounts = {}; const suitCounts = {};
      for (let c of allCards) {
        rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
        suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
      }
      const maxRankCount = Math.max(...Object.values(rankCounts), 0);
      const maxSuitCount = Math.max(...Object.values(suitCounts), 0);
      if (maxRankCount === 4) strength = 'Four of a kind!';
      else if (maxRankCount === 3) strength = 'Three of a kind!';
      else if (maxRankCount === 2) {
        const pairs = Object.values(rankCounts).filter(v => v === 2).length;
        strength = pairs === 2 ? 'Two pair' : 'One pair';
      } else strength = 'High card';
      if (maxSuitCount >= 4) suggestion = 'Flush draw!';
      if (maxSuitCount >= 5) suggestion = 'Flush!';
      const rankMap = { 'J':11,'Q':12,'K':13,'A':14 };
      const numericRanks = [...new Set(allCards.map(c => rankMap[c.rank] || parseInt(c.rank)))].sort((a,b)=>a-b);
      let straight = false;
      for (let i = 0; i <= numericRanks.length-5; i++) {
        if (numericRanks[i+4] - numericRanks[i] === 4) straight = true;
      }
      if (straight) suggestion += (suggestion ? ' + ' : '') + 'Straight possible';
      if (!suggestion) suggestion = 'Keep playing.';
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
        console.error('Equity calculation error:', e);
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
    <div
      className="fixed bottom-20 left-4 z-20 backdrop-blur-md rounded-xl p-3 shadow-2xl border w-64 text-white text-xs"
      style={{
        backgroundColor: 'var(--handinfo-bg, rgba(0,0,0,0.7))',
        borderColor: 'var(--handinfo-border, #d4af37)',
      }}
    >
      <div className="text-amber-400 font-bold text-center border-b border-gray-600 pb-1 mb-2 text-sm">📊 Hand Info</div>
      <div className="mb-1">{playerName}: {holeCards?.map(c => c.rank+c.suit).join(' ') || '??'}</div>
      <div className="text-green-300 font-semibold">{handStrength}</div>
      <div className="text-blue-300 mb-2">{advice}</div>

      {/* Equity Bar */}
      <div className="mt-2">
        <div className="flex justify-between text-gray-400 text-xs mb-1">
          <span>Win Probability</span>
          <span>{calculating ? '...' : equity !== null ? `${equity}%` : '-'}</span>
        </div>
        <div className="w-full h-4 bg-gray-800/80 rounded-full overflow-hidden relative">
          {equity !== null && !calculating && (
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${getEquityColor(equity)}`}
              style={{ width: `${Math.min(equity, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          )}
          {calculating && (
            <div className="h-full w-full bg-gray-600 animate-pulse rounded-full flex items-center justify-center text-gray-300 text-xs">
              Calculating...
            </div>
          )}
        </div>
        <div className="flex justify-between text-gray-500 text-xs mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}