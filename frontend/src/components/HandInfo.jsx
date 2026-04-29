import React, { useMemo } from 'react';
import { calculateEquity, getBestHandName } from '../utils/equity.js';

export default function HandInfo({
  holeCards,
  communityCards,
  round,
  playerName,
  opponentsCount,
  knownOpponentHands = null,
}) {
  const { equity, handName } = useMemo(() => {
    if (!holeCards || holeCards.length < 2) {
      return { equity: null, handName: '' };
    }
    const useExact = knownOpponentHands && knownOpponentHands.length <= 3;
    const effectiveOpponents = useExact ? knownOpponentHands.length : opponentsCount;
    const hands = useExact ? knownOpponentHands : null;
    const res = calculateEquity(holeCards, communityCards, effectiveOpponents, hands);
    const name = getBestHandName(holeCards, communityCards);
    return { equity: res, handName: name };
  }, [holeCards, communityCards, opponentsCount, knownOpponentHands]);

  const equityPercent = equity ? Math.round(equity.win * 100) : null;

  const getBarColor = (pct) => {
    if (pct >= 70) return '#ef4444';
    if (pct >= 50) return '#f97316';
    if (pct >= 30) return '#eab308';
    return '#22c55e';
  };

  return (
    <div
      className="mt-2 text-xs text-white space-y-1"
      style={{
        backgroundColor: 'var(--handinfo-bg)',
        border: '1px solid var(--handinfo-border)',
        borderRadius: '0.75rem',
        padding: '0.5rem',
      }}
    >
      <div>
        <span className="text-gray-400">{playerName}: </span>
        <span className="font-bold">{handName || '...'}</span>
      </div>
      {equityPercent !== null && (
        <div>
          <div className="flex justify-between">
            <span>Win</span>
            <span>{equityPercent}%</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${equityPercent}%`,
                backgroundColor: getBarColor(equityPercent),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}