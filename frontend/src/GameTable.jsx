// frontend/src/GameTable.jsx
import React, { useEffect, useState, useRef } from 'react';
import ActionButtons from './components/ActionButtons.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import AnimatedChip from './components/AnimatedChip.jsx';
import Chat from './components/Chat.jsx';
import BettingPanel from './components/BettingPanel.jsx';
import PlayerSeat from './components/PlayerSeat.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import Table from './components/Table.jsx';
import GameContext from './context/GameContext';
import { usePlayerPositions } from './hooks/usePlayerPositions';
import { useGameActions } from './hooks/useGameActions';
import { useGameSocket } from './hooks/useGameSocket';
import './styles/animations.css';

const cardBackOptions = [
  { id: 'default', name: 'Classic', icon: '🃏' },
  { id: 'galaxy', name: 'Galaxy', icon: '🌌' },
  { id: 'gold', name: 'Royal Gold', icon: '👑' },
  { id: 'matrix', name: 'Matrix', icon: '💚' },
  { id: 'ocean', name: 'Ocean', icon: '🌊' },
  { id: 'ruby', name: 'Ruby', icon: '💎' },
];

function formatChips(amount) {
  if (amount >= 1000000)
    return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (amount >= 1000)
    return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return amount.toString();
}

export default function GameTable({
  ws,
  playerId,
  lobbyId,
  isAdmin,
  theme,
  onThemeChange,
  onReturnToLobby,
  onLeaveLobby,
}) {
  const [showHandInfo, setShowHandInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cardBack, setCardBack] = useState(
    () => localStorage.getItem('pokerCardBack') || 'default'
  );
  const [seatViewFixed, setSeatViewFixed] = useState(
    () => localStorage.getItem('seatViewFixed') !== 'false'
  );
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [cardBackExpanded, setCardBackExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const tableContainerRef = useRef(null);
  const playerRefs = useRef({});
  const soundEnabledRef = useRef(true);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const {
    gameState,
    winnerEffect,
    winningHandName,
    animatingChips,
    setAnimatingChips,
    systemMessage,
    sideBetWin,
    showChat,
    setShowChat,
    newCardIndices,
    chatMessages,
    isPaused,
    achievementToast,
    speechBubbles,
    turnRemainingSec,
    turnCurrentPlayerId,
    handHistory,
  } = useGameSocket(ws, soundEnabledRef);

  const { playerPositions, tableRef } = usePlayerPositions(
    gameState,
    playerId,
    seatViewFixed
  );

  const themes = [
    { id: 'classic', name: 'Classic', icon: '🃏', color: 'bg-emerald-800' },
    { id: 'cyberpunk', name: 'Cyberpunk', icon: '💠', color: 'bg-purple-800' },
    { id: 'fantasy', name: 'Fantasy', icon: '✨', color: 'bg-amber-700' },
    { id: 'midnight', name: 'Midnight', icon: '🌙', color: 'bg-blue-900' },
    { id: 'neonjungle', name: 'Neon Jungle', icon: '🌿', color: 'bg-green-950' },
    { id: 'void', name: 'Void Pulse', icon: '🌀', color: 'bg-indigo-950' },
  ];

  const sendWs = (msg) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  };

  const currentPlayer = gameState?.players?.find((p) => p.id === playerId);

  const {
    handleAction,
    handleRevealCards,
    toggleReady,
    sitIn,
    resetLobby,
    togglePause,
    requestHandHistory,
    addChipAnimation,
  } = useGameActions(
    ws,
    isPaused,
    soundEnabled,
    setShowSettings,
    setResetConfirm,
    gameState,
    playerId,
    currentPlayer,
    setAnimatingChips,
    playerRefs,
    sendWs
  );

  const removeChipAnimation = (id) =>
    setAnimatingChips((prev) => prev.filter((c) => c.id !== id));

  useEffect(() => {
    if (winnerEffect?.winnerId && gameState) {
      const winnerEl = playerRefs.current[winnerEffect.winnerId];
      if (!winnerEl) return;
      const rect = winnerEl.getBoundingClientRect();
      const toPos = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const fromPos = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          setAnimatingChips((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              value: Math.floor(gameState.totalPot / 6),
              fromPos,
              toPosition: toPos,
            },
          ]);
        }, i * 200);
      }
    }
  }, [winnerEffect, gameState]);

  const getTimerColor = (sec) => {
    if (sec > 15) return '#3b82f6';
    if (sec > 10) return '#22c55e';
    if (sec > 5) return '#eab308';
    return '#ef4444';
  };

  const onToggleBeginner = (checked) => {
    setShowHandInfo(checked);
    if (checked) sendWs({ type: 'toggleBeginner' });
  };

  const handleCardBackChange = (backId) => {
    setCardBack(backId);
    localStorage.setItem('pokerCardBack', backId);
  };

  const handleSendChat = (text) => sendWs({ type: 'chat', message: text });

  const toggleSeatView = () =>
    setSeatViewFixed((prev) => {
      const next = !prev;
      localStorage.setItem('seatViewFixed', next);
      return next;
    });

  const handleChatToggle = () => setShowChat((prev) => !prev);

  if (!gameState)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Waiting...
      </div>
    );

  const myTurn =
    gameState.currentPlayerId === playerId &&
    gameState.waitingForAction &&
    !gameState.winner &&
    currentPlayer &&
    !currentPlayer.isAllIn &&
    !currentPlayer.isSpectator;
  const toCall =
    myTurn && currentPlayer
      ? gameState.currentBet - (currentPlayer.currentBet || 0)
      : 0;
  const canReveal =
    !gameState.handInProgress &&
    gameState.winner &&
    currentPlayer &&
    !currentPlayer.folded &&
    !currentPlayer.revealed;

  const activePlayersList = gameState.players.filter((p) => !p.isSpectator);

  const contextValue = {
    gameState,
    playerId,
    isAdmin,
    currentPlayer,
    sendWs,
    cardBack,
    showHandInfo,
    activePlayersList,
    getTimerColor,
    turnRemainingSec,
    turnCurrentPlayerId,
    winnerEffect,
    speechBubbles,
    playerRefs,
    setAnimatingChips,
  };

  return (
    <GameContext.Provider value={contextValue}>
      <div
        className="fixed inset-0 overflow-hidden"
        style={{ background: 'var(--bg-gradient)' }}
      >
        <button
          onClick={handleChatToggle}
          className="fixed bottom-4 left-4 z-40 w-10 h-10 rounded-full bg-amber-700 hover:bg-amber-600 shadow-lg flex items-center justify-center text-white text-xl transition-all"
          title={showChat ? 'Close chat' : 'Open chat'}
          style={{ zIndex: 70 }}
        >
          💬
        </button>

        {!gameState.firstHandStarted &&
          !gameState.handInProgress &&
          currentPlayer &&
          !currentPlayer.isSpectator && (
            <div className="fixed bottom-4 right-4 z-50 backdrop-blur-md bg-black/60 rounded-2xl p-2 border border-amber-500/50 shadow-2xl">
              <button
                onClick={toggleReady}
                className={`px-6 py-3 rounded-xl font-extrabold text-sm transition-all ${
                  currentPlayer.ready
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {currentPlayer.ready ? '🔴 UNREADY' : '🟢 READY'}
              </button>
            </div>
          )}

        <div className="fixed top-2 right-2 z-40" style={{ zIndex: 70 }}>
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 shadow-lg flex items-center justify-center text-white text-xl transition-all"
              title="Settings"
            >
              ⚙️
            </button>
            <SettingsPanel
              showSettings={showSettings}
              setShowSettings={setShowSettings}
              theme={theme}
              themes={themes}
              onThemeChange={onThemeChange}
              themeExpanded={themeExpanded}
              setThemeExpanded={setThemeExpanded}
              cardBackExpanded={cardBackExpanded}
              setCardBackExpanded={setCardBackExpanded}
              cardBackOptions={cardBackOptions}
              cardBack={cardBack}
              handleCardBackChange={handleCardBackChange}
              seatViewFixed={seatViewFixed}
              toggleSeatView={toggleSeatView}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              showHandInfo={showHandInfo}
              onToggleBeginner={onToggleBeginner}
              isPaused={isPaused}
              togglePause={togglePause}
              isAdmin={isAdmin}
              setResetConfirm={setResetConfirm}
              requestHandHistory={requestHandHistory}
              onReturnToLobby={onReturnToLobby}
            />
          </div>
        </div>

        {resetConfirm && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn"
            onClick={() => setResetConfirm(false)}
          >
            <div
              className="bg-gray-800 p-6 rounded-xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-white mb-4">
                Reset all scores and chips? This cannot be undone.
              </p>
              <button
                onClick={resetLobby}
                className="bg-red-600 px-4 py-2 rounded mr-2"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="bg-gray-600 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showHistory && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setShowHistory(false)}
          >
            <div
              className="bg-gray-900/95 p-6 rounded-xl max-w-md w-full max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-amber-400 font-bold text-lg">
                  Hand History
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-white text-2xl"
                >
                  ×
                </button>
              </div>
              {handHistory.length === 0 ? (
                <p className="text-gray-400 text-sm">No hands played yet.</p>
              ) : (
                <ul className="text-sm text-gray-300 space-y-2">
                  {handHistory.map((entry, i) => (
                    <li key={i} className="border-b border-gray-700 pb-1">
                      {entry}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <Leaderboard
          players={gameState.players}
          currentRound={gameState.currentRound}
        />

        {showChat && (
          <div style={{ zIndex: 70 }}>
            <Chat
              messages={chatMessages}
              playerName={currentPlayer?.name || '?'}
              onSendMessage={handleSendChat}
            />
          </div>
        )}

        {isPaused && (
          <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center pointer-events-none">
            <div className="text-white text-4xl font-black drop-shadow-lg animate-pulse">
              ⏸️ GAME PAUSED
            </div>
          </div>
        )}

        {winningHandName && (
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className="winner-themed text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-wider whitespace-nowrap">
              {winningHandName}
            </div>
          </div>
        )}

        {systemMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-600 text-black font-bold px-6 py-2 rounded-full shadow-lg animate-bounce">
            {systemMessage}
          </div>
        )}

        {sideBetWin && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-purple-800 text-white font-bold px-6 py-2 rounded-full shadow-lg animate-pulse">
            🎉 {sideBetWin.bettorName} won {sideBetWin.total} chips from side
            bet on {sideBetWin.targetName}! 🎉
          </div>
        )}

        {achievementToast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-400 to-amber-600 text-black font-bold px-6 py-3 rounded-full shadow-2xl animate-fadeInSlideDown flex items-center gap-2">
            <span className="text-2xl">🎖️</span>
            <div>
              <div className="text-sm">{achievementToast.player}</div>
              <div className="text-xs">
                {achievementToast.name}: {achievementToast.desc}
              </div>
            </div>
          </div>
        )}

        {currentPlayer &&
          currentPlayer.folded &&
          !gameState.winner &&
          !currentPlayer.isSpectator && (
            <BettingPanel
              ws={ws}
              playerId={playerId}
              players={gameState.players}
              currentRound={gameState.currentRound}
              chipAmount={currentPlayer.chips}
            />
          )}

        {currentPlayer && currentPlayer.isSpectator && !gameState.winner && (
          <div className="fixed bottom-4 right-4 z-30 bg-black/70 backdrop-blur-md rounded-xl p-4 border border-amber-700/50 text-white text-center">
            <div className="text-amber-400 font-bold mb-2">
              👁️ Spectator Mode
            </div>
            <button
              onClick={sitIn}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold text-sm"
            >
              Sit In ({formatChips(gameState.startingChips || 1000)})
            </button>
            <div className="text-xs text-gray-400 mt-2">
              Wait for current hand to end
            </div>
          </div>
        )}

        <Table
          tableContainerRef={tableContainerRef}
          tableRef={tableRef}
          gameState={gameState}
          newCardIndices={newCardIndices}
          prevCommunityLengthRef={{
            current: newCardIndices.length
              ? gameState.communityCards.length - newCardIndices.length
              : 0,
          }}
        />

        {activePlayersList.map((p, idx) => (
          <PlayerSeat
            key={p.id}
            p={p}
            idx={idx}
            pos={playerPositions[p.id]}
          />
        ))}

        {animatingChips.map((chip) => (
          <AnimatedChip
            key={chip.id}
            value={chip.value}
            fromPosition={chip.fromPos}
            toPosition={chip.toPosition}
            onComplete={() => removeChipAnimation(chip.id)}
          />
        ))}

        {(myTurn || canReveal) && (
          <ActionButtons
            onFold={() => handleAction('fold')}
            onCheck={() => handleAction('check')}
            onCall={() => handleAction('call')}
            onRaise={(amt) => handleAction('raise', amt)}
            onAllIn={() => handleAction('allin')}
            toCall={toCall}
            minRaise={20}
            playerChips={currentPlayer?.chips || 0}
            currentPot={gameState.totalPot}
            myTurn={myTurn && !isPaused}
            canReveal={canReveal}
            onReveal={handleRevealCards}
          />
        )}
      </div>
    </GameContext.Provider>
  );
}