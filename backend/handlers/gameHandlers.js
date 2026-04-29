// backend/handlers/gameHandlers.js
import { getDealerMessage } from '../game/dealerMessages.js';

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
    const dealerMsg = getDealerMessage('reset', { name: client.name });
    broadcastGameState(client.lobbyId, dealerMsg);
  }
}

export function handleAction(msg, ws, clients, lobbyManager, broadcastGameState, broadcastAllInSound, stopTurnTimerBroadcast, ensureTurnTimer) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  const lobby = lobbyManager.getLobby(client.lobbyId);
  if (!lobby || lobby.game.paused) return;
  const { action, amount } = msg;
  lobby.game.playerAction(client.playerId, action, amount);

  let dealerMsg = null;
  switch (action) {
    case 'fold':
      dealerMsg = getDealerMessage('fold', { name: client.name });
      break;
    case 'check':
      dealerMsg = getDealerMessage('check', { name: client.name });
      break;
    case 'call':
      dealerMsg = getDealerMessage('call', { name: client.name, amount: amount || 0 });
      break;
    case 'raise':
      dealerMsg = getDealerMessage('raise', { name: client.name, amount: amount || 0 });
      break;
    case 'allin':
      dealerMsg = getDealerMessage('allin', { name: client.name, amount: lobby.game.players.find(p => p.id === client.playerId)?.chips + (lobby.game.currentBet || 0) });
      break;
  }

  if (action === 'allin') {
    broadcastAllInSound(client.lobbyId);
  }
  broadcastGameState(client.lobbyId, dealerMsg);
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
      broadcastSystemMessage(client.lobbyId, getDealerMessage('gameStarted'));
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
    const dealerMsg = getDealerMessage('sitIn', { name: client.name });
    broadcastGameState(client.lobbyId, dealerMsg);
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
    const dealerMsg = getDealerMessage('sideBetPlaced', {
      bettor: result.bettorName,
      target: result.targetName,
      amount: result.amount
    });
    broadcastGameState(client.lobbyId, dealerMsg);
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
  const dealerMsg = getDealerMessage('pause', { name: client.name });
  broadcastGameState(client.lobbyId, dealerMsg);
}

export function handleResume(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage, ensureTurnTimer) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  const lobby = lobbyManager.getLobby(client.lobbyId);
  if (!lobby || !lobby.game.paused) return;
  lobby.game.resume();
  const dealerMsg = getDealerMessage('resume', { name: client.name });
  broadcastGameState(client.lobbyId, dealerMsg);
  if (lobby.game.waitingForAction) {
    ensureTurnTimer(client.lobbyId, lobbyManager, clients, broadcastGameState);
  }
}

export function handlePrivateMessage(msg, ws, clients, lobbyManager) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  const { targetName, message } = msg;
  if (!targetName || !message || !message.trim()) return;
  const senderName = client.name;
  const lobbyId = client.lobbyId;

  let targetClient = null;
  let targetWs = null;
  for (const [sock, cl] of clients.entries()) {
    if (cl.lobbyId === lobbyId && cl.name === targetName) {
      targetClient = cl;
      targetWs = sock;
      break;
    }
  }
  if (!targetClient) {
    ws.send(JSON.stringify({ type: 'error', message: 'Player not found' }));
    return;
  }

  const now = Date.now();
  const privateMsg = JSON.stringify({
    type: 'privateMessage',
    sender: senderName,
    message: message.substring(0, 200),
    timestamp: now,
  });
  if (targetWs.readyState === 1) targetWs.send(privateMsg);

  const senderMsg = JSON.stringify({
    type: 'privateMessage',
    sender: 'You',
    target: targetName,
    message: message.substring(0, 200),
    timestamp: now,
    sent: true,
  });
  if (ws.readyState === 1) ws.send(senderMsg);
}