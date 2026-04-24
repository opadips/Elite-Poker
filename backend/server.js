// server.js
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
const clients = new Map();

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
  const chatMsg = JSON.stringify({ type: 'chat', sender: senderName, message, timestamp: Date.now() });
  for (const [ws] of clients.entries()) {
    if (ws.readyState === 1) ws.send(chatMsg);
  }
}

function broadcastAchievement(achievement) {
  const achMsg = JSON.stringify({ type: 'achievement', ...achievement });
  for (const [ws] of clients.entries()) {
    if (ws.readyState === 1) ws.send(achMsg);
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
  if (game.paused) return;
  clearTimer(ws);
  const client = clients.get(ws);
  if (!client) return;

  const timeoutId = setTimeout(() => {
    if (game.paused) return;
    const player = game.players.find(p => p.id === playerId);
    if (!player || player.folded || player.isAllIn) return;
    const currentTurnPlayer = game.getState().currentPlayerId;
    if (currentTurnPlayer !== playerId) return;

    const toCall = game.currentBet - player.currentBet;
    if (toCall === 0) {
      console.log(`⏰ Timeout (20s): ${player.name} auto-check`);
      game.playerAction(playerId, 'check');
    } else {
      console.log(`⏰ Timeout (20s): ${player.name} auto-fold`);
      game.playerAction(playerId, 'fold');
    }
    broadcastGameState();
    client.timeoutId = null;
  }, 20000);

  client.timeoutId = timeoutId;
}

function clearAllTimers() {
  for (const [ws, client] of clients.entries()) {
    if (client.timeoutId) {
      clearTimeout(client.timeoutId);
      client.timeoutId = null;
    }
  }
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
        const playerId = game.addPlayer(name.trim(), true);
        clients.set(ws, { playerId, name: name.trim(), timeoutId: null });
        ws.send(JSON.stringify({ type: 'joined', playerId }));
        broadcastGameState();
        broadcastSystemMessage(`✨ ${name.trim()} joined as spectator!`);
      }
      else if (msg.type === 'sitIn') {
        const client = clients.get(ws);
        if (!client) return;
        const result = game.sitIn(client.playerId);
        if (result.success) {
          ws.send(JSON.stringify({ type: 'sitInSuccess' }));
          broadcastSystemMessage(`🎮 ${client.name} sat in the game!`);
          broadcastGameState();
        } else {
          ws.send(JSON.stringify({ type: 'error', message: result.message }));
        }
      }
      else if (msg.type === 'resetLobby') {
        game.resetLobby();
        clearAllTimers();
        broadcastGameState();
        broadcastSystemMessage(`🔄 Lobby has been reset by admin. All players restarted.`);
      }
      else if (msg.type === 'action') {
        if (game.paused) return;
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
          broadcastGameState();
          if (game.handInProgress === false && game.getActivePlayers().length >= 2 && game.getActivePlayers().every(p => p.ready)) {
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
        if (game.paused) return;
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
      else if (msg.type === 'pause') {
        if (!game.paused) {
          game.pause();
          clearAllTimers();
          broadcastGameState();
          broadcastSystemMessage('⏸️ Game paused by a player.');
        }
      }
      else if (msg.type === 'resume') {
        if (game.paused) {
          game.resume();
          if (game.waitingForAction) {
            const currentId = game.getState().currentPlayerId;
            const targetWs = [...clients.entries()].find(([_, c]) => c.playerId === currentId)?.[0];
            if (targetWs) {
              setAutoActionTimer(targetWs, currentId);
            }
          }
          broadcastGameState();
          broadcastSystemMessage('▶️ Game resumed.');
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

let lastWinnerMessage = null;
let lastSideBetMessage = null;
setInterval(() => {
  const state = game.getState();
  if (state.winner && state.winner !== lastWinnerMessage) {
    lastWinnerMessage = state.winner;
    const totalWinning = state.winner.winnings;
    const hand = state.winner.handName;
    const winnerNames = state.winner.names;
    broadcastChat('SYSTEM', `🏆 ${winnerNames} won ${totalWinning} chips with ${hand}! 🏆`);

    const newAchievements = game.checkAchievements();
    for (const ach of newAchievements) {
      broadcastAchievement(ach);
      broadcastSystemMessage(`🎖️ ${ach.playerName} earned: ${ach.name} – ${ach.desc}`);
    }
  }
  if (state.sideBetResults && state.sideBetResults !== lastSideBetMessage) {
    lastSideBetMessage = state.sideBetResults;
    for (let res of state.sideBetResults) {
      const totalWin = res.amount + res.profit;
      broadcastChat('SYSTEM', `🎉 ${res.bettorName} won ${totalWin} chips from side bet on ${res.targetName}! 🎉`);
      broadcastSideBetWin(res.bettorName, res.targetName, res.amount, res.profit);
    }
  }
}, 500);

setInterval(broadcastGameState, 2000);

server.listen(3000, '0.0.0.0', () => {
  console.log('✅ Poker server running on ws://0.0.0.0:3000');
});