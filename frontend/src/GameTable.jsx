// src/GameTable.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Card from './components/Card.jsx';
import ActionButtons from './components/ActionButtons.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import HandInfo from './components/HandInfo.jsx';
import AnimatedChip from './components/AnimatedChip.jsx';
import TurnTimer from './components/TurnTimer.jsx';
import Chat from './components/Chat.jsx';
import BettingPanel from './components/BettingPanel.jsx';
import { cardDeal, chipClick, winnerFanfare, timerBeep } from './hooks/useSound';
import './styles/animations.css'; // ⭐ انیمیشن‌های جدید

export default function GameTable({ ws, playerId, theme, onThemeChange }) {
  const [gameState, setGameState] = useState(null);
  const [winnerEffect, setWinnerEffect] = useState(null);
  const [winningHandName, setWinningHandName] = useState(null);
  const [playerPositions, setPlayerPositions] = useState({});
  const [showHandInfo, setShowHandInfo] = useState(false);
  const [animatingChips, setAnimatingChips] = useState([]);
  const [systemMessage, setSystemMessage] = useState(null);
  const [sideBetWin, setSideBetWin] = useState(null);
  const [showChat, setShowChat] = useState(true);
  const [newCardIndices, setNewCardIndices] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [timerResetTrigger, setTimerResetTrigger] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const tableContainerRef = useRef(null);
  const tableRef = useRef(null);
  const playerRefs = useRef({});
  const lastWinnerRef = useRef(null);
  const prevCommunityLengthRef = useRef(0);

  const themes = [
    { id: 'classic', name: 'Classic', icon: '🃏', color: 'bg-emerald-800' },
    { id: 'cyberpunk', name: 'Cyberpunk', icon: '💠', color: 'bg-purple-800' },
    { id: 'fantasy', name: 'Fantasy', icon: '✨', color: 'bg-amber-700' },
    { id: 'midnight', name: 'Midnight', icon: '🌙', color: 'bg-blue-900' }
  ];

  const addChipAnimation = (fromPlayerId, value) => {
    const playerEl = playerRefs.current[fromPlayerId];
    if (playerEl) {
      const rect = playerEl.getBoundingClientRect();
      const fromPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      setAnimatingChips(prev => [...prev, { id: Date.now() + Math.random(), value, fromPos }]);
    }
  };

  const removeChipAnimation = (id) => {
    setAnimatingChips(prev => prev.filter(c => c.id !== id));
  };

  useEffect(() => {
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'gameState') {
        const newCommLength = data.state.communityCards?.length || 0;
        const oldLength = prevCommunityLengthRef.current;
        if (newCommLength > oldLength) {
          const newIndices = [];
          for (let i = oldLength; i < newCommLength; i++) {
            newIndices.push(i);
          }
          setNewCardIndices(newIndices);
          if (soundEnabled) cardDeal(); // ✅ شرط صدا
          setTimeout(() => setNewCardIndices([]), 600);
        }
        prevCommunityLengthRef.current = newCommLength;
        
        setGameState(data.state);
        if (data.state.winner && data.state.winner !== lastWinnerRef.current) {
          lastWinnerRef.current = data.state.winner;
          const winnerPlayer = data.state.players?.find(p => p.name === data.state.winner.names);
          if (winnerPlayer) {
            setWinnerEffect({
              winnerId: winnerPlayer.id,
              winnerCards: winnerPlayer.holeCards,
              winnerName: winnerPlayer.name
            });
            setWinningHandName(data.state.winner.handName);
            if (soundEnabled) winnerFanfare(); // ✅ شرط صدا
            setTimeout(() => {
              setWinnerEffect(null);
              setWinningHandName(null);
            }, 3000);
          }
        }
      } else if (data.type === 'system') {
        setSystemMessage(data.text);
        setTimeout(() => setSystemMessage(null), 3000);
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
  }, [ws, soundEnabled]);

  const updatePositions = useCallback(() => {
    if (!gameState || !tableRef.current) return;
    const tableRect = tableRef.current.getBoundingClientRect();
    const tableWidth = tableRect.width;
    const tableHeight = tableRect.height;
    const a = tableWidth / 2;
    const b = tableHeight / 2;
    const centerX = tableRect.left + a;
    const centerY = tableRect.top + b;
    const total = gameState.players.filter(p => !p.isSpectator).length;
    const activePlayers = gameState.players.filter(p => !p.isSpectator);
    const newPositions = {};
    activePlayers.forEach((_, idx) => {
      const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + a * Math.cos(angle);
      const y = centerY + b * Math.sin(angle);
      newPositions[activePlayers[idx].id] = { x, y };
    });
    setPlayerPositions(newPositions);
  }, [gameState]);

  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [updatePositions]);

  useEffect(() => {
    if (gameState && gameState.currentPlayerId === playerId && gameState.waitingForAction) {
      setTimerResetTrigger(prev => prev + 1);
    }
  }, [gameState?.currentPlayerId, gameState?.waitingForAction, playerId]);

  const onTurnTimeout = () => {
    if (gameState && gameState.currentPlayerId === playerId && gameState.waitingForAction) {
      const currentPlayer = gameState.players?.find(p => p.id === playerId);
      if (currentPlayer && !currentPlayer.isAllIn && !currentPlayer.folded) {
        const toCall = gameState.currentBet - (currentPlayer.currentBet || 0);
        if (toCall === 0) {
          ws.send(JSON.stringify({ type: 'action', action: 'check' }));
        } else {
          ws.send(JSON.stringify({ type: 'action', action: 'fold' }));
        }
      }
    }
  };

  const handleTimerBeep = () => {
    if (soundEnabled) timerBeep(); // ✅ شرط صدا
  };

  if (!gameState) return <div className="min-h-screen flex items-center justify-center text-white">Waiting...</div>;

  const currentPlayer = gameState.players?.find(p => p.id === playerId);
  const myTurn = gameState.currentPlayerId === playerId && gameState.waitingForAction && !gameState.winner && currentPlayer && !currentPlayer.isAllIn && !currentPlayer.isSpectator;
  const toCall = myTurn && currentPlayer ? (gameState.currentBet - (currentPlayer.currentBet || 0)) : 0;

  const handleAction = (type, amount = 0) => {
    if (type === 'fold') ws.send(JSON.stringify({ type: 'action', action: 'fold' }));
    else if (type === 'check') ws.send(JSON.stringify({ type: 'action', action: 'check' }));
    else if (type === 'call') {
      addChipAnimation(playerId, toCall);
      if (soundEnabled) chipClick(); // ✅ شرط صدا
      ws.send(JSON.stringify({ type: 'action', action: 'call' }));
    }
    else if (type === 'raise') {
      addChipAnimation(playerId, amount);
      if (soundEnabled) chipClick(); // ✅ شرط صدا
      ws.send(JSON.stringify({ type: 'action', action: 'raise', amount }));
    }
    else if (type === 'allin') {
      addChipAnimation(playerId, currentPlayer?.chips);
      if (soundEnabled) chipClick(); // ✅ شرط صدا
      ws.send(JSON.stringify({ type: 'action', action: 'allin' }));
    }
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

  const activePlayersList = gameState.players.filter(p => !p.isSpectator);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: 'var(--bg-gradient)' }}>
      {/* دکمه چت */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed top-4 left-4 z-40 w-10 h-10 rounded-full bg-amber-700 hover:bg-amber-600 shadow-lg flex items-center justify-center text-white text-xl transition-all"
        title={showChat ? "Close chat" : "Open chat"}
      >
        💬
      </button>

      <div className="fixed top-4 right-20 z-40">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 shadow-lg flex items-center justify-center text-white text-xl transition-all"
          title="Settings"
        >
          ⚙️
        </button>
        {showSettings && (
          <div className="absolute right-0 mt-2 w-64 bg-gray-800/95 backdrop-blur-md rounded-lg shadow-xl border border-amber-700/50 z-50 animate-fadeInSlideDown origin-top-right">
            <div className="py-2">
              <div className="px-4 py-2 text-sm text-amber-400 border-b border-amber-700/50 font-bold">🎨 Select Theme</div>
              <div className="px-3 py-2 grid grid-cols-2 gap-2">
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onThemeChange(t.id);
                      setShowSettings(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      theme === t.id 
                        ? 'bg-amber-500 text-black shadow-md scale-105' 
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-sm">{t.name}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-amber-700/50 my-1"></div>
              <button
                onClick={() => setSoundEnabled(prev => !prev)}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700/50 transition flex items-center gap-2"
              >
                <span className="text-lg">{soundEnabled ? '🔊' : '🔇'}</span>
                {soundEnabled ? 'Sound ON' : 'Sound OFF'}
              </button>
              <div className="border-t border-amber-700/50 my-1"></div>
              <button
                onClick={() => setResetConfirm(true)}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 transition flex items-center gap-2"
              >
                <span>🔄</span> Reset Lobby
              </button>
            </div>
          </div>
        )}
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

      {showChat && <Chat ws={ws} playerName={currentPlayer?.name || '?'} />}

      {gameState.currentPlayerId === playerId && gameState.waitingForAction && !gameState.winner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
          <TurnTimer 
            duration={20} 
            onTimeout={onTurnTimeout} 
            resetTrigger={timerResetTrigger}
            onBeep={handleTimerBeep}
          />
        </div>
      )}

      {winningHandName && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none whitespace-nowrap">
          <div className="relative text-center">
            <span className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-wider bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] animate-sparkleCenter">
              {winningHandName}
            </span>
            <div className="absolute -top-8 -left-8 text-2xl animate-sparkle">✨</div>
            <div className="absolute -bottom-6 -right-6 text-2xl animate-sparkle delay-150">✨</div>
            <div className="absolute top-0 right-0 text-xl animate-sparkle delay-300">⭐</div>
            <div className="absolute bottom-0 left-0 text-xl animate-sparkle delay-75">⭐</div>
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

      <div className="fixed bottom-4 right-4 z-30 bg-black/60 backdrop-blur-md rounded-xl px-3 py-2 border border-amber-700/40 flex items-center gap-2 text-white text-sm">
        <label htmlFor="handInfoToggle" className="cursor-pointer">🐶 من نوب سگم</label>
        <input type="checkbox" id="handInfoToggle" checked={showHandInfo} onChange={(e) => onToggleBeginner(e.target.checked)} />
      </div>

      {showHandInfo && currentPlayer && !currentPlayer.folded && !currentPlayer.isSpectator && (
        <HandInfo holeCards={currentPlayer.holeCards} communityCards={gameState.communityCards} round={gameState.currentRound} playerName={currentPlayer.name} />
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
        <div className="fixed bottom-24 left-4 z-30 bg-black/70 backdrop-blur-md rounded-xl p-4 border border-amber-700/50 text-white text-center">
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
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] rounded-full bg-amber-800/30 shadow-2xl border-8 border-amber-700/40 backdrop-blur-sm game-table"
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
                  <Card rank={card.rank} suit={card.suit} />
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
          return (
            <div
              key={p.id}
              ref={el => playerRefs.current[p.id] = el}
              className="absolute transition-all duration-300"
              style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
            >

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

              <div className={`bg-gradient-to-br from-gray-800/95 to-gray-900/95 rounded-2xl p-3 shadow-xl backdrop-blur-sm w-48
                ${isActive ? 'ring-4 ring-yellow-400 scale-105 shadow-yellow-500/50' : ''}
                ${p.folded ? 'opacity-60 grayscale' : ''}
                ${p.isAllIn ? 'ring-2 ring-red-500' : ''}
                ${isWinner ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-500/50' : ''}`}
                style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                <div className="absolute -top-3 left-4 bg-amber-700 text-white text-xs px-2 rounded-full font-bold">#{idx+1}</div>
                <div className="font-bold text-white text-center text-lg">{p.name}</div>
                <div className="text-green-400 text-center">💰 {p.chips}</div>
                <div className="flex justify-center gap-1 mt-2">
                  {p.holeCards?.map((card, ci) => (
                    <Card key={ci} rank={isSelf ? card.rank : '?'} suit={isSelf ? card.suit : '?'} hidden={!isSelf} />
                  ))}
                </div>
                <div className="flex justify-center gap-1 mt-2 text-xs">
                  {p.folded && <span className="bg-red-600 text-white px-2 py-0.5 rounded-full">FOLD</span>}
                  {p.isAllIn && <span className="bg-orange-600 text-white px-2 py-0.5 rounded-full animate-pulse">ALL IN</span>}
                </div>
                {gameState.dealerIndex === p.id && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-800 text-white text-[10px] px-3 py-0.5 rounded-full shadow">DEALER</div>
                )}
                {isSelf && !gameState.firstHandStarted && !gameState.handInProgress && !p.isSpectator && (
                  <button
                    onClick={toggleReady}
                    className={`mt-2 w-full text-xs font-bold py-1 rounded transition ${p.ready ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'}`}
                  >
                    {p.ready ? '✓ Ready' : 'Ready'}
                  </button>
                )}
                {!isSelf && p.ready && !gameState.firstHandStarted && !gameState.handInProgress && !p.isSpectator && (
                  <div className="text-center text-green-400 text-[10px] mt-1">✓ Ready</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {animatingChips.map(chip => (
        <AnimatedChip key={chip.id} value={chip.value} fromPosition={chip.fromPos} onComplete={() => removeChipAnimation(chip.id)} />
      ))}

      {myTurn && (
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
        />
      )}
    </div>
  );
}