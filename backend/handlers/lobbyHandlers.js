import { getDealerMessage } from '../game/dealerMessages.js';

export function handleJoin(msg, ws, clients, broadcastLobbyList, broadcastOnlinePlayers, generalChat) {
  const { name } = msg;
  if (!name || name.trim() === '') {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid name' }));
    return;
  }
  if (name.length > 15) {
    ws.send(JSON.stringify({ type: 'error', message: 'Name too long (max 15 chars)' }));
    return;
  }
  const playerId = `${Date.now()}-${Math.random()}-${name}`;
  clients.set(ws, { playerId, name: name.trim(), lobbyId: null, timeoutId: null });
  ws.send(JSON.stringify({ type: 'joined', playerId }));
  broadcastLobbyList();
  broadcastOnlinePlayers();
  ws.send(JSON.stringify({ type: 'generalChatHistory', messages: generalChat }));
}

export function handleCreateLobby(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage, broadcastLobbyList, broadcastOnlinePlayers, setupLobbyCallbacks) {
  const client = clients.get(ws);
  if (!client) return;
  const settings = msg.settings || {};
  const lobbyId = lobbyManager.createLobby(client.playerId, settings);
  const joinResult = lobbyManager.joinLobby(lobbyId, client.playerId, client.name, settings.password);
  if (joinResult.success) {
    client.lobbyId = lobbyId;
    ws.send(JSON.stringify({ type: 'lobbyCreated', lobbyId, isAdmin: true }));
    setupLobbyCallbacks(lobbyId);
    const dealerMsg = getDealerMessage('lobbyCreated', { name: client.name });
    broadcastGameState(lobbyId, dealerMsg);
    broadcastLobbyList();
    broadcastOnlinePlayers();
  } else {
    lobbyManager.removeLobby(lobbyId);
    ws.send(JSON.stringify({ type: 'error', message: joinResult.message }));
  }
}

export function handleJoinLobby(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage, broadcastLobbyList, broadcastOnlinePlayers, setupLobbyCallbacks) {
  const client = clients.get(ws);
  if (!client) return;
  const { lobbyId, password } = msg;
  const joinResult = lobbyManager.joinLobby(lobbyId, client.playerId, client.name, password);
  if (joinResult.success) {
    if (client.lobbyId) {
      lobbyManager.leaveLobby(client.lobbyId, client.playerId);
    }
    client.lobbyId = lobbyId;
    ws.send(JSON.stringify({ type: 'joinedLobby', lobbyId, isAdmin: lobbyManager.isAdmin(lobbyId, client.playerId) }));
    setupLobbyCallbacks(lobbyId);
    const dealerMsg = getDealerMessage('playerJoined', { name: client.name });
    broadcastGameState(lobbyId, dealerMsg);
    broadcastLobbyList();
    broadcastOnlinePlayers();
  } else if (joinResult.waitlisted) {
    ws.send(JSON.stringify({ type: 'waitlisted', lobbyId }));
  } else {
    ws.send(JSON.stringify({ type: 'error', message: joinResult.message }));
  }
}

export function handleLeaveLobby(ws, clients, lobbyManager, broadcastGameState, broadcastDealerMessage, broadcastLobbyList, broadcastOnlinePlayers) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  lobbyManager.leaveLobby(client.lobbyId, client.playerId);
  const dealerMsg = getDealerMessage('playerLeft', { name: client.name });
  broadcastGameState(client.lobbyId, dealerMsg);
  client.lobbyId = null;
  ws.send(JSON.stringify({ type: 'leftLobby' }));
  broadcastLobbyList();
  broadcastOnlinePlayers();
}

export function handleReturnToLobby(ws, clients, lobbyManager, broadcastGameState, broadcastDealerMessage, broadcastLobbyList, broadcastOnlinePlayers, clearAllTimers) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  clearAllTimers(client.lobbyId, clients);
  lobbyManager.leaveLobby(client.lobbyId, client.playerId);
  const dealerMsg = getDealerMessage('playerLeft', { name: client.name });
  broadcastGameState(client.lobbyId, dealerMsg);
  client.lobbyId = null;
  ws.send(JSON.stringify({ type: 'leftLobby' }));
  broadcastLobbyList();
  broadcastOnlinePlayers();
}

export function handleListLobbies(ws, clients, broadcastLobbyList, broadcastOnlinePlayers) {
  broadcastLobbyList();
  broadcastOnlinePlayers();
}

export function handleLobbyChat(msg, ws, clients, broadcastGeneralChat) {
  const client = clients.get(ws);
  if (client && msg.message && msg.message.trim()) {
    broadcastGeneralChat(client.name, msg.message.substring(0, 200));
  }
}

export function handleKickPlayer(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage, broadcastLobbyList, broadcastOnlinePlayers) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  const { targetId } = msg;
  const result = lobbyManager.kickPlayer(client.lobbyId, targetId, client.playerId);
  if (result.success) {
    const dealerMsg = getDealerMessage('playerKicked', { name: '' });
    broadcastGameState(client.lobbyId, dealerMsg);
    broadcastLobbyList();
    broadcastOnlinePlayers();
  } else {
    ws.send(JSON.stringify({ type: 'error', message: result.message }));
  }
}

export function handleSetPassword(msg, ws, clients, lobbyManager) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  const { password } = msg;
  const result = lobbyManager.setPassword(client.lobbyId, password, client.playerId);
  if (result.success) {
    ws.send(JSON.stringify({ type: 'passwordSet', message: 'Password updated' }));
  } else {
    ws.send(JSON.stringify({ type: 'error', message: result.message }));
  }
}

export function handleGetHandHistory(msg, ws, clients, lobbyManager) {
  const client = clients.get(ws);
  if (!client || !client.lobbyId) return;
  const history = lobbyManager.getHandHistory(client.lobbyId);
  ws.send(JSON.stringify({ type: 'handHistory', history }));
}