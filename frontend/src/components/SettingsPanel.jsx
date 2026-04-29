import React from 'react';

export default function SettingsPanel({
  showSettings,
  setShowSettings,
  theme,
  themes,
  onThemeChange,
  themeExpanded,
  setThemeExpanded,
  cardBackExpanded,
  setCardBackExpanded,
  cardBackOptions,
  cardBack,
  handleCardBackChange,
  seatViewFixed,
  toggleSeatView,
  soundEnabled,
  setSoundEnabled,
  showHandInfo,
  onToggleBeginner,
  isPaused,
  togglePause,
  isAdmin,
  setResetConfirm,
  requestHandHistory,
  onReturnToLobby,
  performanceMode,
  setPerformanceMode,
}) {
  if (!showSettings) return null;

  return (
    <div className="absolute top-full right-0 mt-1 w-80 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden transition-all duration-200 origin-top-right scale-100 opacity-100"
         style={{ transformOrigin: 'top right' }}>
      <div className="max-h-[80vh] overflow-y-auto settings-scroll">
        <div className="px-5 py-3 bg-gray-800/50 border-b border-gray-700 flex items-center gap-2">
          <span className="text-xl">⚙️</span><span className="text-white font-bold text-sm">Settings</span>
        </div>
        <div className="border-b border-gray-700/50">
          <div className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-800/50" onClick={() => setThemeExpanded(!themeExpanded)}>
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"><span>🎨</span> Theme</div>
            <span className="text-gray-400 text-sm">{themeExpanded ? '▲' : '▼'}</span>
          </div>
          {themeExpanded && (
            <div className="px-4 py-3 grid grid-cols-2 gap-2">
              {themes.map(t => (
                <button key={t.id} onClick={() => { onThemeChange(t.id); setShowSettings(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${theme === t.id ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-sm' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-transparent'}`}>
                  <span className="text-lg">{t.icon}</span>{t.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="border-b border-gray-700/50">
          <div className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-800/50" onClick={() => setCardBackExpanded(!cardBackExpanded)}>
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"><span>🃏</span> Card Back</div>
            <span className="text-gray-400 text-sm">{cardBackExpanded ? '▲' : '▼'}</span>
          </div>
          {cardBackExpanded && (
            <div className="px-4 py-3 grid grid-cols-3 gap-2">
              {cardBackOptions.map(back => (
                <button key={back.id} onClick={() => handleCardBackChange(back.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${cardBack === back.id ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-gray-800 border border-transparent hover:bg-gray-700'}`}>
                  <span className="text-xl">{back.icon}</span><span className="text-xs text-gray-300">{back.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-b border-gray-700/50">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><span>🎥</span> Seat View</div>
          <button onClick={toggleSeatView} className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all ${seatViewFixed ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-gray-800 text-gray-400 border border-transparent'}`}>
            <span className="text-sm font-medium">{seatViewFixed ? 'Fixed (My Seat Bottom)' : 'Dynamic (Rotating)'}</span>
            <span className="text-lg">{seatViewFixed ? '📍' : '🔄'}</span>
          </button>
        </div>
        <div className="px-4 py-3 border-b border-gray-700/50">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><span>🔊</span> Sound</div>
          <button onClick={() => setSoundEnabled(prev => !prev)} className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all ${soundEnabled ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-gray-800 text-gray-400 border border-transparent'}`}>
            <span className="text-sm font-medium">{soundEnabled ? 'ON' : 'OFF'}</span><span className="text-lg">{soundEnabled ? '🔊' : '🔇'}</span>
          </button>
        </div>
        <div className="px-4 py-3 border-b border-gray-700/50">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><span>⚡</span> Performance Mode</div>
          <button onClick={() => setPerformanceMode(prev => !prev)} className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all ${performanceMode ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-gray-800 text-gray-400 border border-transparent'}`}>
            <span className="text-sm font-medium">{performanceMode ? 'Fast (Reduced animations)' : 'Full animations'}</span>
            <span className="text-lg">{performanceMode ? '⚡' : '🐢'}</span>
          </button>
        </div>
        <div className="px-4 py-3 border-b border-gray-700/50">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><span>🐶</span> Noob Mode</div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showHandInfo} onChange={(e) => onToggleBeginner(e.target.checked)} className="w-4 h-4" />
            <span className="text-white text-sm">🐶من نوب سگم</span>
          </label>
        </div>
        <div className="px-4 py-3 border-b border-gray-700/50">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><span>⏯️</span> Game Control</div>
          <button onClick={togglePause} className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all ${isPaused ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'}`}>
            <span className="text-sm font-medium">{isPaused ? '▶️ Resume' : '⏸️ Pause'}</span><span className="text-lg">{isPaused ? '▶️' : '⏸️'}</span>
          </button>
        </div>
        {isAdmin && (
          <div className="px-4 py-3 border-b border-gray-700/50">
            <button onClick={() => setResetConfirm(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition-all text-sm font-medium">
              <span>🔄</span> Reset Lobby
            </button>
          </div>
        )}
        <div className="px-4 py-3 border-b border-gray-700/50">
          <button onClick={requestHandHistory} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30 transition-all text-sm font-medium">
            <span>📜</span> Hand History
          </button>
        </div>
        <div className="px-4 py-3">
          <button onClick={onReturnToLobby} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 transition-all text-sm font-medium">
            <span>🚪</span> Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}