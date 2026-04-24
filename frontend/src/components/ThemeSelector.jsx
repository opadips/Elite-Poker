import React from 'react';

const themes = [
  { id: 'classic', name: '🎩 Classic', icon: '🃏' },
  { id: 'cyberpunk', name: '🤖 Cyberpunk', icon: '💠' },
  { id: 'fantasy', name: '🧙 Fantasy', icon: '✨' },
  { id: 'midnight', name: '🌙 Midnight', icon: '🌙' }
];

export default function ThemeSelector({ currentTheme, onThemeChange }) {
  return (
    <div className="flex gap-2">
      {themes.map(theme => (
        <button
          key={theme.id}
          onClick={() => onThemeChange(theme.id)}
          className={`px-3 py-1 rounded-lg text-sm font-bold transition-all flex items-center gap-1
            ${currentTheme === theme.id 
              ? 'bg-amber-500 text-black shadow-lg scale-105' 
              : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          title={theme.name}
        >
          <span>{theme.icon}</span>
          <span className="hidden md:inline">{theme.name.split(' ')[1]}</span>
        </button>
      ))}
    </div>
  );
}