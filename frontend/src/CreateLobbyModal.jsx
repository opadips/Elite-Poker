import React, { useState } from 'react';
import {
  DEFAULT_SMALL_BLIND,
  DEFAULT_BIG_BLIND,
  MAX_STARTING_CHIPS,
} from './constants.js';
import { IconX } from './components/icons.jsx';

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  color: 'var(--text-primary)',
  border: '1px solid var(--panel-border)',
};

export default function CreateLobbyModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [startingChips, setStartingChips] = useState(1000);
  const [smallBlind, setSmallBlind] = useState(DEFAULT_SMALL_BLIND);
  const [bigBlind, setBigBlind] = useState(DEFAULT_BIG_BLIND);
  const [mode, setMode] = useState('tournament');

  const handleStartingChipsChange = (e) => {
    let val = parseInt(e.target.value) || 1000;
    if (val > MAX_STARTING_CHIPS) val = MAX_STARTING_CHIPS;
    if (val < 100) val = 100;
    setStartingChips(val);
    const newSmall = Math.max(1, Math.round(val / 100));
    setSmallBlind(newSmall);
    setBigBlind(newSmall * 2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      password: password || null,
      startingChips,
      smallBlind,
      bigBlind,
      mode,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div
        className="glass-panel rounded-2xl p-6 shadow-2xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2
            className="text-xl font-bold tracking-wide"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}
          >
            Create New Table
          </h2>
          <button
            onClick={onClose}
            className="transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            <IconX size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs block mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Table Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-2 outline-none transition-colors focus:border-[var(--accent)]"
              style={inputStyle}
              placeholder="My Table"
              required
            />
          </div>
          <div>
            <label className="text-xs block mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl px-4 py-2 outline-none transition-colors focus:border-[var(--accent)]"
              style={inputStyle}
              placeholder="Fun cash game"
            />
          </div>
          <div>
            <label className="text-xs block mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Password (optional)</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-2 outline-none transition-colors focus:border-[var(--accent)]"
              style={inputStyle}
              placeholder="Leave blank for public"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs block mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Starting Chips</label>
              <input
                type="number"
                value={startingChips}
                onChange={handleStartingChipsChange}
                className="w-full rounded-xl px-4 py-2 outline-none transition-colors focus:border-[var(--accent)]"
                style={inputStyle}
                min={100}
                step={100}
                max={MAX_STARTING_CHIPS}
              />
            </div>
            <div>
              <label className="text-xs block mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Game Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full rounded-xl px-4 py-2 outline-none transition-colors focus:border-[var(--accent)]"
                style={inputStyle}
              >
                <option value="tournament">Tournament</option>
                <option value="cash" disabled>Cash Game (Coming Soon)</option>
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Small Blind</label>
              <input
                type="number"
                value={smallBlind}
                onChange={(e) => setSmallBlind(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-xl px-4 py-2 outline-none transition-colors focus:border-[var(--accent)]"
                style={inputStyle}
                min={1}
                step={1}
              />
            </div>
            <div>
              <label className="text-xs block mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Big Blind</label>
              <input
                type="number"
                value={bigBlind}
                onChange={(e) => setBigBlind(Math.max(2, parseInt(e.target.value) || 2))}
                className="w-full rounded-xl px-4 py-2 outline-none transition-colors focus:border-[var(--accent)]"
                style={inputStyle}
                min={2}
                step={1}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 font-bold py-3 rounded-xl transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: 'var(--button-primary)', color: '#10131c' }}
            >
              Create Table
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 font-semibold py-3 rounded-xl transition-all hover:brightness-125"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--panel-border)', color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
