import React, { useContext, useMemo, useState, useEffect, useRef } from 'react';
import Card from './Card.jsx';
import HandInfo from './HandInfo.jsx';
import TimerRing from './TimerRing.jsx';
import GameContext from '../context/GameContext';
import { IconCrown, IconX } from './icons.jsx';

function formatChips(amount) {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return amount.toString();
}

const PlayerSeat = React.memo(function PlayerSeat({ p, idx, pos }) {
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
    winnerIds,
    speechBubbles,
    sbId,
    bbId,
  } = useContext(GameContext);

  const cardRef = useRef(null);
  const [cardSize, setCardSize] = useState({ width: 200, height: 200 });

  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new ResizeObserver(() => {
      if (cardRef.current) {
        const { width, height } = cardRef.current.getBoundingClientRect();
        setCardSize({ width, height });
      }
    });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [gameState]);

  const isActive = gameState ? gameState.currentPlayerId === p.id : false;
  const isWinner = winnerIds && winnerIds.includes(p.id);
  const isSelf = p.id === playerId;
  const isReady = p.ready && !gameState?.firstHandStarted && !gameState?.handInProgress;
  const isTimerActive = turnCurrentPlayerId === p.id && turnRemainingSec > 0 && gameState?.handInProgress && !gameState?.winner;
  const showdownActive = p.revealed && !p.folded;
  const isSB = sbId === p.id;
  const isBB = bbId === p.id;

  const knownOpponentHands = useMemo(() => {
    if (!showdownActive) return null;
    return activePlayersList
      .filter(ap => ap.id !== p.id && !ap.folded && ap.revealed)
      .map(ap => ap.holeCards);
  }, [showdownActive, activePlayersList, p.id]);

  const opponentsCount = useMemo(() => {
    return knownOpponentHands
      ? knownOpponentHands.length
      : activePlayersList.filter(ap => ap.id !== playerId && !ap.folded).length;
  }, [knownOpponentHands, activePlayersList, playerId]);

  if (!pos) return null;

  return (
    <div
      className="absolute transition-all duration-300 flex items-center"
      style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
    >
      {isTimerActive && (
        <TimerRing
          remainingSec={turnRemainingSec}
          width={cardSize.width}
          height={cardSize.height}
        />
      )}
      <div>
        {isWinner && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 pointer-events-none">
            <div className="font-black text-3xl drop-shadow-lg winner-themed" style={{ color: 'var(--winner-text)' }}>
              WINNER
            </div>
          </div>
        )}
        {speechBubbles
          .filter(b => b.playerId === p.id)
          .map(bubble => (
            <div
              key={bubble.id}
              className="absolute -top-24 left-1/2 -translate-x-1/2 z-[999]"
            >
              <div
                className="text-xs px-3 py-1.5 rounded-2xl shadow-xl max-w-[180px] break-words text-center"
                style={{ background: 'var(--panel-bg)', border: '1px solid var(--accent)', color: 'var(--text-primary)' }}
              >
                {bubble.text}
              </div>
            </div>
          ))}
        <div
          ref={cardRef}
          className={`relative rounded-2xl p-3 shadow-xl backdrop-blur-sm w-48 transition-all duration-300
          ${p.folded ? 'opacity-60 grayscale' : ''}
          ${p.isAllIn ? 'ring-2 ring-red-500' : ''}
          ${isWinner ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-500/50' : ''}
          ${isReady ? 'ready-glow ring-2' : ''}`}
          style={{
            backgroundColor: 'var(--seat-bg)',
            border: '1px solid var(--seat-border)',
          }}
        >
          <div
            className="absolute -top-2.5 left-4 text-[10px] px-2 rounded-full font-bold tracking-wider"
            style={{ background: 'var(--panel-bg)', border: '1px solid var(--seat-border)', color: 'var(--text-muted)' }}
          >
            #{idx + 1}
          </div>
          <div className="font-bold text-center text-lg flex items-center justify-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
            <span className="truncate max-w-[110px]">{p.name}</span>
            {gameState?.adminId === p.id && (
              <span className="shrink-0" title="Admin" style={{ color: 'var(--accent)', display: 'flex' }}>
                <IconCrown />
              </span>
            )}
            {isSB && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: 'rgba(96,165,250,0.18)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.4)' }}
              >
                SB
              </span>
            )}
            {isBB && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: 'rgba(248,113,113,0.16)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.4)' }}
              >
                BB
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
                className="text-red-400 hover:text-red-300 ml-0.5 shrink-0"
                title="Kick player"
              >
                <IconX />
              </button>
            )}
          </div>
          <div className="text-center font-mono font-semibold" style={{ color: '#5fd08a' }}>{formatChips(p.chips)}</div>
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
              <span
                className="px-2 py-0.5 rounded-full font-semibold tracking-wider"
                style={{ background: 'rgba(220,70,70,0.18)', color: '#f08080', border: '1px solid rgba(220,70,70,0.4)' }}
              >
                FOLD
              </span>
            )}
            {p.isAllIn && (
              <span
                className="px-2 py-0.5 rounded-full font-semibold tracking-wider animate-pulse"
                style={{ background: 'rgba(240,130,40,0.18)', color: '#f5a860', border: '1px solid rgba(240,130,40,0.45)' }}
              >
                ALL IN
              </span>
            )}
          </div>
          {(gameState?.handInProgress || gameState?.firstHandStarted) && gameState?.dealerIndex === p.id && (
            <div
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] px-3 py-0.5 rounded-full shadow font-bold tracking-widest"
              style={{ background: 'var(--button-primary)', color: '#10131c' }}
            >
              DEALER
            </div>
          )}
          {showdownActive && !p.isSpectator && (
            <HandInfo
              holeCards={p.holeCards}
              communityCards={gameState?.communityCards}
              round={gameState?.currentRound}
              playerName={p.name}
              opponentsCount={opponentsCount}
              knownOpponentHands={knownOpponentHands}
              showEquity={true}
              simpleStrength={false}
            />
          )}
          {isSelf && showHandInfo && !p.folded && !p.isSpectator && !showdownActive && (
            <HandInfo
              holeCards={p.holeCards}
              communityCards={gameState?.communityCards}
              round={gameState?.currentRound}
              playerName={p.name}
              opponentsCount={opponentsCount}
              knownOpponentHands={null}
              showEquity={true}
              simpleStrength={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  const prevP = prevProps.p;
  const nextP = nextProps.p;
  return (
    prevP.chips === nextP.chips &&
    prevP.folded === nextP.folded &&
    prevP.isAllIn === nextP.isAllIn &&
    prevP.ready === nextP.ready &&
    prevP.revealed === nextP.revealed &&
    prevP.isSpectator === nextP.isSpectator &&
    prevP.currentBet === nextP.currentBet &&
    prevP.holeCards?.[0]?.rank === nextP.holeCards?.[0]?.rank &&
    prevP.holeCards?.[0]?.suit === nextP.holeCards?.[0]?.suit &&
    prevP.holeCards?.[1]?.rank === nextP.holeCards?.[1]?.rank &&
    prevP.holeCards?.[1]?.suit === nextP.holeCards?.[1]?.suit &&
    prevP.lastAction?.type === nextP.lastAction?.type &&
    prevP.lastAction?.amount === nextP.lastAction?.amount &&
    prevProps.pos?.x === nextProps.pos?.x &&
    prevProps.pos?.y === nextProps.pos?.y &&
    prevProps.idx === nextProps.idx
  );
});

export default PlayerSeat;