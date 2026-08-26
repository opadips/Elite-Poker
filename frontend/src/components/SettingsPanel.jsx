import React from 'react';
import {
  IconGear,
  IconPalette,
  IconCards,
  IconMonitor,
  IconVolume,
  IconVolumeOff,
  IconZap,
  IconFeather,
  IconGraduation,
  IconPlay,
  IconPause,
  IconReset,
  IconHistory,
  IconLogout,
} from './icons.jsx';
import { patternDefs } from './Card.jsx';

function ThemeTooltipPreview({ gradient, name }) {
  return (
    <div className="group relative inline-block">
      <div className="w-6 h-6 rounded-full border border-white/25" style={{ background: gradient }} />
      <div
        className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap z-50"
        style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', color: 'var(--text-primary)' }}
      >
        <div className="w-12 h-3 rounded mb-1" style={{ background: gradient }} />
        <div className="text-center">{name}</div>
      </div>
    </div>
  );
}

function CardBackPreview({ backId, name, large = false }) {
  const def = patternDefs[backId] || patternDefs.classic;
  const w = large ? 'w-14 h-20' : 'w-8 h-12';
  return (
    <div className="group relative inline-block">
      <div
        className={`${w} rounded shadow overflow-hidden flex items-center justify-center`}
        style={{ background: `linear-gradient(150deg, ${def.borderOuter}, ${def.bg})`, padding: '2px' }}
      >
        <div className="w-full h-full rounded-sm" style={{ backgroundColor: def.bg }} />
      </div>
      {!large && (
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap z-50"
          style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', color: 'var(--text-primary)' }}
        >
          <CardBackPreview backId={backId} name={name} large />
          <div className="text-center mt-1">{name}</div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
      <Icon /> {children}
    </div>
  );
}

function ToggleRow({ active, onClick, label, stateLabel }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all hover:brightness-125"
      style={{
        background: active ? 'var(--accent-soft)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--panel-border)'}`,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
      }}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs font-bold tracking-wider">{stateLabel}</span>
    </button>
  );
}

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

  const sectionBorder = { borderBottom: '1px solid var(--panel-border)' };

  return (
    <div
      className="absolute top-full right-0 mt-1 w-80 rounded-xl shadow-2xl z-50 overflow-hidden settings-scroll animate-fadeIn"
      style={{
        transformOrigin: 'top right',
        background: 'var(--panel-bg)',
        border: '1px solid var(--panel-border)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div className="max-h-[80vh] overflow-y-auto settings-scroll">
        <div
          className="px-5 py-3 flex items-center gap-2"
          style={{ borderBottom: '1px solid var(--panel-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--accent)' }}
        >
          <IconGear />
          <span className="font-bold text-sm tracking-widest uppercase">Settings</span>
        </div>

        {/* Theme */}
        <div style={sectionBorder}>
          <div
            className="px-4 py-3 flex justify-between items-center cursor-pointer transition-colors hover:bg-white/5"
            onClick={() => setThemeExpanded(!themeExpanded)}
          >
            <SectionHeader icon={IconPalette}>Theme</SectionHeader>
            <span style={{ color: 'var(--text-muted)' }}>{themeExpanded ? '\u25B2' : '\u25BC'}</span>
          </div>
          {themeExpanded && (
            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onThemeChange(t.id); setShowSettings(false); }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${theme === t.id ? '' : 'hover:brightness-125'}`}
                  style={{
                    background: theme === t.id ? 'var(--accent-soft)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${theme === t.id ? 'var(--accent)' : 'transparent'}`,
                    color: theme === t.id ? 'var(--accent)' : 'var(--text-primary)',
                  }}
                >
                  <ThemeTooltipPreview gradient={t.swatch} name={t.name} />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Card Back */}
        <div style={sectionBorder}>
          <div
            className="px-4 py-3 flex justify-between items-center cursor-pointer transition-colors hover:bg-white/5"
            onClick={() => setCardBackExpanded(!cardBackExpanded)}
          >
            <SectionHeader icon={IconCards}>Card Back</SectionHeader>
            <span style={{ color: 'var(--text-muted)' }}>{cardBackExpanded ? '\u25B2' : '\u25BC'}</span>
          </div>
          {cardBackExpanded && (
            <div className="px-4 pb-4 grid grid-cols-3 gap-3">
              {cardBackOptions.map(back => (
                <button
                  key={back.id}
                  onClick={() => handleCardBackChange(back.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${cardBack === back.id ? '' : 'hover:brightness-125'}`}
                  style={{
                    background: cardBack === back.id ? 'var(--accent-soft)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${cardBack === back.id ? 'var(--accent)' : 'transparent'}`,
                    color: 'var(--text-muted)',
                  }}
                >
                  <CardBackPreview backId={back.id} name={back.name} />
                  <span className="text-xs">{back.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Seat View */}
        <div className="px-4 py-3" style={sectionBorder}>
          <div className="mb-2"><SectionHeader icon={IconMonitor}>Seat View</SectionHeader></div>
          <ToggleRow
            active={seatViewFixed}
            onClick={toggleSeatView}
            label={seatViewFixed ? 'Fixed (My Seat Bottom)' : 'Dynamic (Rotating)'}
            stateLabel={seatViewFixed ? 'FIX' : 'DYN'}
          />
        </div>

        {/* Sound */}
        <div className="px-4 py-3" style={sectionBorder}>
          <div className="mb-2">
            <SectionHeader icon={soundEnabled ? IconVolume : IconVolumeOff}>Sound</SectionHeader>
          </div>
          <ToggleRow
            active={soundEnabled}
            onClick={() => setSoundEnabled(prev => !prev)}
            label={soundEnabled ? 'Sound effects on' : 'Sound effects off'}
            stateLabel={soundEnabled ? 'ON' : 'OFF'}
          />
        </div>

        {/* Performance */}
        <div className="px-4 py-3" style={sectionBorder}>
          <div className="mb-2">
            <SectionHeader icon={performanceMode ? IconZap : IconFeather}>Performance Mode</SectionHeader>
          </div>
          <ToggleRow
            active={performanceMode}
            onClick={() => setPerformanceMode(prev => !prev)}
            label={performanceMode ? 'Fast (reduced animations)' : 'Full animations'}
            stateLabel={performanceMode ? 'FAST' : 'FULL'}
          />
        </div>

        {/* Noob Mode */}
        <div className="px-4 py-3" style={sectionBorder}>
          <div className="mb-2"><SectionHeader icon={IconGraduation}>Noob Mode</SectionHeader></div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showHandInfo}
              onChange={(e) => onToggleBeginner(e.target.checked)}
              className="w-4 h-4 accent-yellow-500"
            />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Show win probability &amp; hand tips
            </span>
          </label>
        </div>

        {/* Game Control */}
        <div className="px-4 py-3" style={sectionBorder}>
          <div className="mb-2">
            <SectionHeader icon={isPaused ? IconPlay : IconPause}>Game Control</SectionHeader>
          </div>
          <ToggleRow
            active={!isPaused}
            onClick={togglePause}
            label={isPaused ? 'Resume game' : 'Pause game'}
            stateLabel={isPaused ? 'RESUME' : 'PAUSE'}
          />
        </div>

        {isAdmin && (
          <div className="px-4 py-3" style={sectionBorder}>
            <button
              onClick={() => setResetConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all hover:brightness-125 text-sm font-medium"
              style={{
                background: 'rgba(220,70,70,0.12)',
                color: '#e07a7a',
                border: '1px solid rgba(220,70,70,0.35)',
              }}
            >
              <IconReset /> Reset Lobby
            </button>
          </div>
        )}

        <div className="px-4 py-3" style={sectionBorder}>
          <button
            onClick={requestHandHistory}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all hover:brightness-125 text-sm font-medium"
            style={{
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              border: '1px solid var(--panel-border)',
            }}
          >
            <IconHistory /> Hand History
          </button>
        </div>

        <div className="px-4 py-3">
          <button
            onClick={onReturnToLobby}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all hover:brightness-125 text-sm font-medium"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-muted)',
              border: '1px solid var(--panel-border)',
            }}
          >
            <IconLogout /> Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
