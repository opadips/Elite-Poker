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
  setAnimatingChips,
  playerRefs,
  sendWs
) {
  const toCall =
    gameState &&
    gameState.currentPlayerId === playerId &&
    gameState.waitingForAction &&
    !gameState.winner &&
    currentPlayer &&
    !currentPlayer.isAllIn &&
    !currentPlayer.isSpectator
      ? gameState.currentBet - (currentPlayer.currentBet || 0)
      : 0;

  const addChipAnimation = (fromPlayerId, value) => {
    const playerEl = playerRefs?.current?.[fromPlayerId];
    if (playerEl) {
      const rect = playerEl.getBoundingClientRect();
      const fromPos = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      setAnimatingChips((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          value,
          fromPos,
          toPosition: null,
        },
      ]);
    }
  };

  const handleAction = (type, amount = 0) => {
    if (isPaused) return;
    if (type === 'fold' || type === 'check') {
      sendWs({ type: 'action', action: type });
    } else if (type === 'call') {
      addChipAnimation(playerId, toCall);
      if (soundEnabled) chipClick();
      sendWs({ type: 'action', action: 'call' });
    } else if (type === 'raise') {
      addChipAnimation(playerId, amount);
      if (soundEnabled) chipClick();
      sendWs({ type: 'action', action: 'raise', amount });
    } else if (type === 'allin') {
      addChipAnimation(playerId, currentPlayer?.chips);
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
  const requestHandHistory = () => sendWs({ type: 'getHandHistory' });

  return {
    handleAction,
    handleRevealCards,
    toggleReady,
    sitIn,
    resetLobby,
    togglePause,
    requestHandHistory,
    addChipAnimation,
  };
}