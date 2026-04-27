import { HAND_HISTORY_SIZE } from './constants.js';

export function addHandHistory(lobby, entry) {
  lobby.handHistory.push(entry);
  if (lobby.handHistory.length > HAND_HISTORY_SIZE) lobby.handHistory.shift();
}

export function getHandHistory(lobby) {
  return lobby.handHistory || [];
}