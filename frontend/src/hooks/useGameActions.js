// frontend/src/hooks/useGameActions.js
import { chipClick, allInSound as allInSoundFunc } from './useSound';

export function useGameActions(
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
  getSeatPosition,
  getPotPosition,
  setShowHistory
) {
  const addChipToQueue = (amount) => {
    const fromPos = getSeatPosition(playerId);
    const toPos = getPotPosition();
    enqueueAnimation({
      value: amount,
      from: fromPos,
      to: toPos,
      type: 'bet',
    });
  };

  const handleAction = (type, amount = 0) => {
    if (isPaused) return;
    if (type === 'fold' || type === 'check') {
      sendWs({ type: 'action', action: type });
    } else if (type === 'call') {
      const toCallVal = gameState && gameState.currentPlayerId === playerId && !currentPlayer?.isSpectator
        ? gameState.currentBet - (currentPlayer?.currentBet || 0)
        : 0;
      if (toCallVal > 0) {
        addChipToQueue(toCallVal);
        if (soundEnabled) chipClick();
      }
      sendWs({ type: 'action', action: 'call' });
    } else if (type === 'raise') {
      addChipToQueue(amount);
      if (soundEnabled) chipClick();
      sendWs({ type: 'action', action: 'raise', amount });
    } else if (type === 'allin') {
      addChipToQueue(currentPlayer?.chips || 0);
      if (soundEnabled) {
        chipClick();
        allInSoundFunc();
      }
      sendWs({ type: 'action', action: 'allin' });
    }
  };

  const handleRevealCards = () => sendWs({ type: 'reveal' });
  const toggleReady = () => sendWs({ type: 'ready' });
  const sitIn = () => sendWs({ type: 'sitIn' });

  const resetLobby = () => {
    sendWs({ type: 'resetLobby' });
    setResetConfirm(false);
    setShowSettings(false);
  };

  const togglePause = () =>
    sendWs({ type: isPaused ? 'resume' : 'pause' });

  const requestHandHistory = () => {
    sendWs({ type: 'getHandHistory' });
    if (setShowHistory) setShowHistory(true);
  };

  return {
    handleAction,
    handleRevealCards,
    toggleReady,
    sitIn,
    resetLobby,
    togglePause,
    requestHandHistory,
  };
}