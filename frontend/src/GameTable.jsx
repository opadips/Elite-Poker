import React, { useEffect, useState, useRef, useCallback } from 'react';
import Card from './components/Card.jsx';
import ActionButtons from './components/ActionButtons.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import HandInfo from './components/HandInfo.jsx';
import AnimatedChip from './components/AnimatedChip.jsx';
import Chat from './components/Chat.jsx';
import BettingPanel from './components/BettingPanel.jsx';
import { cardDeal, chipClick, winnerFanfare, timerBeep, allInSound } from './hooks/useSound';
import './styles/animations.css';

const cardBackOptions = [
  { id: 'default', name: 'Classic', icon: '🃏' },
  { id: 'galaxy', name: 'Galaxy', icon: '🌌' },
  { id: 'gold', name: 'Royal Gold', icon: '👑' },
  { id: 'matrix', name: 'Matrix', icon: '💚' },
  { id: 'ocean', name: 'Ocean', icon: '🌊' },
  { id: 'ruby', name: 'Ruby', icon: '💎' },
];

export default function GameTable({ ws, playerId, theme, onThemeChange }) {
  const [gameState, setGameState] = useState(null);
  const [winnerEffect, setWinnerEffect] = useState(null);
  const [winningHandName, setWinningHandName] = useState(null);
  const [playerPositions, setPlayerPositions] = useState({});
  const [showHandInfo, setShowHandInfo] = useState(false);
  const [animatingChips, setAnimatingChips] = useState([]);
  const [systemMessage, setSystemMessage] = useState(null);
  const [sideBetWin, setSideBetWin] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [newCardIndices, setNewCardIndices] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cardBack, setCardBack] = useState(() => localStorage.getItem('pokerCardBack') || 'default');
  const [chatMessages, setChatMessages] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [achievementToast, setAchievementToast] = useState(null);
  const [showAllCards, setShowAllCards] = useState(false);
  const [seatViewFixed, setSeatViewFixed] = useState(() => localStorage.getItem('seatViewFixed') !== 'false');
  const [speechBubbles, setSpeechBubbles] = useState([]);
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [cardBackExpanded, setCardBackExpanded] = useState(false);
  const [turnRemainingSec, setTurnRemainingSec] = useState(0);
  const [turnCurrentPlayerId, setTurnCurrentPlayerId] = useState(null);

  const tableContainerRef = useRef(null);
  const tableRef = useRef(null);
  const playerRefs = useRef({});
  const lastWinnerRef = useRef(null);
  const prevCommunityLengthRef = useRef(0);
  const bubbleTimersRef = useRef({});
  const chatAutoCloseRef = useRef(null);
  const lastBeepSecond = useRef(0);

  const themes = [
    { id: 'classic', name: 'Classic', icon: '🃏', color: 'bg-emerald-800' },
    { id: 'cyberpunk', name: 'Cyberpunk', icon: '💠', color: 'bg-purple-800' },
    { id: 'fantasy', name: 'Fantasy', icon: '✨', color: 'bg-amber-700' },
    { id: 'midnight', name: 'Midnight', icon: '🌙', color: 'bg-blue-900' },
    { id: 'neonjungle', name: 'Neon Jungle', icon: '🌿', color: 'bg-green-950' },
    { id: 'void', name: 'Void Pulse', icon: '🌀', color: 'bg-indigo-950' },
  ];

  const addChipAnimation = (fromPlayerId, value, toPot = true) => {
    const playerEl = playerRefs.current[fromPlayerId];
    if (playerEl) {
      const rect = playerEl.getBoundingClientRect();
      const fromPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      setAnimatingChips(prev => [...prev, { id: Date.now() + Math.random(), value, fromPos, toPosition: toPot ? null : undefined }]);
    }
  };

  const removeChipAnimation = (id) => {
    setAnimatingChips(prev => prev.filter(c => c.id !== id));
  };

  useEffect(() => {
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat') {
        setChatMessages(prev => [...prev, { sender: data.sender, text: data.message, isSystem: false }]);
        const players = gameState?.players;
        const senderPlayer = players?.find(p => p.name === data.sender);
        if (senderPlayer) {
          const newBubble = {
            id: Date.now() + Math.random(),
            playerId: senderPlayer.id,
            text: data.message
          };
          setSpeechBubbles(prev => [...prev.filter(b => b.playerId !== senderPlayer.id), newBubble]);
          clearTimeout(bubbleTimersRef.current[senderPlayer.id]);
          bubbleTimersRef.current[senderPlayer.id] = setTimeout(() => {
            setSpeechBubbles(prev => prev.filter(b => b.id !== newBubble.id));
          }, 5000);
        }
      } else if (data.type === 'system') {
        setChatMessages(prev => [...prev, { sender: 'SYSTEM', text: data.text, isSystem: true }]);
        setSystemMessage(data.text);
        setTimeout(() => setSystemMessage(null), 3000);
        if (!showChat) {
          setShowChat(true);
          if (chatAutoCloseRef.current) clearTimeout(chatAutoCloseRef.current);
          chatAutoCloseRef.current = setTimeout(() => {
            setShowChat(false);
            chatAutoCloseRef.current = null;
          }, 5000);
        }
      } else if (data.type === 'achievement') {
        setAchievementToast({ player: data.playerName, name: data.name, desc: data.desc });
        setTimeout(() => setAchievementToast(null), 4000);
      } else if (data.type === 'allInSound') {
        if (soundEnabled) allInSound();
      } else if (data.type === 'turnTimer') {
        setTurnRemainingSec(data.remaining);
        setTurnCurrentPlayerId(data.currentPlayerId);
      }

      if (data.type === 'gameState') {
        const newCommLength = data.state.communityCards?.length || 0;
        const oldLength = prevCommunityLengthRef.current;
        if (newCommLength > oldLength) {
          const newIndices = [];
          for (let i = oldLength; i < newCommLength; i++) {
            newIndices.push(i);
          }
          setNewCardIndices(newIndices);
          if (soundEnabled) cardDeal();
          setTimeout(() => setNewCardIndices([]), 600);
        }
        prevCommunityLengthRef.current = newCommLength;

        if (data.state.handInProgress) {
          lastWinnerRef.current = null;
        }

        setGameState(data.state);
        setIsPaused(data.state.paused || false);

        if (data.state.winner && data.state.winner.names !== lastWinnerRef.current) {
          lastWinnerRef.current = data.state.winner.names;
          const winnerPlayer = data.state.players?.find(p => p.name === data.state.winner.names);
          if (winnerPlayer) {
            setWinnerEffect({
              winnerId: winnerPlayer.id,
              winnerCards: winnerPlayer.holeCards,
              winnerName: winnerPlayer.name
            });
            setWinningHandName(data.state.winner.handName);
            if (soundEnabled) winnerFanfare();
            setTimeout(() => {
              setWinnerEffect(null);
              setWinningHandName(null);
            }, 3000);
          }
        }
      } else if (data.type === 'sideBetWin') {
        setSideBetWin({
          bettorName: data.bettorName,
          targetName: data.targetName,
          amount: data.amount,
          profit: data.profit,
          total: data.amount + data.profit
        });
        setTimeout(() => setSideBetWin(null), 4000);
      } else if (data.type === 'sitInSuccess') {
        setSystemMessage('You are now in the game!');
        setTimeout(() => setSystemMessage(null), 2000);
      }
    };
  }, [ws, soundEnabled, gameState, showChat]);

  useEffect(() => {
    if (turnRemainingSec > 0 && soundEnabled) {
      const currentSec = Math.ceil(turnRemainingSec);
      if (currentSec <= 5 && currentSec !== lastBeepSecond.current) {
        timerBeep();
        lastBeepSecond.current = currentSec;
      }
    } else {
      lastBeepSecond.current = 0;
    }
  }, [turnRemainingSec, soundEnabled]);

  const updatePositions = useCallback(() => {
    if (!gameState || !tableRef.current) return;
    const tableRect = tableRef.current.getBoundingClientRect();
    const tableWidth = tableRect.width;
    const tableHeight = tableRect.height;
    const a = tableWidth / 2;
    const b = tableHeight / 2;
    const centerX = tableRect.left + a;
    const centerY = tableRect.top + b;

    const activePlayers = gameState.players.filter(p => !p.isSpectator);
    let orderedPlayers = activePlayers;

    if (seatViewFixed) {
      const selfIndex = orderedPlayers.findIndex(p => p.id === playerId);
      if (selfIndex >= 0) {
        orderedPlayers = [...orderedPlayers.slice(selfIndex), ...orderedPlayers.slice(0, selfIndex)];
      }
    }

    const total = orderedPlayers.length;
    const newPositions = {};
    orderedPlayers.forEach((p, idx) => {
      const angle = (idx / total) * 2 * Math.PI + Math.PI / 2;
      const x = centerX + a * Math.cos(angle);
      const y = centerY + b * Math.sin(angle);
      newPositions[p.id] = { x, y };
    });
    setPlayerPositions(newPositions);
  }, [gameState, playerId, seatViewFixed]);

  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [updatePositions]);

  useEffect(() => {
    if (winnerEffect?.winnerId && gameState) {
      const winnerEl = playerRefs.current[winnerEffect.winnerId];
      if (winnerEl) {
        const rect = winnerEl.getBoundingClientRect();
        const toPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const fromPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        for (let i = 0; i < 6; i++) {
          setTimeout(() => {
            setAnimatingChips(prev => [...prev, {
              id: Date.now() + Math.random(),
              value: Math.floor(gameState.totalPot / 6),
              fromPos,
              toPosition: toPos
            }]);
          }, i * 200);
        }
      }
    }
  }, [winnerEffect, gameState]);

  const getTimerColor = (sec) => {
    if (sec > 15) return '#3b82f6';
    if (sec > 10) return '#22c55e';
    if (sec > 5) return '#eab308';
    return '#ef4444';
  };

  if (!gameState) return <div className="min-h-screen flex items-center justify-center text-white">Waiting...</div>;

  const currentPlayer = gameState.players?.find(p => p.id === playerId);
  const myTurn = gameState.currentPlayerId === playerId && gameState.waitingForAction && !gameState.winner && currentPlayer && !currentPlayer.isAllIn && !currentPlayer.isSpectator;
  const toCall = myTurn && currentPlayer ? (gameState.currentBet - (currentPlayer.currentBet || 0)) : 0;

  const handleAction = (type, amount = 0) => {
    if (isPaused) return;
    if (type === 'fold') ws.send(JSON.stringify({ type: 'action', action: 'fold' }));
    else if (type === 'check') ws.send(JSON.stringify({ type: 'action', action: 'check' }));
    else if (type === 'call') {
      addChipAnimation(playerId, toCall);
      if (soundEnabled) chipClick();
      ws.send(JSON.stringify({ type: 'action', action: 'call' }));
    }
    else if (type === 'raise') {
      addChipAnimation(playerId, amount);
      if (soundEnabled) chipClick();
      ws.send(JSON.stringify({ type: 'action', action: 'raise', amount }));
    }
    else if (type === 'allin') {
      addChipAnimation(playerId, currentPlayer?.chips);
      if (soundEnabled) {
        chipClick();
        allInSound();
      }
      ws.send(JSON.stringify({ type: 'action', action: 'allin' }));
    }
  };

  const handleRevealCards = () => {
    ws.send(JSON.stringify({ type: 'reveal' }));
  };

  const onToggleBeginner = (checked) => {
    setShowHandInfo(checked);
    if (checked) ws.send(JSON.stringify({ type: 'toggleBeginner' }));
  };

  const toggleReady = () => {
    ws.send(JSON.stringify({ type: 'ready' }));
  };

  const sitIn = () => {
    ws.send(JSON.stringify({ type: 'sitIn' }));
  };

  const resetLobby = () => {
    ws.send(JSON.stringify({ type: 'resetLobby' }));
    setResetConfirm(false);
    setShowSettings(false);
  };

  const handleCardBackChange = (backId) => {
    setCardBack(backId);
    localStorage.setItem('pokerCardBack', backId);
  };

  const handleSendChat = (text) => {
    ws.send(JSON.stringify({ type: 'chat', message: text }));
  };

  const togglePause = () => {
    if (isPaused) {
      ws.send(JSON.stringify({ type: 'resume' }));
    } else {
      ws.send(JSON.stringify({ type: 'pause' }));
    }
  };

  const toggleSeatView = () => {
    setSeatViewFixed(prev => {
      const next = !prev;
      localStorage.setItem('seatViewFixed', next);
      return next;
    });
  };

  const handleChatToggle = () => {
    if (showChat) {
      if (chatAutoCloseRef.current) {
        clearTimeout(chatAutoCloseRef.current);
        chatAutoCloseRef.current = null;
      }
      setShowChat(false);
    } else {
      if (chatAutoCloseRef.current) clearTimeout(chatAutoCloseRef.current);
      setShowChat(true);
    }
  };

  const activePlayersList = gameState.players.filter(p => !p.isSpectator);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: 'var(--bg-gradient)' }}>
      <button
        onClick={handleChatToggle}
        className="fixed bottom-4 left-4 z-40 w-10 h-10 rounded-full bg-amber-700 hover:bg-amber-600 shadow-lg flex items-center justify-center text-white text-xl transition-all"
        title={showChat ? "Close chat" : "Open chat"}
        style={{ zIndex: 70 }}
      >
        💬
      </button>

      {gameState && !gameState.firstHandStarted && !gameState.handInProgress && currentPlayer && !currentPlayer.isSpectator && (
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
          {showSettings && (
            <div className="absolute top-full right-0 mt-1 w-80 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden transition-all duration-200 origin-top-right scale-100 opacity-100"
                 style={{ transformOrigin: 'top right' }}
            >
              <div className="max-h-[80vh] overflow-y-auto settings-scroll">
                <div className="px-5 py-3 bg-gray-800/50 border-b border-gray-700 flex items-center gap-2">
                  <span className="text-xl">⚙️</span>
                  <span className="text-white font-bold text-sm">Settings</span>
                </div>

                <div className="border-b border-gray-700/50">
                  <div
                    className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-800/50"
                    onClick={() => setThemeExpanded(!themeExpanded)}
                  >
                    <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                      <span>🎨</span> Theme
                    </div>
                    <span className="text-gray-400 text-sm">{themeExpanded ? '▲' : '▼'}</span>
                  </div>
                  {themeExpanded && (
                    <div className="px-4 py-3 grid grid-cols-2 gap-2">
                      {themes.map(t => (
                        <button
                          key={t.id}
                          onClick={() => { onThemeChange(t.id); setShowSettings(false); }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            theme === t.id
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-sm'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-transparent'
                          }`}
                        >
                          <span className="text-lg">{t.icon}</span>
                          {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-700/50">
                  <div
                    className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-800/50"
                    onClick={() => setCardBackExpanded(!cardBackExpanded)}
                  >
                    <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                      <span>🃏</span> Card Back
                    </div>
                    <span className="text-gray-400 text-sm">{cardBackExpanded ? '▲' : '▼'}</span>
                  </div>
                  {cardBackExpanded && (
                    <div className="px-4 py-3 grid grid-cols-3 gap-2">
                      {cardBackOptions.map(back => (
                        <button
                          key={back.id}
                          onClick={() => handleCardBackChange(back.id)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                            cardBack === back.id
                              ? 'bg-amber-500/20 border border-amber-500/50'
                              : 'bg-gray-800 border border-transparent hover:bg-gray-700'
                          }`}
                        >
                          <span className="text-xl">{back.icon}</span>
                          <span className="text-xs text-gray-300">{back.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 border-b border-gray-700/50">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>🎥</span> Seat View
                  </div>
                  <button
                    onClick={toggleSeatView}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all ${
                      seatViewFixed ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-gray-800 text-gray-400 border border-transparent'
                    }`}
                  >
                    <span className="text-sm font-medium">{seatViewFixed ? 'Fixed (My Seat Bottom)' : 'Dynamic (Rotating)'}</span>
                    <span className="text-lg">{seatViewFixed ? '📍' : '🔄'}</span>
                  </button>
                </div>

                <div className="px-4 py-3 border-b border-gray-700/50">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>🔊</span> Sound
                  </div>
                  <button
                    onClick={() => setSoundEnabled(prev => !prev)}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all ${
                      soundEnabled ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-gray-800 text-gray-400 border border-transparent'
                    }`}
                  >
                    <span className="text-sm font-medium">{soundEnabled ? 'ON' : 'OFF'}</span>
                    <span className="text-lg">{soundEnabled ? '🔊' : '🔇'}</span>
                  </button>
                </div>

                <div className="px-4 py-3 border-b border-gray-700/50">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>🐶</span> Noob Mode
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showHandInfo} onChange={(e) => onToggleBeginner(e.target.checked)} className="w-4 h-4" />
                    <span className="text-white text-sm">🐶من نوب سگم</span>
                  </label>
                </div>

                <div className="px-4 py-3 border-b border-gray-700/50">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>⏯️</span> Game Control
                  </div>
                  <button
                    onClick={togglePause}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all ${
                      isPaused
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                    }`}
                  >
                    <span className="text-sm font-medium">{isPaused ? '▶️ Resume' : '⏸️ Pause'}</span>
                    <span className="text-lg">{isPaused ? '▶️' : '⏸️'}</span>
                  </button>
                </div>

                <div className="px-4 py-3">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>🔄</span> Lobby
                  </div>
                  <button
                    onClick={() => setResetConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition-all text-sm font-medium"
                  >
                    <span>🔄</span> Reset Lobby
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {resetConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn" onClick={() => setResetConfirm(false)}>
          <div className="bg-gray-800 p-6 rounded-xl text-center" onClick={e => e.stopPropagation()}>
            <p className="text-white mb-4">Reset all scores and chips? This cannot be undone.</p>
            <button onClick={resetLobby} className="bg-red-600 px-4 py-2 rounded mr-2">Yes, Reset</button>
            <button onClick={() => setResetConfirm(false)} className="bg-gray-600 px-4 py-2 rounded">Cancel</button>
          </div>
        </div>
      )}

      <Leaderboard players={gameState.players} currentRound={gameState.currentRound} />

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
          <div className="text-white text-4xl font-black drop-shadow-lg animate-pulse">⏸️ GAME PAUSED</div>
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
          🎉 {sideBetWin.bettorName} won {sideBetWin.total} chips from side bet on {sideBetWin.targetName}! 🎉
        </div>
      )}

      {achievementToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-400 to-amber-600 text-black font-bold px-6 py-3 rounded-full shadow-2xl animate-fadeInSlideDown flex items-center gap-2">
          <span className="text-2xl">🎖️</span>
          <div>
            <div className="text-sm">{achievementToast.player}</div>
            <div className="text-xs">{achievementToast.name}: {achievementToast.desc}</div>
          </div>
        </div>
      )}

      {currentPlayer && currentPlayer.folded && !gameState.winner && !currentPlayer.isSpectator && (
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
          <div className="text-amber-400 font-bold mb-2">👁️ Spectator Mode</div>
          <button
            onClick={sitIn}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold text-sm"
          >
            Sit In (1000 chips)
          </button>
          <div className="text-xs text-gray-400 mt-2">Wait for current hand to end</div>
        </div>
      )}

      <div ref={tableContainerRef} className="relative w-full h-full">
        <div
          ref={tableRef}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[65%] h-[55%] rounded-full bg-amber-800/30 shadow-2xl border-8 border-amber-700/40 backdrop-blur-sm game-table"
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
            <div className="bg-black/60 text-white px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap shadow-lg" style={{ background: 'var(--pot-bg)' }}>
              💰 Pot: {gameState.totalPot}
            </div>
            <div className="flex gap-3 p-4 bg-amber-950/50 rounded-3xl">
              {gameState.communityCards.map((card, i) => (
                <div
                  key={i}
                  className={newCardIndices.includes(i) ? 'card-reveal-spin' : ''}
                  style={{ animationDelay: newCardIndices.includes(i) ? `${(i - (prevCommunityLengthRef.current - newCardIndices.length)) * 0.15}s` : '0s' }}
                >
                  <Card rank={card.rank} suit={card.suit} isCommunity={true} />
                </div>
              ))}
              {gameState.communityCards.length === 0 && <div className="text-white text-sm">Flop</div>}
            </div>
          </div>
        </div>

        {activePlayersList.map((p, idx) => {
          const pos = playerPositions[p.id];
          if (!pos) return null;
          const isActive = gameState.currentPlayerId === p.id;
          const isWinner = winnerEffect?.winnerId === p.id;
          const isSelf = p.id === playerId;
          const canReveal = !gameState.handInProgress && gameState.winner && isSelf && !p.folded && !p.revealed;
          const isReady = p.ready && !gameState.firstHandStarted && !gameState.handInProgress;
          const isTimerActive = turnCurrentPlayerId === p.id && turnRemainingSec > 0;

          return (
            <div
              key={p.id}
              ref={el => playerRefs.current[p.id] = el}
              className="absolute transition-all duration-300 flex items-center"
              style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
            >
              {isTimerActive && (
                <div className="flex flex-col items-center mr-2 z-20">
                  <div className="text-[10px] text-white mb-1 font-mono">
                    {Math.ceil(turnRemainingSec)}s
                  </div>
                  <div className="w-2 h-16 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="w-full transition-all duration-300 ease-linear"
                      style={{
                        height: `${(turnRemainingSec / 20) * 100}%`,
                        backgroundColor: getTimerColor(turnRemainingSec),
                        borderRadius: '0 0 999px 999px'
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                {isWinner && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 pointer-events-none">
                    <div className="animate-bounce text-yellow-300 font-black text-2xl drop-shadow-lg winner-text" style={{ color: 'var(--winner-text)' }}>🏆 WINNER! 🏆</div>
                    {!isSelf && (
                      <div className="flex gap-1 justify-center mt-1">
                        {winnerEffect.winnerCards.map((card, ci) => (
                          <div key={ci} className="animate-spin-once">
                            <Card rank={card.rank} suit={card.suit} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {speechBubbles.filter(b => b.playerId === p.id).map(bubble => (
                  <div key={bubble.id} className="absolute -top-24 left-1/2 -translate-x-1/2 z-[999] animate-fadeIn">
                    <div className="bg-black/90 text-white text-xs px-3 py-1.5 rounded-2xl border border-amber-400 shadow-xl max-w-[180px] break-words text-center">
                      {bubble.text}
                    </div>
                  </div>
                ))}

                <div className={`bg-gradient-to-br from-gray-800/95 to-gray-900/95 rounded-2xl p-3 shadow-xl backdrop-blur-sm w-48
                  ${isActive ? 'ring-4 ring-yellow-400 scale-105 shadow-yellow-500/50' : ''}
                  ${p.folded ? 'opacity-60 grayscale' : ''}
                  ${p.isAllIn ? 'ring-2 ring-red-500' : ''}
                  ${isWinner ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-500/50' : ''}
                  ${isReady ? 'ring-2 ring-green-400 shadow-lg shadow-green-500/50' : ''}`}
                  style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                  <div className="absolute -top-3 left-4 bg-amber-700 text-white text-xs px-2 rounded-full font-bold">#{idx+1}</div>
                  <div className="font-bold text-white text-center text-lg">{p.name}</div>
                  <div className="text-green-400 text-center">💰 {p.chips}</div>
                  {p.lastAction?.type && (
                    <div className={`text-xs text-center ${
                      p.lastAction.type === 'fold' ? 'text-red-400' :
                      p.lastAction.type === 'check' ? 'text-gray-400' :
                      p.lastAction.type === 'call' ? 'text-green-400' :
                      p.lastAction.type === 'raise' ? 'text-orange-400' :
                      p.lastAction.type === 'allin' ? 'text-red-500 animate-pulse' : 'text-white'
                    }`}>
                      {p.lastAction.type.toUpperCase()}{p.lastAction.amount > 0 ? ` ${p.lastAction.amount}` : ''}
                    </div>
                  )}
                  <div className="flex justify-center gap-1 mt-2">
                    {p.holeCards?.map((card, ci) => (
                      <Card 
                        key={ci} 
                        rank={isSelf || p.revealed ? card.rank : '?'} 
                        suit={isSelf || p.revealed ? card.suit : '?'} 
                        hidden={!(isSelf || p.revealed)} 
                        cardBack={cardBack}
                        isSelf={isSelf}
                        revealAnim={p.revealed && !isSelf}
                      />
                    ))}
                  </div>
                  <div className="flex justify-center gap-1 mt-2 text-xs">
                    {p.folded && <span className="bg-red-600 text-white px-2 py-0.5 rounded-full">FOLD</span>}
                    {p.isAllIn && <span className="bg-orange-600 text-white px-2 py-0.5 rounded-full animate-pulse">ALL IN</span>}
                  </div>
                  {gameState.dealerIndex === p.id && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-800 text-white text-[10px] px-3 py-0.5 rounded-full shadow">DEALER</div>
                  )}
                  {isSelf && showHandInfo && !p.folded && !p.isSpectator && (
                    <HandInfo 
                      holeCards={p.holeCards}
                      communityCards={gameState.communityCards}
                      round={gameState.currentRound}
                      playerName={p.name}
                      opponentsCount={activePlayersList.filter(ap => ap.id !== playerId && !ap.folded).length}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {animatingChips.map(chip => (
        <AnimatedChip key={chip.id} value={chip.value} fromPosition={chip.fromPos} toPosition={chip.toPosition} onComplete={() => removeChipAnimation(chip.id)} />
      ))}

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
        canReveal={!gameState.handInProgress && gameState.winner && currentPlayer && !currentPlayer.folded && !currentPlayer.revealed}
        onReveal={handleRevealCards}
      />
    </div>
  );
}