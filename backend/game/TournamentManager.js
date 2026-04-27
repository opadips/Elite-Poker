export function applyTournamentRules(game) {
  const busted = game.players.filter(p => !p.isSpectator && p.chips === 0);
  for (let p of busted) {
    p.isSpectator = true;
    p.ready = false;
    console.log(`${p.name} has 0 chips and became spectator.`);
  }

  const activeNonSpectators = game.players.filter(p => !p.isSpectator);
  if (activeNonSpectators.length === 1 && game.players.length > 1) {
    const champion = activeNonSpectators[0];
    game.scores[champion.id] = (game.scores[champion.id] || 0) + 1;
    console.log(`🏆 ${champion.name} wins the tournament round! Score: ${game.scores[champion.id]}`);
    for (let p of game.players) {
      p.chips = game.startingChips;
      p.isSpectator = false;
      p.ready = false;
    }
  } else if (activeNonSpectators.length === 0) {
    console.log('No players with chips. Waiting for someone to sit in.');
  }
}