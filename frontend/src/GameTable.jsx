import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import ActionButtons from './components/ActionButtons.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import AnimatedChip from './components/AnimatedChip.jsx';
import PlayerSeat from './components/PlayerSeat.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import Table from './components/Table.jsx';
import GameOverlays from './components/GameOverlays.jsx';
import ChipStack from './components/ChipStack.jsx';
import GameContext from './context/GameContext';
import { usePlayerPositions } from './hooks/usePlayerPositions';
import { useGameActions } from './hooks/useGameActions';
import { useGameStateSync } from './hooks/useGameStateSync';
import { useTimerSync } from './hooks/useTimerSync';
import { useChatSync } from './hooks/useChatSync';
import { useHandHistorySync } from './hooks/useHandHistorySync';
import { chipLandSound } from './hooks/useSound';
import {
  MIN_RAISE,
  TIMER_COLOR_BREAKPOINTS,
  WINNER_CHIP_ANIMATION_COUNT,
  WINNER_CHIP_ANIMATION_INTERVAL,
  MAX_FLYING_CHIPS,
  WIN_CHIP_DURATION,
} from './constants.js';
import './styles/animations.css';

function ChatBubbleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const cardBackOptions = [
  { id: 'classic', name: 'Amber' },
  { id: 'royal', name: 'Royal' },
  { id: 'emerald', name: 'Emerald' },
  { id: 'sapphire', name: 'Sapphire' },
  { id: 'onyx', name: 'Onyx' },
  { id: 'pearl', name: 'Pearl' },
];

const themes = [
  { id: 'classic', name: 'Classic', color: 'bg-emerald-800' },
  { id: 'crimson', name: 'Royal Crimson', color: 'bg-red-950' },
  { id: 'emerald', name: 'Emerald Luxe', color: 'bg-green-950' },
  { id: 'sapphire', name: 'Sapphire Noir', color: 'bg-blue-950' },
  { id: 'neonjungle', name: 'Neon Jungle', color: 'bg-green-950' },
  { id: 'void', name: 'Void Pulse', color: 'bg-indigo-950' },
];

