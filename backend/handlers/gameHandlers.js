export function handleResetLobby(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage, clearAllTimers) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  if (!lobbyManager.isAdmin(client.lobbyId, client.playerId)) {
    ws.send(JSON.stringify({ type: 'error', message: 'Only admin can reset' }));
    return;
  }
  const lobby = lobbyManager.getLobby(client.lobbyId);
  if (lobby) {
    lobby.game.resetLobby();
    clearAllTimers(client.lobbyId, clients);
    broadcastGameState(client.lobbyId);
    broadcastSystemMessage(client.lobbyId, `🔄 Lobby reset by ${client.name}.`);
  }
}

export function handleAction(msg, ws, clients, lobbyManager, broadcastGameState, broadcastAllInSound, stopTurnTimerBroadcast, ensureTurnTimer) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  const lobby = lobbyManager.getLobby(client.lobbyId);
  if (!lobby || lobby.game.paused) return;
  const { action, amount } = msg;
  lobby.game.playerAction(client.playerId, action, amount);
  if (action === 'allin') {
    broadcastAllInSound(client.lobbyId);
  }
  broadcastGameState(client.lobbyId);
  if (!lobby.game.handInProgress || lobby.game.winner) {
    stopTurnTimerBroadcast(client.lobbyId);
  } else {
    ensureTurnTimer(client.lobbyId, lobbyManager, clients, broadcastGameState);
  }
}

export function handleReady(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  const lobby = lobbyManager.getLobby(client.lobbyId);
  if (!lobby) return;
  const result = lobby.game.toggleReady(client.playerId);
  if (result.success) {
    broadcastGameState(client.lobbyId);
    if (!lobby.game.handInProgress && lobby.game.getActivePlayers().length >= 2 && lobby.game.getActivePlayers().every(p => p.ready)) {
      broadcastSystemMessage(client.lobbyId, 'All players ready! Game starting...');
      broadcastGameState(client.lobbyId);
    }
  } else {
    ws.send(JSON.stringify({ type: 'error', message: result.message }));
  }
}

export function handleSitIn(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  const lobby = lobbyManager.getLobby(client.lobbyId);
  if (!lobby) return;
  const result = lobby.game.sitIn(client.playerId);
  if (result.success) {
    const player = lobby.game.players.find(p => p.id === client.playerId);
    if (player) player.chips = lobby.settings.startingChips;
    ws.send(JSON.stringify({ type: 'sitInSuccess' }));
    broadcastSystemMessage(client.lobbyId, `${client.name} sat in the game!`);
    broadcastGameState(client.lobbyId);
  } else {
    ws.send(JSON.stringify({ type: 'error', message: result.message }));
  }
}

export function handleToggleBeginner(msg, ws, clients, broadcastSystemMessage) {
  const client = clients.get(ws);
  if (client && client.lobbyId) {
    broadcastSystemMessage(client.lobbyId, `🐶 noob sag detected ${client.name}`);
  }
}

export function handleChat(msg, ws, clients, broadcastChat) {
  const client = clients.get(ws);
  if (client && client.lobbyId && msg.message && msg.message.trim()) {
    broadcastChat(client.lobbyId, client.name, msg.message.substring(0, 200));
  }
}

export function handleSideBet(msg, ws, clients, lobbyManager, broadcastChat, broadcastGameState) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  const lobby = lobbyManager.getLobby(client.lobbyId);
  if (!lobby || lobby.game.paused) return;
  const { targetId, amount } = msg;
  const result = lobby.game.placeSideBet(client.playerId, targetId, amount);
  if (result.success) {
    broadcastChat(client.lobbyId, 'SYSTEM', `🎲 ${result.bettorName} bet ${result.amount} chips on ${result.targetName} to win the hand!`);
    broadcastGameState(client.lobbyId);
  } else {
    ws.send(JSON.stringify({ type: 'sideBetResult', message: result.message, success: false }));
  }
}

export function handleReveal(msg, ws, clients, lobbyManager, broadcastGameState) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  const lobby = lobbyManager.getLobby(client.lobbyId);
  if (!lobby) return;
  const player = lobby.game.players.find(p => p.id === client.playerId);
  if (player && !lobby.game.handInProgress && lobby.game.winner) {
    player.revealed = true;
    broadcastGameState(client.lobbyId);
  }
}

export function handlePause(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage, clearAllTimers) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  const lobby = lobbyManager.getLobby(client.lobbyId);
  if (!lobby || lobby.game.paused) return;
  lobby.game.pause();
  clearAllTimers(client.lobbyId, clients);
  broadcastGameState(client.lobbyId);
  broadcastSystemMessage(client.lobbyId, `⏸️ Game paused by ${client.name}.`);
}

export function handleResume(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage, ensureTurnTimer) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  const lobby = lobbyManager.getLobby(client.lobbyId);
  if (!lobby || !lobby.game.paused) return;
  lobby.game.resume();
  broadcastGameState(client.lobbyId);
  broadcastSystemMessage(client.lobbyId, `▶️ Game resumed by ${client.name}.`);
  if (lobby.game.waitingForAction) {
    ensureTurnTimer(client.lobbyId, lobbyManager, clients, broadcastGameState);
  }
}