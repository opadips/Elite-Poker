import React, { useState } from 'react';

export default function CreateLobbyModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [startingChips, setStartingChips] = useState(1000);
  const [smallBlind, setSmallBlind] = useState(10);
  const [bigBlind, setBigBlind] = useState(20);
  const [mode, setMode] = useState('tournament');

  const handleChipsChange = (value) => {
    const chips = parseInt(value) || 1000;
    const capped = Math.min(Math.max(chips, 100), 1000000);
    setStartingChips(capped);
    const newSB = Math.max(5, Math.floor(capped / 100));
    const newBB = Math.max(10, Math.floor(capped / 50));
    setSmallBlind(newSB);
    setBigBlind(newBB);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      password: password || null,
      startingChips: parseInt(startingChips) || 1000,
      smallBlind: parseInt(smallBlind) || 10,
      bigBlind: parseInt(bigBlind) || 20,
      mode,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900/95 backdrop-blur-md rounded-2xl p-6 border border-amber-500/50 shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-extrabold text-amber-400 mb-4">Create New Table</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Table Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 rounded-xl px-4 py-2 text-white border border-gray-600 focus:border-amber-500 outline-none"
              placeholder="My Table"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-800 rounded-xl px-4 py-2 text-white border border-gray-600 focus:border-amber-500 outline-none"
              placeholder="Fun cash game"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Password (optional)</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 rounded-xl px-4 py-2 text-white border border-gray-600 focus:border-amber-500 outline-none"
              placeholder="Leave blank for public"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Starting Chips</label>
              <input
                type="number"
                value={startingChips}
                onChange={(e) => handleChipsChange(e.target.value)}
                className="w-full bg-gray-800 rounded-xl px-4 py-2 text-white border border-gray-600 focus:border-amber-500 outline-none"
                min={100}
                max={1000000}
                step={100}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Small Blind</label>
              <input
                type="number"
                value={smallBlind}
                onChange={(e) => setSmallBlind(Math.max(5, parseInt(e.target.value) || 5))}
                className="w-full bg-gray-800 rounded-xl px-4 py-2 text-white border border-gray-600 focus:border-amber-500 outline-none"
                min={5}
                step={5}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Big Blind</label>
              <input
                type="number"
                value={bigBlind}
                onChange={(e) => setBigBlind(Math.max(10, parseInt(e.target.value) || 10))}
                className="w-full bg-gray-800 rounded-xl px-4 py-2 text-white border border-gray-600 focus:border-amber-500 outline-none"
                min={10}
                step={10}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Game Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full bg-gray-800 rounded-xl px-4 py-2 text-white border border-gray-600 focus:border-amber-500 outline-none"
              >
                <option value="tournament">Tournament</option>
                <option value="cash">Cash Game</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-xl transition-all"
            >
              Create Table
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}