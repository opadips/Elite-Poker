import React, { useState } from 'react';
import { IconX, IconCheck, IconArrowUp, IconZap, IconEye } from './icons.jsx';

const PCT_OPTIONS = [25, 50, 100, 150, 200];

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
  const [raiseAmountStr, setRaiseAmountStr] = useState(minRaiseAmount.toString());

  const showCall = toCall > 0;
  const showCheck = toCall === 0;
  const canRaise = playerChips >= minRaiseAmount;
  const canCall = playerChips > 0 && showCall;
  const canAllIn = playerChips > 0;
  const [raiseOpen, setRaiseOpen] = useState(false);

  if (canReveal) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onReveal}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-xl transition-all hover:brightness-110"
          style={{ background: 'var(--button-primary)', color: '#10131c' }}
        >
          <IconEye size={16} /> Show Cards
        </button>
      </div>
    );
  }

  if (!myTurn) return null;

  const parseRaiseAmount = () => {
    let val = parseInt(raiseAmountStr, 10);
    if (isNaN(val) || val < minRaiseAmount) val = minRaiseAmount;
    if (val > playerChips) val = playerChips;
    return val;
  };

  const adjustRaise = (delta) => {
    const current = parseRaiseAmount();
    const newVal = Math.min(playerChips, Math.max(minRaiseAmount, current + delta));
    setRaiseAmountStr(newVal.toString());
  };

  const setPct = (pct) => {
    const amt = Math.floor((currentPot * pct) / 100);
    const clamped = Math.min(Math.max(amt, minRaiseAmount), playerChips);
    setRaiseAmountStr(clamped.toString());
  };

  const commitRaise = () => {
    const amount = parseRaiseAmount();
    onRaise(amount);
    setRaiseOpen(false);
  };

  const actionBtnStyle = {
    borderRadius: '0.6rem',
    fontWeight: 700,
    fontSize: '0.875rem',
    color: 'var(--btn-text, #fff)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
    transition: 'filter 0.15s ease, transform 0.1s ease',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {raiseOpen && (
        <div
          className="flex flex-col gap-2 p-3 rounded-xl backdrop-blur-md border shadow-2xl w-64 animate-fadeIn"
          style={{
            backgroundColor: 'var(--raise-panel-bg, rgba(0,0,0,0.7))',
            borderColor: 'var(--action-bar-border, rgba(255,255,255,0.2))',
          }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustRaise(-minRaise)}
              className="w-8 h-8 rounded-lg font-bold transition-colors hover:brightness-125"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--panel-border)', color: 'var(--text-primary)' }}
            >
              −
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={raiseAmountStr}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                setRaiseAmountStr(raw);
              }}
              onBlur={() => {
                const val = parseRaiseAmount();
                setRaiseAmountStr(val.toString());
              }}
              className="flex-1 text-center rounded-lg py-1 outline-none font-mono font-semibold"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                border: '1px solid var(--panel-border)',
              }}
            />
            <button
              onClick={() => adjustRaise(minRaise)}
              className="w-8 h-8 rounded-lg font-bold transition-colors hover:brightness-125"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--panel-border)', color: 'var(--text-primary)' }}
            >
              +
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PCT_OPTIONS.map((pct) => (
              <button
                key={pct}
                onClick={() => setPct(pct)}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-125"
                style={{
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--panel-border)',
                  color: 'var(--accent)',
                }}
              >
                {pct}%
              </button>
            ))}
          </div>

          <button
            onClick={commitRaise}
            className="w-full py-2 rounded-lg font-bold text-sm transition-all hover:brightness-110"
            style={{ ...actionBtnStyle, background: 'var(--btn-raise-bg, #2563eb)' }}
          >
            Raise to {parseRaiseAmount()}
          </button>
        </div>
      )}

      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md border shadow-2xl"
        style={{
          backgroundColor: 'var(--action-bar-bg, rgba(0,0,0,0.6))',
          borderColor: 'var(--action-bar-border, rgba(255,255,255,0.1))',
        }}
      >
        <button
          onClick={onFold}
          className="flex items-center gap-1.5 px-5 py-2.5 transition-all hover:brightness-110 active:scale-95"
          style={{ ...actionBtnStyle, background: 'var(--btn-fold-bg, #dc2626)' }}
        >
          <IconX size={13} /> Fold
        </button>

        {showCheck && (
          <button
            onClick={onCheck}
            className="flex items-center gap-1.5 px-5 py-2.5 transition-all hover:brightness-110 active:scale-95"
            style={{ ...actionBtnStyle, background: 'var(--btn-check-bg, #4b5563)' }}
          >
            <IconCheck size={14} /> Check
          </button>
        )}

        {canCall && (
          <button
            onClick={onCall}
            className="flex items-center gap-1.5 px-5 py-2.5 transition-all hover:brightness-110 active:scale-95"
            style={{ ...actionBtnStyle, background: 'var(--btn-call-bg, #16a34a)' }}
          >
            <IconCheck size={14} /> Call {toCall}
          </button>
        )}

        <button
          onClick={() => {
            if (canRaise) setRaiseOpen(!raiseOpen);
          }}
          disabled={!canRaise}
          className="flex items-center gap-1.5 px-5 py-2.5 transition-all hover:brightness-110 active:scale-95"
          style={{
            ...actionBtnStyle,
            background: canRaise ? 'var(--btn-raise-bg, #2563eb)' : 'var(--btn-disabled-bg, #6b7280)',
            opacity: canRaise ? 1 : 0.5,
            cursor: canRaise ? 'pointer' : 'not-allowed',
          }}
        >
          <IconArrowUp size={14} /> Raise
        </button>

        {canAllIn && (
          <button
            onClick={onAllIn}
            className="flex items-center gap-1.5 px-5 py-2.5 transition-all hover:brightness-110 active:scale-95 animate-pulse"
            style={{ ...actionBtnStyle, background: 'var(--btn-allin-bg, #ea580c)' }}
          >
            <IconZap size={14} /> All-in {playerChips}
          </button>
        )}
      </div>
    </div>
  );
}
