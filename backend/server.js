import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import { LobbyManager } from './LobbyManager.js';

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const lobbyManager = new LobbyManager();
const clients = new Map();

const lobbyTimers = new Map();
const generalChat = [];

function broadcastGameState(lobbyId) {
  const lobby = lobbyManager.getLobby(lobbyId);
  if (!lobby) return;
  const state = lobby.game.getState();
  const msg = JSON.stringify({ type: 'gameState', state });
  for (const [ws, client] of clients.entries()) {
    if (client.lobbyId === lobbyId && ws.readyState === 1) {
      ws.send(msg);
    }
  }
}

function broadcastSystemMessage(lobbyId, message) {
  const msg = JSON.stringify({ type: 'system', text: message });
  for (const [ws, client] of clients.entries()) {
    if (client.lobbyId === lobbyId && ws.readyState === 1) {
      ws.send(msg);
    }
  }
}

function broadcastChat(lobbyId, senderName, message) {
  const chatMsg = JSON.stringify({ type: 'chat', sender: senderName, message, timestamp: Date.now() });
  lobbyManager.addChatMessage(lobbyId, senderName, message);
  for (const [ws, client] of clients.entries()) {
    if (client.lobbyId === lobbyId && ws.readyState === 1) {
      ws.send(chatMsg);
    }
  }
}

function broadcastGeneralChat(senderName, message) {
  const chatMsg = JSON.stringify({ type: 'chat', sender: senderName, message, timestamp: Date.now() });
  generalChat.push({ sender: senderName, message, timestamp: Date.now() });
  if (generalChat.length > 200) generalChat.shift();
  for (const [ws, client] of clients.entries()) {
    if (!client.lobbyId && ws.readyState === 1) {
      ws.send(chatMsg);
    }
  }
}

function broadcastOnlinePlayers() {
  const online = [];
  for (const [ws, client] of clients.entries()) {
    if (!client.lobbyId && ws.readyState === 1) {
      online.push(client.name);
    }
  }
  const msg = JSON.stringify({ type: 'onlinePlayers', players: online });
  for (const [ws, client] of clients.entries()) {
    if (!client.lobbyId && ws.readyState === 1) {
      ws.send(msg);
    }
  }
}

function broadcastAchievement(lobbyId, achievement) {
  const achMsg = JSON.stringify({ type: 'achievement', ...achievement });
  for (const [ws, client] of clients.entries()) {
    if (client.lobbyId === lobbyId && ws.readyState === 1) {
      ws.send(achMsg);
    }
  }
}

function broadcastSideBetWin(lobbyId, bettorName, targetName, amount, profit) {
  const winMsg = JSON.stringify({ type: 'sideBetWin', bettorName, targetName, amount, profit });
  for (const [ws, client] of clients.entries()) {
    if (client.lobbyId === lobbyId && ws.readyState === 1) {
      ws.send(winMsg);
    }
  }
}

function broadcastAllInSound(lobbyId) {
  const msg = JSON.stringify({ type: 'allInSound' });
  for (const [ws, client] of clients.entries()) {
    if (client.lobbyId === lobbyId && ws.readyState === 1) {
      ws.send(msg);
    }
  }
}

function broadcastTurnTimer(lobbyId) {
  const timerData = lobbyTimers.get(lobbyId);
  if (!timerData || !timerData.turnStartTime) return;
  const lobby = lobbyManager.getLobby(lobbyId);
  if (!lobby || lobby.game.paused) return;
  const elapsed = (Date.now() - timerData.turnStartTime) / 1000;
  const remaining = Math.max(0, 20 - elapsed);
  const currentPlayerId = lobby.game.getState().currentPlayerId;
  const msg = JSON.stringify({ type: 'turnTimer', remaining, currentPlayerId });
  for (const [ws, client] of clients.entries()) {
    if (client.lobbyId === lobbyId && ws.readyState === 1) {
      ws.send(msg);
    }
  }
  if (remaining <= 0) {
    stopTurnTimerBroadcast(lobbyId);
  }
}

