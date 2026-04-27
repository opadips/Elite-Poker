export function addHandHistory(lobby, entry) {
  lobby.handHistory.push(entry);
  if (lobby.handHistory.length > 50) lobby.handHistory.shift();
}

export function getHandHistory(lobby) {
  return lobby.handHistory || [];
}