import React from 'react';
import Chat from './Chat.jsx';
import BettingPanel from './BettingPanel.jsx';

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
            ⏸️ GAME PAUSED
          </div>
        </div>
      )}

      {gameState?.winner && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="winner-themed text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-wider whitespace-nowrap">
            {winningHandName || 'Winner!'}
          </div>
        </div>
      )}

      {systemMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-600 text-black font-bold px-6 py-2 rounded-full shadow-lg animate-bounce">
          {systemMessage}
        </div>
      )}

      {dealerMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-700/90 text-white font-bold px-6 py-2 rounded-full shadow-lg animate-fadeIn">
          {dealerMessage}
        </div>
      )}

      {sideBetWin && !sideBetWin.refunded && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-purple-800 text-white font-bold px-6 py-2 rounded-full shadow-lg animate-pulse">
          🎉 {sideBetWin.bettorName} won {sideBetWin.total} chips from side bet on {sideBetWin.targetName}! 🎉
        </div>
      )}

      {sideBetWin && sideBetWin.refunded && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-700 text-white font-bold px-6 py-2 rounded-full shadow-lg animate-pulse">
          ↩️ {sideBetWin.targetName} folded – your side bet stake of {formatChips(sideBetWin.amount)} has been refunded.
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
        <div className="fixed bottom-4 right-4 z-30 bg-black/70 backdrop-blur-md rounded-xl p-4 border border-amber-700/50 text-white text-center">
          <div className="text-amber-400 font-bold mb-2">👁️ Spectator Mode</div>
          <button
            onClick={sitIn}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold text-sm"
          >
            Sit In ({formatChips(gameState.startingChips || 1000)})
          </button>
          <div className="text-xs text-gray-400 mt-2">Wait for current hand to end</div>
        </div>
      )}

      {resetConfirm && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setResetConfirm(false)}
        >
          <div
            className="bg-gray-800 p-6 rounded-xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white mb-4">Reset all scores and chips? This cannot be undone.</p>
            <button onClick={resetLobby} className="bg-red-600 px-4 py-2 rounded mr-2">
              Yes, Reset
            </button>
            <button onClick={() => setResetConfirm(false)} className="bg-gray-600 px-4 py-2 rounded">
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
              <h3 className="text-amber-400 font-bold text-lg">Hand History</h3>
              <button onClick={() => setShowHistory(false)} className="text-white text-2xl">
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
    </>
  );
});

export default GameOverlays;