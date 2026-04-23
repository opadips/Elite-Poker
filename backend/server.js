import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import { Game } from './game/Game.js';

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const game = new Game();
const clients = new Map(); // ws -> { playerId, name, timeoutId }

function broadcastGameState() {
  const state = game.getState();
  const msg = JSON.stringify({ type: 'gameState', state });
  for (const [ws] of clients.entries()) {
    if (ws.readyState === 1) ws.send(msg);
  }
}

function broadcastSystemMessage(message) {
  const msg = JSON.stringify({ type: 'system', text: message });
  for (const [ws] of clients.entries()) {
    if (ws.readyState === 1) ws.send(msg);
  }
}

function broadcastChat(senderName, message) {
  const chatMsg = JSON.stringify({ type: 'chat', sender: senderName, message: message, timestamp: Date.now() });
  for (const [ws] of clients.entries()) {
    if (ws.readyState === 1) ws.send(chatMsg);
  }
}

function broadcastSideBetWin(bettorName, targetName, amount, profit) {
  const winMsg = JSON.stringify({ type: 'sideBetWin', bettorName, targetName, amount, profit });
  for (const [ws] of clients.entries()) {
    if (ws.readyState === 1) ws.send(winMsg);
  }
}

function clearTimer(ws) {
  const client = clients.get(ws);
  if (client?.timeoutId) {
    clearTimeout(client.timeoutId);
    client.timeoutId = null;
  }
}

function setAutoActionTimer(ws, playerId) {
  clearTimer(ws);
  const client = clients.get(ws);
  if (!client) return;
  
  const timeoutId = setTimeout(() => {
    const player = game.players.find(p => p.id === playerId);
    if (!player || player.folded || player.isAllIn) return;
    const currentTurnPlayer = game.getState().currentPlayerId;
    if (currentTurnPlayer !== playerId) return;
    
    const toCall = game.currentBet - player.currentBet;
    if (toCall === 0) {
      console.log(`⏰ Timeout: ${player.name} auto-check`);
      game.playerAction(playerId, 'check');
    } else {
      console.log(`⏰ Timeout: ${player.name} auto-fold`);
      game.playerAction(playerId, 'fold');
    }
    broadcastGameState();
    client.timeoutId = null;
  }, 15000);
  
  client.timeoutId = timeoutId;
}

wss.on('connection', (ws) => {
  console.log('Client connected');
  
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
        const playerId = game.addPlayer(name.trim());
        clients.set(ws, { playerId, name: name.trim(), timeoutId: null });
        ws.send(JSON.stringify({ type: 'joined', playerId }));
        broadcastGameState();
        broadcastSystemMessage(`✨ ${name.trim()} joined the table!`);
      }
      else if (msg.type === 'action') {
        const client = clients.get(ws);
        if (!client) return;
        const { action, amount } = msg;
        setAutoActionTimer(ws, client.playerId);
        game.playerAction(client.playerId, action, amount);
        broadcastGameState();
      }
      else if (msg.type === 'ready') {
        const client = clients.get(ws);
        if (!client) return;
        const result = game.toggleReady(client.playerId);
        if (result.success) {
          broadcastGameState(); // وضعیت جدید ready را پخش می‌کند
          if (game.handInProgress === false && game.players.length >= 2 && game.players.every(p => p.ready)) {
            broadcastSystemMessage('All players ready! Game starting...');
            broadcastGameState();
          }
        } else {
          ws.send(JSON.stringify({ type: 'error', message: result.message }));
        }
      }
      else if (msg.type === 'toggleBeginner') {
        const client = clients.get(ws);
        if (client) {
          broadcastSystemMessage(`🐶 noob sag detected ${client.name}`);
        }
      }
      else if (msg.type === 'chat') {
        const client = clients.get(ws);
        if (client && msg.message && msg.message.trim()) {
          broadcastChat(client.name, msg.message.substring(0, 200));
        }
      }
      else if (msg.type === 'sideBet') {
        const client = clients.get(ws);
        if (!client) return;
        const { targetId, amount } = msg;
        const result = game.placeSideBet(client.playerId, targetId, amount);
        if (result.success) {
          broadcastChat('SYSTEM', `🎲 ${result.bettorName} bet ${result.amount} chips on ${result.targetName} to win the hand!`);
          broadcastGameState();
        } else {
          ws.send(JSON.stringify({ type: 'sideBetResult', message: result.message, success: false }));
        }
      }
    } catch (err) {
      console.error('Error parsing message:', err);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
    }
  });
  
  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      clearTimer(ws);
      game.removePlayer(client.playerId);
      broadcastGameState();
      broadcastSystemMessage(`❌ ${client.name} left the table.`);
    }
    clients.delete(ws);
  });
});

let previousWinner = null;
setInterval(() => {
  const state = game.getState();
  if (state.winner && state.winner !== previousWinner) {
    if (state.sideBetResults && state.sideBetResults.length > 0) {
      for (let res of state.sideBetResults) {
        const totalWin = res.amount + res.profit;
        broadcastChat('SYSTEM', `🎉 ${res.bettorName} won ${totalWin} chips from side bet on ${res.targetName}!`);
        broadcastSideBetWin(res.bettorName, res.targetName, res.amount, res.profit);
      }
    }
    previousWinner = state.winner;
  }
}, 500);

setInterval(broadcastGameState, 2000);

server.listen(3000, '0.0.0.0', () => {
  console.log('✅ Poker server running on ws://0.0.0.0:3000');
});