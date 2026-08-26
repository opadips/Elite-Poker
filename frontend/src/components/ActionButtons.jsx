import React, { useState } from 'react';
import { IconX, IconCheck, IconArrowUp, IconZap, IconEye } from './icons.jsx';

function formatAmount(value) {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (value >= 10_000) return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(value);
}

export default function ActionButtons({
  onFold,
  onCheck,
  onCall,
  onRaise,
  onAllIn,
  toCall,
  minRaise,
  playerChips,
  currentPot,
  myTurn,
  canReveal,
  onReveal,
}) {
  const minRaiseAmount = toCall + minRaise;
  const [raiseAmountStr, setRaiseAmountStr] = useState(String(minRaiseAmount));
  const [raiseOpen, setRaiseOpen] = useState(false);

  const showCall = toCall > 0;
  const showCheck = toCall === 0;
  const canRaise = playerChips >= minRaiseAmount;
  const canCall = playerChips > 0 && showCall;
  const canAllIn = playerChips > 0;

  if (canReveal) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button className="action-btn action-btn--reveal" onClick={onReveal}>
          <IconEye size={15} /> Show Cards
        </button>
      </div>
    );
  }

  if (!myTurn) return null;

  const clamp = (v) => Math.min(Math.max(Math.floor(v), minRaiseAmount), playerChips);

  const parseRaiseAmount = () => {
    let val = parseInt(raiseAmountStr, 10);
    if (isNaN(val) || val < minRaiseAmount) val = minRaiseAmount;
    if (val > playerChips) val = playerChips;
    return val;
  };

  const presets = [
    { label: 'Min', value: minRaiseAmount },
    { label: '25%', value: currentPot * 0.25 },
    { label: '50%', value: currentPot * 0.5 },
    { label: 'Pot', value: currentPot },
    { label: 'Max', value: playerChips },
  ];

  const commitRaise = () => {
    onRaise(parseRaiseAmount());
    setRaiseOpen(false);
  };

  const toggleRaisePanel = () => {
    if (!canRaise) return;
    if (!raiseOpen) setRaiseAmountStr(String(minRaiseAmount));
    setRaiseOpen(!raiseOpen);
  };

  const sliderStep = Math.max(1, minRaise);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {raiseOpen && (
        <div className="raise-panel animate-fadeIn">
          <div className="raise-panel-header">
            <span className="raise-panel-label">Raise to</span>
            <input
              type="text"
              inputMode="numeric"
              className="raise-input"
              value={raiseAmountStr}
              onChange={(e) => setRaiseAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={() => setRaiseAmountStr(String(parseRaiseAmount()))}
              onKeyDown={(e) => e.key === 'Enter' && commitRaise()}
            />
          </div>

          <input
            type="range"
            className="raise-slider"
            min={minRaiseAmount}
            max={Math.max(playerChips, minRaiseAmount)}
            step={sliderStep}
            value={parseRaiseAmount()}
            onChange={(e) => setRaiseAmountStr(e.target.value)}
          />

          <div className="grid grid-cols-5 gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                className="raise-chip"
                onClick={() => setRaiseAmountStr(String(clamp(p.value)))}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button className="action-btn action-btn--raise w-full" onClick={commitRaise}>
            <IconCheck size={14} /> Confirm {formatAmount(parseRaiseAmount())}
          </button>
        </div>
      )}

      <div className="action-bar">
        <button className="action-btn action-btn--fold" onClick={onFold}>
          <IconX size={13} /> Fold
        </button>

        {showCheck && (
          <button className="action-btn action-btn--check" onClick={onCheck}>
            <IconCheck size={15} /> Check
          </button>
        )}

        {canCall && (
          <button className="action-btn action-btn--call" onClick={onCall}>
            <IconCheck size={15} /> Call
            <span className="action-amount">{formatAmount(toCall)}</span>
          </button>
        )}

        <button
          className="action-btn action-btn--raise"
          onClick={toggleRaisePanel}
          disabled={!canRaise}
        >
          <IconArrowUp size={14} /> Raise
        </button>

        {canAllIn && (
          <button className="action-btn action-btn--allin" onClick={onAllIn}>
            <IconZap size={14} /> All-in
            <span className="action-amount">{formatAmount(playerChips)}</span>
          </button>
        )}
      </div>
    </div>
  );
}
