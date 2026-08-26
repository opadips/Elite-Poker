import React, { useState, useEffect, useRef } from 'react';
import Chat from './Chat.jsx';
import BettingPanel from './BettingPanel.jsx';
import { IconTrophy } from './icons.jsx';

function formatChips(amount) {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return amount.toString();
}

const GameOverlays = React.memo(function GameOverlays({
  gameState,
  currentPlayer,
  isPaused,
  winningHandName,
  systemMessage,
  sideBetWin,
  achievementToast,
  showChat,
  chatMessages,
  handleSendChat,
  showHistory,
  setShowHistory,
  handHistory,
  resetConfirm,
  setResetConfirm,
  resetLobby,
  ws,
  playerId,
  sitIn,
  dealerMessage,
}) {
  const [displayedDealerMsg, setDisplayedDealerMsg] = useState(null);
  const dealerTimerRef = useRef(null);
  const lastMessageRef = useRef(null);

  useEffect(() => {
    if (dealerMessage && dealerMessage !== lastMessageRef.current) {
      lastMessageRef.current = dealerMessage;
      if (dealerTimerRef.current) clearTimeout(dealerTimerRef.current);
      setDisplayedDealerMsg(dealerMessage);
    } else if (!dealerMessage) {
      lastMessageRef.current = null;
    }
  }, [dealerMessage]);

  useEffect(() => {
    if (displayedDealerMsg) {
      if (dealerTimerRef.current) clearTimeout(dealerTimerRef.current);
      dealerTimerRef.current = setTimeout(() => {
        setDisplayedDealerMsg(null);
        lastMessageRef.current = null;
      }, 2000);
    }
    return () => {
      if (dealerTimerRef.current) clearTimeout(dealerTimerRef.current);
    };
  }, [displayedDealerMsg]);

  return (
    <>
      {showChat && (
        <Chat
          messages={chatMessages}
          playerName={currentPlayer?.name || '?'}
          onSendMessage={handleSendChat}
        />
      )}

      {isPaused && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center pointer-events-none">
          <div className="text-white text-4xl font-black drop-shadow-lg animate-pulse">
            GAME PAUSED
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

      {displayedDealerMsg && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-amber-700/90 text-white font-bold px-6 py-2 rounded-full shadow-lg animate-fadeIn">
          {displayedDealerMsg}
        </div>
      )}

      {sideBetWin && !sideBetWin.refunded && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-purple-800 text-white font-bold px-6 py-2 rounded-full shadow-lg animate-pulse">
          {sideBetWin.bettorName} won {sideBetWin.total} chips from side bet on {sideBetWin.targetName}!
        </div>
      )}

      {sideBetWin && sideBetWin.refunded && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-700 text-white font-bold px-6 py-2 rounded-full shadow-lg animate-pulse">
          {sideBetWin.targetName} folded – your side bet stake of {formatChips(sideBetWin.amount)} has been refunded.
        </div>
      )}

      {achievementToast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl animate-fadeInSlideDown flex items-center gap-3"
          style={{
            background: 'linear-gradient(90deg, #e8c96a 0%, #c9962e 100%)',
            color: '#171204',
          }}
        >
          <IconTrophy size={26} />
          <div>
            <div className="text-sm font-bold">{achievementToast.player}</div>
            <div className="text-xs">
              {achievementToast.name}: {achievementToast.desc}
            </div>
          </div>
        </div>
      )}

      {currentPlayer && currentPlayer.folded && !gameState?.winner && !currentPlayer.isSpectator && (
        <BettingPanel
          ws={ws}
          playerId={playerId}
          players={gameState.players}
          currentRound={gameState.currentRound}
          chipAmount={currentPlayer.chips}
        />
      )}

      {currentPlayer && currentPlayer.isSpectator && !gameState?.winner && (
        <div
          className="fixed bottom-4 right-4 z-30 backdrop-blur-md rounded-xl p-4 text-center"
          style={{ background: 'var(--seat-bg)', border: '1px solid var(--panel-border)' }}
        >
          <div className="font-bold mb-2 text-sm" style={{ color: 'var(--accent)' }}>Spectator Mode</div>
          <button className="action-btn action-btn--call" onClick={sitIn}>
            Sit In · {formatChips(gameState.startingChips || 1000)}
          </button>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Wait for current hand to end</div>
        </div>
      )}

      {resetConfirm && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setResetConfirm(false)}
        >
          <div
            className="glass-panel p-6 rounded-xl text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4" style={{ color: 'var(--text-primary)' }}>
              Reset all scores and chips? This cannot be undone.
            </p>
            <button
              onClick={resetLobby}
              className="px-4 py-2 rounded-lg mr-2 font-semibold transition-all hover:brightness-110"
              style={{ background: 'var(--btn-fold-bg)', color: '#fff' }}
            >
              Yes, Reset
            </button>
            <button
              onClick={() => setResetConfirm(false)}
              className="px-4 py-2 rounded-lg font-medium transition-all hover:brightness-125"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--panel-border)', color: 'var(--text-muted)' }}
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
            className="glass-panel p-6 rounded-xl max-w-md w-full max-h-[70vh] overflow-y-auto settings-scroll shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>
                Hand History
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-2xl leading-none transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>
            {handHistory.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hands played yet.</p>
            ) : (
              <ul className="text-sm space-y-2" style={{ color: 'var(--text-muted)' }}>
                {handHistory.map((entry, i) => (
                  <li key={i} className="pb-1" style={{ borderBottom: '1px solid var(--panel-border)' }}>
                    {entry}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
});

export default GameOverlays;