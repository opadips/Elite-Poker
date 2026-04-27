import { Player } from './game/Player.js';
import { MAX_PLAYERS, DEFAULT_STARTING_CHIPS } from './constants.js';

export function addToWaitlist(lobby, playerId, playerName) {
  lobby.waitingList.push({ playerId, playerName });
}

export function promoteFromWaitlist(lobby) {
  if (!lobby) return;
  while (lobby.players.size < MAX_PLAYERS && lobby.waitingList.length > 0) {
    const next = lobby.waitingList.shift();
    const player = new Player(next.playerId, next.playerName);
    player.chips = lobby.settings.startingChips || DEFAULT_STARTING_CHIPS;
    player.isSpectator = true;
    player.ready = false;
    lobby.game.players.push(player);
    lobby.game.scores[next.playerId] = 0;
    lobby.players.set(next.playerId, player);
  }
}