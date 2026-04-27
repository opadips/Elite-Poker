import React, { useContext } from 'react';
import Card from './Card.jsx';
import HandInfo from './HandInfo.jsx';
import GameContext from '../context/GameContext';

function formatChips(amount) {
  if (amount >= 1000000)
    return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (amount >= 1000)
    return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return amount.toString();
}

export default function PlayerSeat({ p, idx, pos }) {
  const {
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
  } = useContext(GameContext);

  if (!pos) return null;

  const isActive = gameState.currentPlayerId === p.id;
  const isWinner = winnerEffect?.winnerId === p.id;
  const isSelf = p.id === playerId;
  const isReady =
    p.ready && !gameState.firstHandStarted && !gameState.handInProgress;
  const isTimerActive = turnCurrentPlayerId === p.id && turnRemainingSec > 0;

  return (
    <div
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
                borderRadius: '0 0 999px 999px',
              }}
            />
          </div>
        </div>
      )}
      <div>
        {isWinner && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 pointer-events-none">
            <div
              className="animate-bounce text-yellow-300 font-black text-2xl drop-shadow-lg winner-text"
              style={{ color: 'var(--winner-text)' }}
            >
              🏆 WINNER! 🏆
            </div>
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
        {speechBubbles
          .filter((b) => b.playerId === p.id)
          .map((bubble) => (
            <div
              key={bubble.id}
              className="absolute -top-24 left-1/2 -translate-x-1/2 z-[999] animate-fadeIn"
            >
              <div className="bg-black/90 text-white text-xs px-3 py-1.5 rounded-2xl border border-amber-400 shadow-xl max-w-[180px] break-words text-center">
                {bubble.text}
              </div>
            </div>
          ))}
        <div
          className={`bg-gradient-to-br from-gray-800/95 to-gray-900/95 rounded-2xl p-3 shadow-xl backdrop-blur-sm w-48
          ${isActive ? 'ring-4 ring-yellow-400 scale-105 shadow-yellow-500/50' : ''}
          ${p.folded ? 'opacity-60 grayscale' : ''}
          ${p.isAllIn ? 'ring-2 ring-red-500' : ''}
          ${isWinner ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-500/50' : ''}
          ${isReady ? 'ring-2 ring-green-400 shadow-lg shadow-green-500/50' : ''}`}
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          <div className="absolute -top-3 left-4 bg-amber-700 text-white text-xs px-2 rounded-full font-bold">
            #{idx + 1}
          </div>
          <div className="font-bold text-white text-center text-lg flex items-center justify-center gap-1">
            {p.name}
            {isAdmin && p.name === currentPlayer?.name && (
              <span className="text-xs" title="Admin">
                👑
              </span>
            )}
            {isAdmin && !isSelf && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Kick ${p.name} from the table?`)) {
                    sendWs({ type: 'kickPlayer', targetId: p.id });
                  }
                }}
                className="text-red-400 hover:text-red-300 text-xs ml-1"
                title="Kick player"
              >
                ❌
              </button>
            )}
          </div>
          <div className="text-green-400 text-center">💰 {formatChips(p.chips)}</div>
          {p.lastAction?.type && (
            <div
              className={`text-xs text-center ${
                p.lastAction.type === 'fold'
                  ? 'text-red-400'
                  : p.lastAction.type === 'check'
                  ? 'text-gray-400'
                  : p.lastAction.type === 'call'
                  ? 'text-green-400'
                  : p.lastAction.type === 'raise'
                  ? 'text-orange-400'
                  : p.lastAction.type === 'allin'
                  ? 'text-red-500 animate-pulse'
                  : 'text-white'
              }`}
            >
              {p.lastAction.type.toUpperCase()}
              {p.lastAction.amount > 0 ? ` ${p.lastAction.amount}` : ''}
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
            {p.folded && (
              <span className="bg-red-600 text-white px-2 py-0.5 rounded-full">
                FOLD
              </span>
            )}
            {p.isAllIn && (
              <span className="bg-orange-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                ALL IN
              </span>
            )}
          </div>
          {gameState.dealerIndex === p.id && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-800 text-white text-[10px] px-3 py-0.5 rounded-full shadow">
              DEALER
            </div>
          )}
          {isSelf && showHandInfo && !p.folded && !p.isSpectator && (
            <HandInfo
              holeCards={p.holeCards}
              communityCards={gameState.communityCards}
              round={gameState.currentRound}
              playerName={p.name}
              opponentsCount={
                activePlayersList.filter((ap) => ap.id !== playerId && !ap.folded).length
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}