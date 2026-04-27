export function validateAction(game, playerId) {
  if (game.paused) return null;
  if (!game.waitingForAction) return null;
  const player = game.players.find(p => p.id === playerId);
  if (!player || player.folded || player.isAllIn || player.isSpectator) return null;
  if (game.currentPlayerIndex !== playerId) return null;
  const toCall = game.currentBet - player.currentBet;
  return { player, toCall };
}