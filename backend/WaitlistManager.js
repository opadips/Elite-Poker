import { Player } from './game/Player.js';

export function addToWaitlist(lobby, playerId, playerName) {
  lobby.waitingList.push({ playerId, playerName });
}

export function promoteFromWaitlist(lobby) {
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