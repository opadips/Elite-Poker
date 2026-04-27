import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import { LobbyManager } from './LobbyManager.js';
import * as lobbyHandlers from './handlers/lobbyHandlers.js';
import * as gameHandlers from './handlers/gameHandlers.js';
import * as timerUtils from './utils/timerUtils.js';

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const lobbyManager = new LobbyManager();
const clients = new Map();

const generalChat = [];

timerUtils.setTurnTimerRefs({ lobbyManager, clients, broadcastGameState });

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

function setupLobbyCallbacks(lobbyId) {
  const lobby = lobbyManager.getLobby(lobbyId);
  if (!lobby) return;
  lobby.game.onStateChange = () => {
    broadcastGameState(lobbyId);
    timerUtils.ensureTurnTimer(lobbyId, lobbyManager, clients, broadcastGameState);
  };
}

function broadcastLobbyList() {
  const list = lobbyManager.getLobbyList();
  const msg = JSON.stringify({ type: 'lobbyList', lobbies: list });
  for (const [ws, client] of clients.entries()) {
    if (!client.lobbyId && ws.readyState === 1) {
      ws.send(msg);
    }
  }
}

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'join') {
        lobbyHandlers.handleJoin(msg, ws, clients, broadcastLobbyList, broadcastOnlinePlayers, generalChat);
      }
      else if (msg.type === 'createLobby') {
        lobbyHandlers.handleCreateLobby(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage, broadcastLobbyList, broadcastOnlinePlayers, setupLobbyCallbacks);
      }
      else if (msg.type === 'joinLobby') {
        lobbyHandlers.handleJoinLobby(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage, broadcastLobbyList, broadcastOnlinePlayers, setupLobbyCallbacks);
      }
      else if (msg.type === 'leaveLobby') {
        lobbyHandlers.handleLeaveLobby(ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage, broadcastLobbyList, broadcastOnlinePlayers);
      }
      else if (msg.type === 'returnToLobby') {
        lobbyHandlers.handleReturnToLobby(ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage, broadcastLobbyList, broadcastOnlinePlayers, timerUtils.clearAllTimers);
      }
      else if (msg.type === 'listLobbies') {
        lobbyHandlers.handleListLobbies(ws, clients, broadcastLobbyList, broadcastOnlinePlayers);
      }
      else if (msg.type === 'lobbyChat') {
        lobbyHandlers.handleLobbyChat(msg, ws, clients, broadcastGeneralChat);
      }
      else if (msg.type === 'resetLobby') {
        gameHandlers.handleResetLobby(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage, timerUtils.clearAllTimers);
      }
      else if (msg.type === 'action') {
        gameHandlers.handleAction(msg, ws, clients, lobbyManager, broadcastGameState, broadcastAllInSound, timerUtils.stopTurnTimerBroadcast, timerUtils.ensureTurnTimer);
      }
      else if (msg.type === 'ready') {
        gameHandlers.handleReady(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage);
      }
      else if (msg.type === 'sitIn') {
        gameHandlers.handleSitIn(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage);
      }
      else if (msg.type === 'toggleBeginner') {
        gameHandlers.handleToggleBeginner(msg, ws, clients, broadcastSystemMessage);
      }
      else if (msg.type === 'chat') {
        gameHandlers.handleChat(msg, ws, clients, broadcastChat);
      }
      else if (msg.type === 'sideBet') {
        gameHandlers.handleSideBet(msg, ws, clients, lobbyManager, broadcastChat, broadcastGameState);
      }
      else if (msg.type === 'reveal') {
        gameHandlers.handleReveal(msg, ws, clients, lobbyManager, broadcastGameState);
      }
      else if (msg.type === 'pause') {
        gameHandlers.handlePause(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage, timerUtils.clearAllTimers);
      }
      else if (msg.type === 'resume') {
        gameHandlers.handleResume(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage, timerUtils.ensureTurnTimer);
      }
      else if (msg.type === 'kickPlayer') {
        lobbyHandlers.handleKickPlayer(msg, ws, clients, lobbyManager, broadcastGameState, broadcastSystemMessage, broadcastLobbyList, broadcastOnlinePlayers);
      }
      else if (msg.type === 'setPassword') {
        lobbyHandlers.handleSetPassword(msg, ws, clients, lobbyManager);
      }
      else if (msg.type === 'getHandHistory') {
        lobbyHandlers.handleGetHandHistory(msg, ws, clients, lobbyManager);
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
        timerUtils.clearAllTimers(client.lobbyId, clients);
      }
      timerUtils.clearTimer(ws, clients);
      clients.delete(ws);
      broadcastLobbyList();
      broadcastOnlinePlayers();
    }
  });
});

let lastWinnerMessageMap = new Map();
let lastSideBetMessageMap = new Map();

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

    timerUtils.ensureTurnTimer(lobbyId, lobbyManager, clients, broadcastGameState);
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