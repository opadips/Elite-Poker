export const ACHIEVEMENTS = {
  FIRST_BLOOD: { id: 'first_blood', name: 'First Blood', desc: 'Win your first pot!' },
  HAT_TRICK: { id: 'hat_trick', name: 'Hat Trick', desc: 'Win 3 pots in a row!' },
  HIGH_ROLLER: { id: 'high_roller', name: 'High Roller', desc: 'Win a pot of 500+ chips!' },
  ROYAL_TOUCH: { id: 'royal_touch', name: 'Royal Touch', desc: 'Win with a Royal Flush!' },
  BLUFF_MASTER: { id: 'bluff_master', name: 'Bluff Master', desc: 'Win with High Card!' },
  ALL_IN_KING: { id: 'all_in_king', name: 'All‑In King', desc: 'Win while being all‑in!' },
  SHERIFF: { id: 'sheriff', name: 'Sheriff', desc: 'Eliminate a player!' },
  VETERAN: { id: 'veteran', name: 'Veteran', desc: 'Play 10 hands!' },
};

export function checkAchievements(game) {
  const newAchievements = [];
  for (let player of game.players) {
    if (player.isSpectator) continue;
    const stats = player.stats;
    if (stats.potsWon === 1 && !player.achievements.includes('first_blood')) {
      player.achievements.push('first_blood');
      newAchievements.push({ playerName: player.name, ...ACHIEVEMENTS.FIRST_BLOOD });
    }
    if (game._consecutiveWins[player.id] >= 3 && !player.achievements.includes('hat_trick')) {
      player.achievements.push('hat_trick');
      newAchievements.push({ playerName: player.name, ...ACHIEVEMENTS.HAT_TRICK });
    }
    if (stats.biggestPot >= 500 && !player.achievements.includes('high_roller')) {
      player.achievements.push('high_roller');
      newAchievements.push({ playerName: player.name, ...ACHIEVEMENTS.HIGH_ROLLER });
    }
    if (stats.bestHand === 'Royal Flush' && !player.achievements.includes('royal_touch')) {
      player.achievements.push('royal_touch');
      newAchievements.push({ playerName: player.name, ...ACHIEVEMENTS.ROYAL_TOUCH });
    }
    if (stats.potsWon > 0 && stats.bestHand === 'High Card' && !player.achievements.includes('bluff_master')) {
      player.achievements.push('bluff_master');
      newAchievements.push({ playerName: player.name, ...ACHIEVEMENTS.BLUFF_MASTER });
    }
    if (player.isAllIn && player.chips > 0 && !player.achievements.includes('all_in_king')) {
      player.achievements.push('all_in_king');
      newAchievements.push({ playerName: player.name, ...ACHIEVEMENTS.ALL_IN_KING });
    }
    if (stats.handsPlayed >= 10 && !player.achievements.includes('veteran')) {
      player.achievements.push('veteran');
      newAchievements.push({ playerName: player.name, ...ACHIEVEMENTS.VETERAN });
    }
  }
  return newAchievements;
}