function startTurnTimerBroadcast(lobbyId, playerId) {
  stopTurnTimerBroadcast(lobbyId);
  lobbyTimers.set(lobbyId, {
    turnStartTime: Date.now(),
    lastTurnPlayerId: playerId,
    interval: setInterval(() => broadcastTurnTimer(lobbyId), 500),
  });
}

function stopTurnTimerBroadcast(lobbyId) {
  const timerData = lobbyTimers.get(lobbyId);
  if (timerData) {
    if (timerData.interval) clearInterval(timerData.interval);
    lobbyTimers.delete(lobbyId);
  }
}

function clearTimer(ws) {
  const client = clients.get(ws);
  if (client?.timeoutId) {
    clearTimeout(client.timeoutId);
    client.timeoutId = null;
  }
}

function setAutoActionTimer(ws, playerId, lobbyId) {
  const lobby = lobbyManager.getLobby(lobbyId);
  if (!lobby || lobby.game.paused) return;
  clearTimer(ws);
  const client = clients.get(ws);
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

function clearAllTimers(lobbyId) {
  for (const [ws, client] of clients.entries()) {
    if (client.lobbyId === lobbyId && client.timeoutId) {
      clearTimeout(client.timeoutId);
      client.timeoutId = null;
    }
  }
  stopTurnTimerBroadcast(lobbyId);
}

function ensureTurnTimer(lobbyId) {
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
    const targetWs = [...clients.entries()].find(([_, c]) => c.playerId === currentId && c.lobbyId === lobbyId)?.[0];
    if (targetWs) {
      setAutoActionTimer(targetWs, currentId, lobbyId);
    } else {
      startTurnTimerBroadcast(lobbyId, currentId);
    }
  }
}

