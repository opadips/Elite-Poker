import React, { useState } from 'react';
import {
  IconTrophy,
  IconMedal,
  IconCoins,
  IconCards,
  IconX,
  IconSparkles,
  IconTrendingUp,
  IconChevronDown,
  IconChevronUp,
} from './icons.jsx';

function formatChips(amount) {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return amount.toString();
}

function StatRow({ icon: Icon, label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
        <Icon size={12} /> {label}
      </span>
      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

export default function Leaderboard({ players, currentRound }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const activePlayers = players.filter(p => !p.isSpectator);
  const sorted = [...activePlayers].sort((a, b) => (b.score || 0) - (a.score || 0) || b.chips - a.chips);

  const togglePlayer = (id) => {
    setExpandedPlayer(prev => prev === id ? null : id);
  };

  return (
    <div
      className={`fixed top-2 left-2 z-30 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 ${isMinimized ? 'w-auto' : 'w-72'}`}
      style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
    >
      <div
        className="flex justify-between items-center font-bold px-3 py-2 cursor-pointer rounded-t-xl transition-colors"
        style={{ borderBottom: isMinimized ? 'none' : '1px solid var(--panel-border)', color: 'var(--accent)' }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <span className="flex items-center gap-2 text-sm tracking-wide uppercase">
          <IconTrophy size={15} /> Leaderboard
        </span>
        {isMinimized ? <IconChevronDown size={14} /> : <IconChevronUp size={14} />}
      </div>

      {!isMinimized && (
        <>
          <div className="text-xs text-center mt-1.5 mb-1" style={{ color: 'var(--text-muted)' }}>
            Round: <span style={{ color: 'var(--text-primary)' }} className="font-semibold capitalize">{currentRound}</span>
          </div>
          <div className="max-h-80 overflow-y-auto px-2 pb-2 space-y-1">
            {sorted.map((p, i) => (
              <div key={p.id}>
                <div
                  className="flex justify-between items-center text-sm rounded-lg px-2 py-1.5 cursor-pointer transition-colors hover:brightness-125"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid transparent' }}
                  onClick={() => togglePlayer(p.id)}
                >
                  <div className="flex gap-2 items-center min-w-0">
                    <span className="font-bold w-5" style={{ color: 'var(--accent)' }}>{i + 1}</span>
                    <span className="truncate max-w-[90px]" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                  </div>
                  <div className="flex gap-3 text-xs shrink-0">
                    <span className="flex items-center gap-1" style={{ color: '#e8c96a' }}>
                      <IconMedal size={12} /> {p.score || 0}
                    </span>
                    <span className="flex items-center gap-1 font-mono" style={{ color: '#5fd08a' }}>
                      <IconCoins size={12} /> {formatChips(p.chips)}
                    </span>
                  </div>
                </div>
                {expandedPlayer === p.id && p.stats && (
                  <div
                    className="rounded-lg mt-1 mb-1 p-2 text-xs space-y-1"
                    style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid var(--panel-border)' }}
                  >
                    <StatRow icon={IconCards} label="Hands" value={p.stats.handsPlayed} />
                    <StatRow icon={IconTrophy} label="Pots Won" value={p.stats.potsWon} />
                    <StatRow icon={IconX} label="Losses" value={p.stats.losses} />
                    <StatRow icon={IconCoins} label="Biggest Pot" value={formatChips(p.stats.biggestPot)} />
                    <StatRow icon={IconSparkles} label="Best Hand" value={p.stats.bestHand || 'N/A'} />
                    {p.stats.handsPlayed > 0 && (
                      <StatRow
                        icon={IconTrendingUp}
                        label="Win Rate"
                        value={`${Math.round((p.stats.potsWon / p.stats.handsPlayed) * 100)}%`}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
            {activePlayers.length === 0 && (
              <div className="text-center text-xs py-2" style={{ color: 'var(--text-muted)' }}>No active players</div>
            )}
          </div>
          <div
            className="text-[10px] text-center py-1.5"
            style={{ borderTop: '1px solid var(--panel-border)', color: 'var(--text-muted)' }}
          >
            Score = rounds won
          </div>
        </>
      )}
    </div>
  );
}
