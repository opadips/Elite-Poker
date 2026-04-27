const lobbyTimers = new Map();

export function broadcastTurnTimer(lobbyId, lobbyManager, clientRegistry, broadcastGameState) {
  const timerData = lobbyTimers.get(lobbyId);
  if (!timerData || !timerData.turnStartTime) return;
  const lobby = lobbyManager.getLobby(lobbyId);
  if (!lobby || lobby.game.paused) return;
  const elapsed = (Date.now() - timerData.turnStartTime) / 1000;
  const remaining = Math.max(0, 20 - elapsed);
  const currentPlayerId = lobby.game.getState().currentPlayerId;
  const msg = JSON.stringify({ type: 'turnTimer', remaining, currentPlayerId });
  for (const [ws, client] of clientRegistry.entries()) {
    if (client.lobbyId === lobbyId && ws.readyState === 1) {
      ws.send(msg);
    }
  }
  if (remaining <= 0) {
    stopTurnTimerBroadcast(lobbyId);
  }
}

export function startTurnTimerBroadcast(lobbyId, playerId) {
  stopTurnTimerBroadcast(lobbyId);
  lobbyTimers.set(lobbyId, {
    turnStartTime: Date.now(),
    lastTurnPlayerId: playerId,
    interval: setInterval(() => {
      const { lobbyManager, clientRegistry, broadcastGameState } = startTurnTimerBroadcast.refs || {};
      if (lobbyManager) broadcastTurnTimer(lobbyId, lobbyManager, clientRegistry, broadcastGameState);
    }, 500),
  });
}

export function stopTurnTimerBroadcast(lobbyId) {
  const timerData = lobbyTimers.get(lobbyId);
  if (timerData) {
    if (timerData.interval) clearInterval(timerData.interval);
    lobbyTimers.delete(lobbyId);
  }
}

export function setTurnTimerRefs(refs) {
  startTurnTimerBroadcast.refs = refs;
}

export function clearTimer(ws, clientRegistry) {
  const client = clientRegistry.get(ws);
  if (client?.timeoutId) {
    clearTimeout(client.timeoutId);
    client.timeoutId = null;
  }
}

export function setAutoActionTimer(ws, playerId, lobbyId, lobbyManager, clientRegistry, broadcastGameState) {
  const lobby = lobbyManager.getLobby(lobbyId);
  if (!lobby || lobby.game.paused) return;
  clearTimer(ws, clientRegistry);
  const client = clientRegistry.get(ws);
  if (!client) return;

  startTurnTimerBroadcast(lobbyId, playerId);

  const timeoutId = setTimeout(() => {
    const lobbyNow = lobbyManager.getLobby(lobbyId);
    if (!lobbyNow || lobbyNow.game.paused) return;
    const player = lobbyNow.game.players.find(p => p.id === playerId);
    if (!player || player.folded || player.isAllIn) {
      stopTurnTimerBroadcast(lobbyId);
      return;
    }
    const currentTurnPlayer = lobbyNow.game.getState().currentPlayerId;
    if (currentTurnPlayer !== playerId) {
      stopTurnTimerBroadcast(lobbyId);
      return;
    }
    const toCall = lobbyNow.game.currentBet - player.currentBet;
    if (toCall === 0) {
      lobbyNow.game.playerAction(playerId, 'check');
    } else {
      lobbyNow.game.playerAction(playerId, 'fold');
    }
    broadcastGameState(lobbyId);
    stopTurnTimerBroadcast(lobbyId);
    client.timeoutId = null;
  }, 20000);

  client.timeoutId = timeoutId;
}

export function clearAllTimers(lobbyId, clientRegistry) {
  for (const [ws, client] of clientRegistry.entries()) {
    if (client.lobbyId === lobbyId && client.timeoutId) {
      clearTimeout(client.timeoutId);
      client.timeoutId = null;
    }
  }
  stopTurnTimerBroadcast(lobbyId);
}

export function ensureTurnTimer(lobbyId, lobbyManager, clientRegistry, broadcastGameState) {
  const lobby = lobbyManager.getLobby(lobbyId);
  if (!lobby) return;
  const state = lobby.game.getState();
  if (!state.handInProgress || state.winner || state.paused || !state.waitingForAction) {
    stopTurnTimerBroadcast(lobbyId);
    return;
  }
  const currentId = state.currentPlayerId;
  if (!currentId) return;
  const timerData = lobbyTimers.get(lobbyId);
  if (!timerData || timerData.lastTurnPlayerId !== currentId) {
    const targetWs = [...clientRegistry.entries()].find(([_, c]) => c.playerId === currentId && c.lobbyId === lobbyId)?.[0];
    if (targetWs) {
      setAutoActionTimer(targetWs, currentId, lobbyId, lobbyManager, clientRegistry, broadcastGameState);
    } else {
      startTurnTimerBroadcast(lobbyId, currentId);
    }
  }
}