function setupLobbyCallbacks(lobbyId) {
  const lobby = lobbyManager.getLobby(lobbyId);
  if (!lobby) return;
  lobby.game.onStateChange = () => {
    broadcastGameState(lobbyId);
    ensureTurnTimer(lobbyId);
  };
}

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'join') {
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
      else if (msg.type === 'createLobby') {
        const client = clients.get(ws);
        if (!client) return;
        const settings = msg.settings || {};
        const lobbyId = lobbyManager.createLobby(client.playerId, settings);
        const joinResult = lobbyManager.joinLobby(lobbyId, client.playerId, client.name, settings.password);
        if (joinResult.success) {
          client.lobbyId = lobbyId;
          ws.send(JSON.stringify({ type: 'lobbyCreated', lobbyId, isAdmin: true }));
          setupLobbyCallbacks(lobbyId);
          broadcastGameState(lobbyId);
          broadcastSystemMessage(lobbyId, `${client.name} created the lobby.`);
          broadcastLobbyList();
          broadcastOnlinePlayers();
        } else {
          lobbyManager.removeLobby(lobbyId);
          ws.send(JSON.stringify({ type: 'error', message: joinResult.message }));
        }
      }
      else if (msg.type === 'joinLobby') {
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
          broadcastGameState(lobbyId);
          broadcastSystemMessage(lobbyId, `${client.name} joined the table.`);
          broadcastLobbyList();
          broadcastOnlinePlayers();
        } else if (joinResult.waitlisted) {
          ws.send(JSON.stringify({ type: 'waitlisted', lobbyId }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: joinResult.message }));
        }
      }
      else if (msg.type === 'leaveLobby') {
        const client = clients.get(ws);
        if (!client || !client.lobbyId) return;
        lobbyManager.leaveLobby(client.lobbyId, client.playerId);
        broadcastSystemMessage(client.lobbyId, `${client.name} left the table.`);
        broadcastGameState(client.lobbyId);
        client.lobbyId = null;
        ws.send(JSON.stringify({ type: 'leftLobby' }));
        broadcastLobbyList();
        broadcastOnlinePlayers();
      }
      else if (msg.type === 'returnToLobby') {
        const client = clients.get(ws);
        if (!client || !client.lobbyId) return;
        clearAllTimers(client.lobbyId);
        lobbyManager.leaveLobby(client.lobbyId, client.playerId);
        broadcastGameState(client.lobbyId);
        broadcastSystemMessage(client.lobbyId, `${client.name} left the table.`);
        client.lobbyId = null;
        ws.send(JSON.stringify({ type: 'leftLobby' }));
        broadcastLobbyList();
        broadcastOnlinePlayers();
      }
      else if (msg.type === 'listLobbies') {
        broadcastLobbyList();
        broadcastOnlinePlayers();
      }
      else if (msg.type === 'lobbyChat') {
        const client = clients.get(ws);
        if (client && msg.message && msg.message.trim()) {
          broadcastGeneralChat(client.name, msg.message.substring(0, 200));
        }
      }
      else if (msg.type === 'resetLobby') {
        const client = clients.get(ws);
        if (!client || !client.lobbyId) return;
        if (!lobbyManager.isAdmin(client.lobbyId, client.playerId)) {
          ws.send(JSON.stringify({ type: 'error', message: 'Only admin can reset' }));
          return;
        }
        const lobby = lobbyManager.getLobby(client.lobbyId);
        if (lobby) {
          lobby.game.resetLobby();
          clearAllTimers(client.lobbyId);
          broadcastGameState(client.lobbyId);
          broadcastSystemMessage(client.lobbyId, `🔄 Lobby reset by ${client.name}.`);
        }
      }
      else if (msg.type === 'action') {
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
          ensureTurnTimer(client.lobbyId);
        }
      }
      else if (msg.type === 'ready') {
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
       else if (msg.type === 'sitIn') {
         const client = clients.get(ws);
         if (!client || !client.lobbyId) return;
         const lobby = lobbyManager.getLobby(client.lobbyId);
         if (!lobby) return;
         const result = lobby.game.sitIn(client.playerId);
         if (result.success) {
           const player = lobby.game.players.find(p => p.id === client.playerId);
           if (player) player.chips = lobby.settings.startingChips;
           broadcastSystemMessage(client.lobbyId, `${client.name} sat in the game!`);
           broadcastGameState(client.lobbyId);
        } else {
          ws.send(JSON.stringify({ type: 'error', message: result.message }));
        }
      }
      else if (msg.type === 'toggleBeginner') {
        const client = clients.get(ws);
        if (client && client.lobbyId) {
          broadcastSystemMessage(client.lobbyId, `🐶 noob sag detected ${client.name}`);
        }
      }
      else if (msg.type === 'chat') {
        const client = clients.get(ws);
        if (client && client.lobbyId && msg.message && msg.message.trim()) {
          broadcastChat(client.lobbyId, client.name, msg.message.substring(0, 200));
        }
      }
      else if (msg.type === 'sideBet') {
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
      else if (msg.type === 'reveal') {
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
      else if (msg.type === 'pause') {
        const client = clients.get(ws);
        if (!client || !client.lobbyId) return;
        const lobby = lobbyManager.getLobby(client.lobbyId);
        if (!lobby || lobby.game.paused) return;
        lobby.game.pause();
        clearAllTimers(client.lobbyId);
        broadcastGameState(client.lobbyId);
        broadcastSystemMessage(client.lobbyId, `⏸️ Game paused by ${client.name}.`);
      }
      else if (msg.type === 'resume') {
        const client = clients.get(ws);
        if (!client || !client.lobbyId) return;
        const lobby = lobbyManager.getLobby(client.lobbyId);
        if (!lobby || !lobby.game.paused) return;
        lobby.game.resume();
        broadcastGameState(client.lobbyId);
        broadcastSystemMessage(client.lobbyId, `▶️ Game resumed by ${client.name}.`);
        if (lobby.game.waitingForAction) {
          ensureTurnTimer(client.lobbyId);
        }
      }
      else if (msg.type === 'kickPlayer') {
        const client = clients.get(ws);
        if (!client || !client.lobbyId) return;
        const { targetId } = msg;
        const result = lobbyManager.kickPlayer(client.lobbyId, targetId, client.playerId);
        if (result.success) {
          broadcastSystemMessage(client.lobbyId, `${client.name} kicked a player.`);
          broadcastGameState(client.lobbyId);
          broadcastLobbyList();
          broadcastOnlinePlayers();
        } else {
          ws.send(JSON.stringify({ type: 'error', message: result.message }));
        }
      }
      else if (msg.type === 'setPassword') {
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
      else if (msg.type === 'getHandHistory') {
        const client = clients.get(ws);
        if (!client || !client.lobbyId) return;
        const history = lobbyManager.getHandHistory(client.lobbyId);
        ws.send(JSON.stringify({ type: 'handHistory', history }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      if (client.lobbyId) {
        lobbyManager.leaveLobby(client.lobbyId, client.playerId);
        broadcastGameState(client.lobbyId);
        broadcastSystemMessage(client.lobbyId, `❌ ${client.name} left the table.`);
        clearAllTimers(client.lobbyId);
      }
      clearTimer(ws);
      clients.delete(ws);
      broadcastLobbyList();
      broadcastOnlinePlayers();
    }
  });
});

let lastWinnerMessageMap = new Map();
let lastSideBetMessageMap = new Map();

function broadcastLobbyList() {
  const list = lobbyManager.getLobbyList();
  const msg = JSON.stringify({ type: 'lobbyList', lobbies: list });
  for (const [ws, client] of clients.entries()) {
    if (!client.lobbyId && ws.readyState === 1) {
      ws.send(msg);
    }
  }
}

setInterval(() => {
  for (const [lobbyId, lobby] of lobbyManager.lobbies.entries()) {
    const state = lobby.game.getState();
    const lastWinner = lastWinnerMessageMap.get(lobbyId);
    if (state.winner && state.winner !== lastWinner) {
      lastWinnerMessageMap.set(lobbyId, state.winner);
      const totalWinning = state.winner.winnings;
      const hand = state.winner.handName;
      const winnerNames = state.winner.names;
      broadcastChat(lobbyId, 'SYSTEM', `🏆 ${winnerNames} won ${totalWinning} chips with ${hand}! 🏆`);
      broadcastSystemMessage(lobbyId, `🏆 ${winnerNames} wins with ${hand}!`);

      const newAchievements = lobby.game.checkAchievements();
      for (const ach of newAchievements) {
        broadcastAchievement(lobbyId, ach);
        broadcastSystemMessage(lobbyId, `🎖️ ${ach.playerName} earned: ${ach.name} – ${ach.desc}`);
      }

      const historyEntry = `Hand: ${state.winner.handName} - Winner: ${winnerNames} (Pot: ${totalWinning})`;
      lobbyManager.addHandHistory(lobbyId, historyEntry);
    }

    const lastSide = lastSideBetMessageMap.get(lobbyId);
    if (state.sideBetResults && state.sideBetResults !== lastSide) {
      lastSideBetMessageMap.set(lobbyId, state.sideBetResults);
      for (let res of state.sideBetResults) {
        const totalWin = res.amount + res.profit;
        broadcastChat(lobbyId, 'SYSTEM', `🎉 ${res.bettorName} won ${totalWin} chips from side bet on ${res.targetName}! 🎉`);
        broadcastSystemMessage(lobbyId, `🎲 Side bet: ${res.bettorName} won ${totalWin} chips (bet on ${res.targetName})`);
        broadcastSideBetWin(lobbyId, res.bettorName, res.targetName, res.amount, res.profit);
      }
    }

    ensureTurnTimer(lobbyId);
  }
}, 500);

setInterval(() => {
  broadcastLobbyList();
  broadcastOnlinePlayers();
  for (const [lobbyId] of lobbyManager.lobbies.entries()) {
    broadcastGameState(lobbyId);
  }
}, 2000);

server.listen(3000, '0.0.0.0', () => {
  console.log('✅ Poker server running on ws://0.0.0.0:3000');
});