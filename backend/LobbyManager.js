import { Game } from './game/Game.js';
import { Player } from './game/Player.js';

export class LobbyManager {
  constructor() {
    this.lobbies = new Map();
    this.lobbyChat = new Map();
  }

  createLobby(adminId, settings = {}) {
    const lobbyId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const game = new Game();
    const lobby = {
      id: lobbyId,
      game,
      adminId,
      settings: {
        name: settings.name || 'New Table',
        description: settings.description || '',
        password: settings.password || null,
        startingChips: Math.min(parseInt(settings.startingChips) || 1000, 1000000),
        smallBlind: settings.smallBlind || 10,
        bigBlind: settings.bigBlind || 20,
        mode: settings.mode || 'tournament',
      },
      players: new Map(),
      waitingList: [],
      handHistory: [],
      createdAt: Date.now(),
    };
    lobby.game.smallBlind = lobby.settings.smallBlind;
    lobby.game.bigBlind = lobby.settings.bigBlind;
    lobby.game.startingChips = lobby.settings.startingChips;
    lobby.game.mode = lobby.settings.mode;
    this.lobbies.set(lobbyId, lobby);
    this.lobbyChat.set(lobbyId, []);
    return lobbyId;
  }

  removeLobby(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    if (lobby) {
      if (lobby.game._nextHandTimer) clearTimeout(lobby.game._nextHandTimer);
      this.lobbies.delete(lobbyId);
      this.lobbyChat.delete(lobbyId);
    }
  }

  getLobby(lobbyId) {
    return this.lobbies.get(lobbyId);
  }

  getLobbyList() {
    const list = [];
    for (const [id, lobby] of this.lobbies.entries()) {
      list.push({
        id,
        name: lobby.settings.name,
        description: lobby.settings.description,
        playerCount: lobby.players.size,
        maxPlayers: 10,
        hasPassword: !!lobby.settings.password,
        mode: lobby.settings.mode,
        topScore: this.getTopScore(lobby),
        waitingCount: lobby.waitingList.length,
      });
    }
    return list;
  }

  getTopScore(lobby) {
    let top = { name: '', score: 0 };
    for (const player of lobby.players.values()) {
      const score = lobby.game.scores[player.id] || 0;
      if (score > top.score) {
        top = { name: player.name, score };
      }
    }
    return top;
  }

  joinLobby(lobbyId, playerId, playerName, password = null) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { success: false, message: 'Lobby not found' };
    if (lobby.players.has(playerId)) return { success: false, message: 'Already in this lobby' };
    if (lobby.settings.password && lobby.settings.password !== password) {
      return { success: false, message: 'Invalid password' };
    }
    if (lobby.players.size >= 10) {
      lobby.waitingList.push({ playerId, playerName });
      return { success: false, message: 'Lobby full. Added to waiting list.', waitlisted: true };
    }

    const player = new Player(playerId, playerName);
    player.chips = lobby.settings.startingChips;
    player.isSpectator = true;
    player.ready = false;
    lobby.game.players.push(player);
    lobby.game.scores[playerId] = 0;
    lobby.players.set(playerId, player);
    return { success: true, playerObj: player };
  }

  leaveLobby(lobbyId, playerId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return;
    const player = lobby.players.get(playerId);
    if (player) {
      lobby.game.removePlayer(player.id);
      lobby.players.delete(playerId);
      this.promoteFromWaitlist(lobbyId);
    } else {
      lobby.waitingList = lobby.waitingList.filter(w => w.playerId !== playerId);
    }
    if (lobby.players.size === 0 && lobby.waitingList.length === 0) {
      this.removeLobby(lobbyId);
    }
  }

  promoteFromWaitlist(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return;
    while (lobby.players.size < 10 && lobby.waitingList.length > 0) {
      const next = lobby.waitingList.shift();
      const player = new Player(next.playerId, next.playerName);
      player.chips = lobby.settings.startingChips;
      player.isSpectator = true;
      player.ready = false;
      lobby.game.players.push(player);
      lobby.game.scores[next.playerId] = 0;
      lobby.players.set(next.playerId, player);
    }
  }

  kickPlayer(lobbyId, targetPlayerId, requesterId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { success: false, message: 'Lobby not found' };
    if (lobby.adminId !== requesterId) return { success: false, message: 'Only admin can kick' };
    this.leaveLobby(lobbyId, targetPlayerId);
    return { success: true };
  }

  setPassword(lobbyId, password, requesterId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { success: false, message: 'Lobby not found' };
    if (lobby.adminId !== requesterId) return { success: false, message: 'Only admin can change password' };
    lobby.settings.password = password || null;
    return { success: true };
  }

  addChatMessage(lobbyId, sender, message) {
    const chat = this.lobbyChat.get(lobbyId);
    if (chat) {
      chat.push({ sender, message, timestamp: Date.now() });
      if (chat.length > 200) chat.shift();
    }
  }

  getChatMessages(lobbyId) {
    return this.lobbyChat.get(lobbyId) || [];
  }

  addHandHistory(lobbyId, entry) {
    const lobby = this.lobbies.get(lobbyId);
    if (lobby) {
      lobby.handHistory.push(entry);
      if (lobby.handHistory.length > 50) lobby.handHistory.shift();
    }
  }

  getHandHistory(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    return lobby ? lobby.handHistory : [];
  }

  isAdmin(lobbyId, playerId) {
    const lobby = this.lobbies.get(lobbyId);
    return lobby ? lobby.adminId === playerId : false;
  }
}