const ACTION_ANIMATION_WINDOW_MS = 5000;
const WINNER_ANIMATION_WINDOW_MS = 500;

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
    () => localStorage.getItem('pokerCardBack') || 'classic'
  );
  const [seatViewFixed, setSeatViewFixed] = useState(
    () => localStorage.getItem('seatViewFixed') !== 'false'
  );
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [cardBackExpanded, setCardBackExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [animatingChips, setAnimatingChips] = useState([]);
  const [performanceMode, setPerformanceMode] = useState(
    () => localStorage.getItem('performanceMode') === 'true'
  );

  const tableContainerRef = useRef(null);
  const playerRefs = useRef({});
  const soundEnabledRef = useRef(true);
  const prevActionsRef = useRef({});
  const runningCountRef = useRef(0);
  const queueRef = useRef([]);
  const pendingActionsRef = useRef([]);
  const maxFlyingChipsRef = useRef(MAX_FLYING_CHIPS);
  const winnerChipCountRef = useRef(WINNER_CHIP_ANIMATION_COUNT);
  const performanceModeRef = useRef(performanceMode);
  const winLandCountRef = useRef(0);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    performanceModeRef.current = performanceMode;
    maxFlyingChipsRef.current = performanceMode ? 2 : MAX_FLYING_CHIPS;
    winnerChipCountRef.current = performanceMode ? 3 : WINNER_CHIP_ANIMATION_COUNT;
    localStorage.setItem('performanceMode', performanceMode);
  }, [performanceMode]);

  const {
    gameState,
    winnerEffect,
    winningHandName,
    newCardIndices,
    isPaused,
  } = useGameStateSync(ws, soundEnabledRef);

  const { turnRemainingSec, turnCurrentPlayerId } = useTimerSync(ws, soundEnabledRef, gameState);

  const {
    chatMessages,
    showChat,
    setShowChat,
    openChatTemporarily,
    speechBubbles,
    systemMessage,
    achievementToast,
    sideBetWin,
  } = useChatSync(ws, gameState);

  const { handHistory } = useHandHistorySync(ws);

  const { playerPositions, tableRef, setContainerRef, orderedPlayerIds } = usePlayerPositions(
    gameState,
    playerId,
    seatViewFixed
  );

  const sendWs = useCallback((msg) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, [ws]);

  const playLandSound = useCallback(() => {
    if (soundEnabledRef.current) {
      chipLandSound();
    }
  }, []);

  const processQueue = useCallback(() => {
    if (runningCountRef.current >= maxFlyingChipsRef.current) return;
    if (queueRef.current.length === 0) return;

    const item = queueRef.current.shift();
    runningCountRef.current++;

    const newChip = {
      id: Date.now() + Math.random(),
      value: item.value,
      from: item.from,
      to: item.to,
      duration: item.duration || 800,
      type: item.type || 'bet',
    };

    setAnimatingChips((prev) => [...prev, newChip]);
  }, []);

  const enqueueAnimation = useCallback((item) => {
    if (!item.from || !item.to) return;
    if (typeof item.from.x !== 'number' || typeof item.from.y !== 'number') return;
    if (typeof item.to.x !== 'number' || typeof item.to.y !== 'number') return;
    if (performanceModeRef.current) {
      playLandSound();
      return;
    }
    queueRef.current.push(item);
    processQueue();
  }, [processQueue, playLandSound]);

  const removeChipAnimation = useCallback((id) => {
    setAnimatingChips((prev) => prev.filter((c) => c.id !== id));
    runningCountRef.current = Math.max(0, runningCountRef.current - 1);
    setTimeout(() => processQueue(), 50);
  }, [processQueue]);

  const toScreenCoords = useCallback((relativeX, relativeY) => {
    if (!tableContainerRef.current) {
      return { x: relativeX, y: relativeY };
    }
    const rect = tableContainerRef.current.getBoundingClientRect();
    return {
      x: rect.left + relativeX,
      y: rect.top + relativeY,
    };
  }, []);

  const getPotScreenPos = useCallback(() => {
    if (!tableContainerRef.current) {
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    const rect = tableContainerRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  const activePlayersList = gameState
    ? gameState.players.filter((p) => !p.isSpectator)
    : [];

  const blindIds = useMemo(() => {
    if (!gameState || !orderedPlayerIds || orderedPlayerIds.length < 2) return { sbId: null, bbId: null };
    const active = orderedPlayerIds.filter(id => activePlayersList.some(p => p.id === id));
    if (active.length < 2) return { sbId: null, bbId: null };
    const dealerIdx = active.indexOf(gameState.dealerIndex);
    const startIdx = dealerIdx >= 0 ? dealerIdx : active.length - 1;
    const sbIdx = (startIdx + 1) % active.length;
    const bbIdx = (startIdx + 2) % active.length;
    return {
      sbId: active[sbIdx] || null,
      bbId: active[bbIdx] || null,
    };
  }, [gameState, orderedPlayerIds, activePlayersList]);

  const chipStacks = useMemo(() => {
    if (!playerPositions || !orderedPlayerIds || !gameState) return [];
    return orderedPlayerIds.map((id, idx) => {
      const p = activePlayersList.find(ap => ap.id === id);
      if (!p) return null;
      const pos = playerPositions[id];
      if (!pos) return null;
      const total = orderedPlayerIds.length;
      const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
      const distRadius = 165;
      const offsetX = Math.cos(angle) * distRadius;
      const offsetY = Math.sin(angle) * distRadius;
      return {
        id,
        chips: p.chips,
        currentBet: p.folded ? 0 : (p.currentBet || 0),
        x: pos.x + offsetX,
        y: pos.y + offsetY,
      };
    }).filter(Boolean);
  }, [playerPositions, orderedPlayerIds, gameState, activePlayersList]);

  const chipStackPositionsMap = useMemo(() => {
    const map = {};
    chipStacks.forEach(cs => {
      map[cs.id] = { x: cs.x, y: cs.y };
    });
    return map;
  }, [chipStacks]);

  const getChipStackScreenPos = useCallback((pid) => {
    const relPos = chipStackPositionsMap[pid];
    if (!relPos) {
      const seatPos = playerPositions?.[pid];
      if (seatPos) return toScreenCoords(seatPos.x, seatPos.y);
      return getPotScreenPos();
    }
    return toScreenCoords(relPos.x, relPos.y);
  }, [chipStackPositionsMap, playerPositions, toScreenCoords, getPotScreenPos]);

  const flushPendingActions = useCallback(() => {
    if (pendingActionsRef.current.length === 0) return;
    const now = Date.now();
    const actions = pendingActionsRef.current.filter(item => {
      return !item.timestamp || (now - item.timestamp) < ACTION_ANIMATION_WINDOW_MS;
    });
    pendingActionsRef.current = [];
    actions.forEach(item => {
      enqueueAnimation(item);
    });
  }, [enqueueAnimation]);

  useEffect(() => {
    if (!gameState || !gameState.players) return;

    requestAnimationFrame(() => {
      const hasChipStackPositions = Object.keys(chipStackPositionsMap).length > 0;
      const now = Date.now();

      gameState.players.forEach((p) => {
        const prevAction = prevActionsRef.current[p.id];
        const newAction = p.lastAction;
        if (
          newAction &&
          newAction.type &&
          (!prevAction ||
            prevAction.type !== newAction.type ||
            prevAction.amount !== newAction.amount)
        ) {
          if (
            (newAction.type === 'call' ||
              newAction.type === 'raise' ||
              newAction.type === 'allin') &&
            newAction.amount > 0
          ) {
            const actionAge = newAction.timestamp ? now - newAction.timestamp : 0;
            if (actionAge > ACTION_ANIMATION_WINDOW_MS) {
              prevActionsRef.current[p.id] = newAction;
              return;
            }

            const fromPos = getChipStackScreenPos(p.id);
            const toPos = getPotScreenPos();
            const animItem = {
              value: newAction.amount,
              from: fromPos,
              to: toPos,
              type: newAction.type,
              timestamp: newAction.timestamp,
            };

            if (hasChipStackPositions) {
              enqueueAnimation(animItem);
            } else {
              pendingActionsRef.current.push(animItem);
            }
          }
        }
        prevActionsRef.current[p.id] = newAction;
      });
    });
  }, [gameState, getChipStackScreenPos, getPotScreenPos, enqueueAnimation, chipStackPositionsMap]);

  useEffect(() => {
    if (Object.keys(chipStackPositionsMap).length > 0) {
      requestAnimationFrame(() => {
        flushPendingActions();
      });
    }
  }, [chipStackPositionsMap, flushPendingActions]);

  useEffect(() => {
    requestAnimationFrame(() => {
      flushPendingActions();
    });
  }, [gameState, flushPendingActions]);

  useEffect(() => {
    const winnerIdsList = winnerEffect?.winnerIds;
    if (winnerIdsList && winnerIdsList.length > 0 && gameState?.winner?.timestamp) {
      const winnerAge = Date.now() - gameState.winner.timestamp;
      if (winnerAge > WINNER_ANIMATION_WINDOW_MS) return;

      queueRef.current = [];
      runningCountRef.current = 0;
      winLandCountRef.current = 0;

      const count = performanceModeRef.current ? 2 : winnerChipCountRef.current;
      setTimeout(() => {
        const fromPos = getPotScreenPos();
        winnerIdsList.forEach((winnerId) => {
          const winnerStackPos = getChipStackScreenPos(winnerId);
          for (let i = 0; i < count; i++) {
            setTimeout(() => {
              enqueueAnimation({
                value: Math.floor(gameState.totalPot / (count * winnerIdsList.length || 1)),
                from: { ...fromPos },
                to: { ...winnerStackPos },
                type: 'win',
                duration: WIN_CHIP_DURATION,
              });
            }, i * WINNER_CHIP_ANIMATION_INTERVAL);
          }
        });
      }, 150);
    }
  }, [winnerEffect, gameState, getPotScreenPos, getChipStackScreenPos, enqueueAnimation]);

  useEffect(() => {
    if (gameState && gameState.winner) {
      const timeout = setTimeout(() => {
        setAnimatingChips([]);
        runningCountRef.current = 0;
        queueRef.current = [];
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [gameState?.winner]);

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

  const handleSendChat = (data) => {
    if (data.type === 'private') {
      sendWs({ type: 'privateMessage', targetName: data.targetName, message: data.message });
    } else {
      sendWs({ type: 'chat', message: data.message });
    }
  };

  const toggleSeatView = () =>
    setSeatViewFixed((prev) => {
      const next = !prev;
      localStorage.setItem('seatViewFixed', next);
      return next;
    });

  const handleChatToggle = () => setShowChat((prev) => !prev);

  const currentPlayer = gameState?.players?.find((p) => p.id === playerId);

  const {
    handleAction,
    handleRevealCards,
    toggleReady,
    sitIn,
    resetLobby,
    togglePause,
    requestHandHistory,
  } = useGameActions(
    ws,
    isPaused,
    soundEnabled,
    setShowSettings,
    setResetConfirm,
    gameState,
    playerId,
    currentPlayer,
    sendWs,
    enqueueAnimation,
    getChipStackScreenPos,
    getPotScreenPos,
    setShowHistory
  );

  const contextValue = useMemo(() => ({
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
    winnerIds: winnerEffect?.winnerIds || [],
    speechBubbles,
    playerRefs,
    setAnimatingChips,
    enqueueAnimation,
    getChipStackScreenPos,
    getPotScreenPos,
    sbId: blindIds.sbId,
    bbId: blindIds.bbId,
  }), [
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
    enqueueAnimation,
    getChipStackScreenPos,
    getPotScreenPos,
    blindIds,
  ]);

  if (!gameState)
    return (
      <GameContext.Provider value={contextValue}>
        <div className="min-h-screen flex items-center justify-center text-white">
          Waiting...
        </div>
      </GameContext.Provider>
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
    currentPlayer.folded;

  return (
    <GameContext.Provider value={contextValue}>
      <div
        ref={(el) => {
          tableContainerRef.current = el;
          setContainerRef(el);
        }}
        className="fixed inset-0 overflow-hidden"
        style={{ background: 'var(--bg-gradient)' }}
      >
        <button
          onClick={handleChatToggle}
          className="fixed bottom-4 left-4 z-40 w-10 h-10 rounded-full bg-amber-700 hover:bg-amber-600 shadow-lg flex items-center justify-center text-white transition-all"
          title={showChat ? 'Close chat' : 'Open chat'}
          style={{ zIndex: 70 }}
        >
          <ChatBubbleIcon />
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
                {currentPlayer.ready ? 'UNREADY' : 'READY'}
              </button>
            </div>
          )}

        <div className="fixed top-2 right-2 z-40" style={{ zIndex: 70 }}>
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 shadow-lg flex items-center justify-center text-white transition-all"
              title="Settings"
            >
              <GearIcon />
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
              performanceMode={performanceMode}
              setPerformanceMode={setPerformanceMode}
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

        {chipStacks.map((stack) => (
          <div
            key={stack.id}
            style={{
              position: 'absolute',
              left: stack.x,
              top: stack.y,
              marginLeft: -20,
              marginTop: -20,
              pointerEvents: 'none',
            }}
          >
            <ChipStack amount={stack.chips} currentBet={stack.currentBet} />
          </div>
        ))}

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
            from={chip.from}
            to={chip.to}
            duration={chip.duration}
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
          dealerMessage={gameState?.dealerMessage}
        />
      </div>
    </GameContext.Provider>
  );
}