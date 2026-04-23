import React, { useEffect, useState, useRef, useCallback } from 'react';
import Card from './components/Card.jsx';
import ActionButtons from './components/ActionButtons.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import HandInfo from './components/HandInfo.jsx';
import AnimatedChip from './components/AnimatedChip.jsx';
import TurnTimer from './components/TurnTimer.jsx';
import Chat from './components/Chat.jsx';
import BettingPanel from './components/BettingPanel.jsx';

export default function GameTable({ ws, playerId }) {
  const [gameState, setGameState] = useState(null);
  const [winnerEffect, setWinnerEffect] = useState(null);
  const [winningHandName, setWinningHandName] = useState(null);
  const [playerPositions, setPlayerPositions] = useState({});
  const [showHandInfo, setShowHandInfo] = useState(false);
  const [animatingChips, setAnimatingChips] = useState([]);
  const [systemMessage, setSystemMessage] = useState(null);
  const [sideBetWin, setSideBetWin] = useState(null);
  const [showChat, setShowChat] = useState(true);
  const tableContainerRef = useRef(null);
  const tableRef = useRef(null); // مرجع به المان میز (دایره بیضی)
  const playerRefs = useRef({});
  const lastWinnerRef = useRef(null);

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
      }
    };
  }, [ws]);

  // به‌روزرسانی موقعیت بازیکنان بر اساس ابعاد واقعی میز (نه کل کانتینر)
  const updatePositions = useCallback(() => {
    if (!gameState || !tableRef.current) return;
    const tableRect = tableRef.current.getBoundingClientRect();
    const tableWidth = tableRect.width;
    const tableHeight = tableRect.height;
    const a = tableWidth / 2;   // شعاع افقی (نصف عرض میز)
    const b = tableHeight / 2;  // شعاع عمودی (نصف ارتفاع میز)
    const centerX = tableRect.left + a;
    const centerY = tableRect.top + b;
    const total = gameState.players.length;
    const newPositions = {};
    gameState.players.forEach((_, idx) => {
      // زاویه: شروع از بالا ( -PI/2 ) و پخش یکنواخت
      const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + a * Math.cos(angle);
      const y = centerY + b * Math.sin(angle);
      newPositions[gameState.players[idx].id] = { x, y };
    });
    setPlayerPositions(newPositions);
  }, [gameState]);

  // در صورت تغییر سایز پنجره یا تغییر state، موقعیت‌ها مجدداً محاسبه شوند
  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [updatePositions]);

  if (!gameState) return <div className="min-h-screen flex items-center justify-center text-white">Waiting...</div>;

  const currentPlayer = gameState.players?.find(p => p.id === playerId);
  const myTurn = gameState.currentPlayerId === playerId && gameState.waitingForAction && !gameState.winner && currentPlayer && !currentPlayer.isAllIn;
  const toCall = myTurn && currentPlayer ? (gameState.currentBet - (currentPlayer.currentBet || 0)) : 0;

  const handleAction = (type, amount = 0) => {
    if (type === 'fold') ws.send(JSON.stringify({ type: 'action', action: 'fold' }));
    else if (type === 'check') ws.send(JSON.stringify({ type: 'action', action: 'check' }));
    else if (type === 'call') {
      addChipAnimation(playerId, toCall);
      ws.send(JSON.stringify({ type: 'action', action: 'call' }));
    }
    else if (type === 'raise') {
      addChipAnimation(playerId, amount);
      ws.send(JSON.stringify({ type: 'action', action: 'raise', amount }));
    }
    else if (type === 'allin') {
      addChipAnimation(playerId, currentPlayer?.chips);
      ws.send(JSON.stringify({ type: 'action', action: 'allin' }));
    }
  };

  const onToggleBeginner = (checked) => {
    setShowHandInfo(checked);
    if (checked) ws.send(JSON.stringify({ type: 'toggleBeginner' }));
  };

  const onTurnTimeout = () => {
    if (myTurn) {
      if (toCall === 0) handleAction('check');
      else handleAction('fold');
    }
  };

  const toggleReady = () => {
    ws.send(JSON.stringify({ type: 'ready' }));
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-950 to-stone-900 overflow-hidden">
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed top-4 left-4 z-40 w-10 h-10 rounded-full bg-amber-700 hover:bg-amber-600 shadow-lg flex items-center justify-center text-white text-xl transition-all"
        title={showChat ? "Close chat" : "Open chat"}
      >
        💬
      </button>

      {showChat && <Chat ws={ws} playerName={currentPlayer?.name || '?'} />}

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

      <Leaderboard players={gameState.players} currentRound={gameState.currentRound} />

      <div className="fixed bottom-4 right-4 z-30 bg-black/60 backdrop-blur-md rounded-xl px-3 py-2 border border-amber-700/40 flex items-center gap-2 text-white text-sm">
        <label htmlFor="handInfoToggle" className="cursor-pointer">🐶 من نوب سگم</label>
        <input type="checkbox" id="handInfoToggle" checked={showHandInfo} onChange={(e) => onToggleBeginner(e.target.checked)} />
      </div>

      {showHandInfo && currentPlayer && !currentPlayer.folded && (
        <HandInfo holeCards={currentPlayer.holeCards} communityCards={gameState.communityCards} round={gameState.currentRound} playerName={currentPlayer.name} />
      )}

      {currentPlayer && currentPlayer.folded && !gameState.winner && (
        <BettingPanel
          ws={ws}
          playerId={playerId}
          players={gameState.players}
          currentRound={gameState.currentRound}
          chipAmount={currentPlayer.chips}
        />
      )}

      <div ref={tableContainerRef} className="relative w-full h-full">
        {/* المان میز بیضی شکل - با رفرنس برای محاسبه ابعاد واقعی */}
        <div
          ref={tableRef}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] rounded-full bg-amber-800/30 shadow-2xl border-8 border-amber-700/40 backdrop-blur-sm"
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
            <div className="bg-black/60 text-white px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap shadow-lg">
              💰 Pot: {gameState.totalPot}
            </div>
            <div className="flex gap-3 p-4 bg-amber-950/50 rounded-3xl">
              {gameState.communityCards.map((card, i) => <Card key={i} rank={card.rank} suit={card.suit} />)}
              {gameState.communityCards.length === 0 && <div className="text-white text-sm">Flop</div>}
            </div>
          </div>
        </div>

        {/* بازیکنان - موقعیت آنها بر اساس ابعاد واقعی میز محاسبه می‌شود */}
        {gameState.players.map((p, idx) => {
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
              {isActive && gameState.waitingForAction && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                  <TurnTimer duration={15} onTimeout={onTurnTimeout} />
                </div>
              )}

              {isWinner && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 pointer-events-none">
                  <div className="animate-bounce text-yellow-300 font-black text-2xl drop-shadow-lg">🏆 WINNER! 🏆</div>
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
                ${isWinner ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-500/50' : ''}`}>
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
                {gameState.dealerIndex === idx && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-800 text-white text-[10px] px-3 py-0.5 rounded-full shadow">DEALER</div>
                )}
                {isSelf && !gameState.firstHandStarted && !gameState.handInProgress && (
                  <button
                    onClick={toggleReady}
                    className={`mt-2 w-full text-xs font-bold py-1 rounded transition ${p.ready ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'}`}
                  >
                    {p.ready ? '✓ Ready' : 'Ready'}
                  </button>
                )}
                {!isSelf && p.ready && !gameState.firstHandStarted && !gameState.handInProgress && (
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