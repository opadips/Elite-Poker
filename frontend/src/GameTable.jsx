// frontend/src/GameTable.jsx
import React, { useEffect, useState, useRef } from 'react';
import ActionButtons from './components/ActionButtons.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import AnimatedChip from './components/AnimatedChip.jsx';
import PlayerSeat from './components/PlayerSeat.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import Table from './components/Table.jsx';
import GameOverlays from './components/GameOverlays.jsx';
import GameContext from './context/GameContext';
import { usePlayerPositions } from './hooks/usePlayerPositions';
import { useGameActions } from './hooks/useGameActions';
import { useGameStateSync } from './hooks/useGameStateSync';
import { useTimerSync } from './hooks/useTimerSync';
import { useChatSync } from './hooks/useChatSync';
import { useHandHistorySync } from './hooks/useHandHistorySync';
import {
  MIN_RAISE,
  TIMER_COLOR_BREAKPOINTS,
  WINNER_CHIP_ANIMATION_COUNT,
  WINNER_CHIP_ANIMATION_INTERVAL,
} from './constants.js';
import './styles/animations.css';

const cardBackOptions = [
  { id: 'default', name: 'Classic', icon: '🃏' },
  { id: 'galaxy', name: 'Galaxy', icon: '🌌' },
  { id: 'gold', name: 'Royal Gold', icon: '👑' },
  { id: 'matrix', name: 'Matrix', icon: '💚' },
  { id: 'ocean', name: 'Ocean', icon: '🌊' },
  { id: 'ruby', name: 'Ruby', icon: '💎' },
];

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
  const [animatingChips, setAnimatingChips] = useState([]);

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
    newCardIndices,
    isPaused,
  } = useGameStateSync(ws, soundEnabledRef);

  const { turnRemainingSec, turnCurrentPlayerId } = useTimerSync(ws, soundEnabledRef);

  const {
    chatMessages,
    showChat,
    setShowChat,
    speechBubbles,
    systemMessage,
    achievementToast,
    sideBetWin,
  } = useChatSync(ws, gameState);

  const { handHistory } = useHandHistorySync(ws);

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
      const toPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const fromPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      for (let i = 0; i < WINNER_CHIP_ANIMATION_COUNT; i++) {
        setTimeout(() => {
          setAnimatingChips((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              value: Math.floor(gameState.totalPot / WINNER_CHIP_ANIMATION_COUNT),
              fromPos,
              toPosition: toPos,
            },
          ]);
        }, i * WINNER_CHIP_ANIMATION_INTERVAL);
      }
    }
  }, [winnerEffect, gameState]);

  const getTimerColor = (sec) => {
    if (sec > TIMER_COLOR_BREAKPOINTS.BLUE) return '#3b82f6';
    if (sec > TIMER_COLOR_BREAKPOINTS.GREEN) return '#22c55e';
    if (sec > TIMER_COLOR_BREAKPOINTS.YELLOW) return '#eab308';
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

        <Leaderboard
          players={gameState.players}
          currentRound={gameState.currentRound}
        />

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
            minRaise={MIN_RAISE}
            playerChips={currentPlayer?.chips || 0}
            currentPot={gameState.totalPot}
            myTurn={myTurn && !isPaused}
            canReveal={canReveal}
            onReveal={handleRevealCards}
          />
        )}

        <GameOverlays
          gameState={gameState}
          currentPlayer={currentPlayer}
          isPaused={isPaused}
          winningHandName={winningHandName}
          systemMessage={systemMessage}
          sideBetWin={sideBetWin}
          achievementToast={achievementToast}
          showChat={showChat}
          chatMessages={chatMessages}
          handleSendChat={handleSendChat}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          handHistory={handHistory}
          resetConfirm={resetConfirm}
          setResetConfirm={setResetConfirm}
          resetLobby={resetLobby}
          ws={ws}
          playerId={playerId}
          sitIn={sitIn}
        />
      </div>
    </GameContext.Provider>
  );
}