import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import { LobbyManager } from './LobbyManager.js';
import { ClientRegistry } from './ClientRegistry.js';
import { createMessageRouter } from './MessageRouter.js';
import { BroadcastScheduler } from './BroadcastScheduler.js';
import * as timerUtils from './utils/timerUtils.js';

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const lobbyManager = new LobbyManager();
const clientRegistry = new ClientRegistry();
const generalChat = [];

timerUtils.setTurnTimerRefs({ lobbyManager, clientRegistry, broadcastGameState });

function broadcastGameState(lobbyId) {
  const lobby = lobbyManager.getLobby(lobbyId);
  if (!lobby) return;
  const state = lobby.game.getState();
  const msg = JSON.stringify({ type: 'gameState', state });
  clientRegistry.forEach((ws, client) => {
    if (client.lobbyId === lobbyId && ws.readyState === 1) ws.send(msg);
  });
}

function broadcastSystemMessage(lobbyId, message) {
  const msg = JSON.stringify({ type: 'system', text: message });
  clientRegistry.forEach((ws, client) => {
    if (client.lobbyId === lobbyId && ws.readyState === 1) ws.send(msg);
  });
}

function broadcastChat(lobbyId, senderName, message) {
  const chatMsg = JSON.stringify({ type: 'chat', sender: senderName, message, timestamp: Date.now() });
  lobbyManager.addChatMessage(lobbyId, senderName, message);
  clientRegistry.forEach((ws, client) => {
    if (client.lobbyId === lobbyId && ws.readyState === 1) ws.send(chatMsg);
  });
}

function broadcastGeneralChat(senderName, message) {
  const chatMsg = JSON.stringify({ type: 'chat', sender: senderName, message, timestamp: Date.now() });
  generalChat.push({ sender: senderName, message, timestamp: Date.now() });
  if (generalChat.length > 200) generalChat.shift();
  clientRegistry.forEach((ws, client) => {
    if (!client.lobbyId && ws.readyState === 1) ws.send(chatMsg);
  });
}

function broadcastOnlinePlayers() {
  const online = [];
  clientRegistry.forEach((ws, client) => {
    if (!client.lobbyId && ws.readyState === 1) online.push(client.name);
  });
  const msg = JSON.stringify({ type: 'onlinePlayers', players: online });
  clientRegistry.forEach((ws, client) => {
    if (!client.lobbyId && ws.readyState === 1) ws.send(msg);
  });
}

function broadcastAchievement(lobbyId, achievement) {
  const achMsg = JSON.stringify({ type: 'achievement', ...achievement });
  clientRegistry.forEach((ws, client) => {
    if (client.lobbyId === lobbyId && ws.readyState === 1) ws.send(achMsg);
  });
}

function broadcastSideBetWin(lobbyId, bettorName, targetName, amount, profit) {
  const winMsg = JSON.stringify({ type: 'sideBetWin', bettorName, targetName, amount, profit });
  clientRegistry.forEach((ws, client) => {
    if (client.lobbyId === lobbyId && ws.readyState === 1) ws.send(winMsg);
  });
}

function broadcastAllInSound(lobbyId) {
  const msg = JSON.stringify({ type: 'allInSound' });
  clientRegistry.forEach((ws, client) => {
    if (client.lobbyId === lobbyId && ws.readyState === 1) ws.send(msg);
  });
}

function setupLobbyCallbacks(lobbyId) {
  const lobby = lobbyManager.getLobby(lobbyId);
  if (!lobby) return;
  lobby.game.onStateChange = () => {
    broadcastGameState(lobbyId);
    timerUtils.ensureTurnTimer(lobbyId, lobbyManager, clientRegistry, broadcastGameState);
  };
}

function broadcastLobbyList() {
  const list = lobbyManager.getLobbyList();
  const msg = JSON.stringify({ type: 'lobbyList', lobbies: list });
  clientRegistry.forEach((ws, client) => {
    if (!client.lobbyId && ws.readyState === 1) ws.send(msg);
  });
}

const messageRouter = createMessageRouter({
  lobbyManager,
  clientRegistry,
  broadcastGameState,
  broadcastSystemMessage,
  broadcastChat,
  broadcastGeneralChat,
  broadcastOnlinePlayers,
  broadcastLobbyList,
  broadcastAchievement,
  broadcastSideBetWin,
  broadcastAllInSound,
  setupLobbyCallbacks,
  generalChat,
  timerUtils,
});

const scheduler = new BroadcastScheduler(lobbyManager, clientRegistry, {
  broadcastGameState,
  broadcastChat,
  broadcastSystemMessage,
  broadcastAchievement,
  broadcastSideBetWin,
  broadcastLobbyList,
  broadcastOnlinePlayers,
}, timerUtils);

scheduler.start();

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      messageRouter(msg, ws);
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
    }
  });

  ws.on('close', () => {
    const client = clientRegistry.get(ws);
    if (client) {
      if (client.lobbyId) {
        lobbyManager.leaveLobby(client.lobbyId, client.playerId);
        broadcastGameState(client.lobbyId);
        broadcastSystemMessage(client.lobbyId, `❌ ${client.name} left the table.`);
        timerUtils.clearAllTimers(client.lobbyId, clientRegistry);
      }
      timerUtils.clearTimer(ws, clientRegistry);
      clientRegistry.remove(ws);
      broadcastLobbyList();
      broadcastOnlinePlayers();
    }
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('✅ Poker server running on ws://0.0.0.0:3000');
});