// backend/game/AchievementTracker.js
import { HandEvaluator } from './HandEvaluator.js';

const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'royal_flush',
    name: 'Royal Flush',
    desc: 'Win a hand with a Royal Flush.',
    condition: (game, p, stats) => stats.bestHand === 'Royal Flush' && !p.achievements.includes('royal_flush'),
  },
  {
    id: 'straight_flush',
    name: 'Straight Flush',
    desc: 'Win a hand with a Straight Flush.',
    condition: (game, p, stats) => stats.bestHand === 'Straight Flush' && !p.achievements.includes('straight_flush'),
  },
  {
    id: 'quads',
    name: 'Quad Damage',
    desc: 'Win a hand with Four of a Kind.',
    condition: (game, p, stats) => stats.bestHand === 'Four of a Kind' && !p.achievements.includes('quads'),
  },
  {
    id: 'pocket_rockets',
    name: 'American Airlines',
    desc: 'Win a hand with Pocket Aces (AA).',
    condition: (game, p) => {
      const won = game.winner?.names?.includes(p.name);
      const isAA = p.holeCards?.length === 2 && p.holeCards[0].rank === 'A' && p.holeCards[1].rank === 'A';
      return won && isAA && !p.achievements.includes('pocket_rockets');
    },
  },
  {
    id: 'seven_deuce',
    name: 'The Worst Hand',
    desc: 'Win a hand with 7-2 offsuit.',
    condition: (game, p) => {
      const won = game.winner?.names?.includes(p.name);
      const cards = p.holeCards || [];
      if (cards.length !== 2) return false;
      const r1 = cards[0].rank, r2 = cards[1].rank;
      const s1 = cards[0].suit, s2 = cards[1].suit;
      const isSevenDeuce = (r1 === '7' && r2 === '2') || (r1 === '2' && r2 === '7');
      const offsuit = s1 !== s2;
      return won && isSevenDeuce && offsuit && !p.achievements.includes('seven_deuce');
    },
  },
  {
    id: 'golden_duck',
    name: 'Golden Duck',
    desc: 'Win 25 hands with Pocket Deuces.',
    condition: (game, p) => {
      const count = game.achCounters?.pocket2sWins?.[p.id] || 0;
      return count >= 25 && !p.achievements.includes('golden_duck');
    },
  },
  {
    id: 'suicide_king',
    name: 'Suicide King',
    desc: 'Win a hand with the King of Hearts (K♥) in your hole cards.',
    condition: (game, p) => {
      const won = game.winner?.names?.includes(p.name);
      const hasKH = p.holeCards?.some(c => c.rank === 'K' && c.suit === '♥');
      return won && hasKH && !p.achievements.includes('suicide_king');
    },
  },
  {
    id: 'one_eyed_jack',
    name: 'One-Eyed Jack',
    desc: 'Win a hand with a One-Eyed Jack (J♠ or J♥) in your hole cards.',
    condition: (game, p) => {
      const won = game.winner?.names?.includes(p.name);
      const hasOEJ = p.holeCards?.some(c => c.rank === 'J' && (c.suit === '♠' || c.suit === '♥'));
      return won && hasOEJ && !p.achievements.includes('one_eyed_jack');
    },
  },
  {
    id: 'dead_mans_hand',
    name: 'Dead Man\'s Hand',
    desc: 'Win a hand with Aces and Eights (two pair, Aces over Eights).',
    condition: (game, p) => {
      const won = game.winner?.names?.includes(p.name);
      if (!won) return false;
      const evaluator = new HandEvaluator();
      const hand = evaluator.evaluate(p.holeCards, game.communityCards);
      if (hand.name !== 'Two Pair') return false;
      const rankCounts = {};
      for (const card of [...p.holeCards, ...game.communityCards]) {
        const r = card.rank;
        rankCounts[r] = (rankCounts[r] || 0) + 1;
      }
      const hasAcesPair = rankCounts['A'] >= 2;
      const hasEightsPair = rankCounts['8'] >= 2;
      return hasAcesPair && hasEightsPair && !p.achievements.includes('dead_mans_hand');
    },
  },
  {
    id: 'hat_trick',
    name: 'Hat Trick',
    desc: 'Win 3 hands in a row.',
    condition: (game, p) => {
      const streak = game.achCounters?.winStreak?.[p.id] || 0;
      return streak >= 3 && !p.achievements.includes('hat_trick');
    },
  },
  {
    id: 'on_fire',
    name: 'On Fire',
    desc: 'Win 5 hands in a row.',
    condition: (game, p) => {
      const streak = game.achCounters?.winStreak?.[p.id] || 0;
      return streak >= 5 && !p.achievements.includes('on_fire');
    },
  },
  {
    id: 'god_mode',
    name: 'God Mode',
    desc: 'Win 10 hands in a row.',
    condition: (game, p) => {
      const streak = game.achCounters?.winStreak?.[p.id] || 0;
      return streak >= 10 && !p.achievements.includes('god_mode');
    },
  },
  {
    id: 'bad_beat_magnet',
    name: 'Bad Beat Magnet',
    desc: 'Lose 10 hands in a row.',
    condition: (game, p) => {
      const streak = game.achCounters?.lossStreak?.[p.id] || 0;
      return streak >= 10 && !p.achievements.includes('bad_beat_magnet');
    },
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    desc: 'Win a hand after being reduced to exactly 1 chip.',
    condition: (game, p) => {
      const prev = game.achCounters?.prevChips?.[p.id];
      return prev === 1 && game.winner?.names?.includes(p.name) && !p.achievements.includes('phoenix');
    },
  },
  {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    desc: 'Win a hand when your stack was under 50 chips.',
    condition: (game, p) => {
      const prev = game.achCounters?.prevChips?.[p.id];
      return prev !== undefined && prev < 50 && game.winner?.names?.includes(p.name) && !p.achievements.includes('comeback_kid');
    },
  },
  {
    id: 'sheriff',
    name: 'Sheriff',
    desc: 'Eliminate a player.',
    condition: (game, p) => {
      if (game.mode !== 'tournament') return false;
      const elims = game.achCounters?.eliminations?.[p.id] || 0;
      return elims >= 1 && !p.achievements.includes('sheriff');
    },
  },
  {
    id: 'assassin',
    name: 'Assassin',
    desc: 'Eliminate 5 players.',
    condition: (game, p) => {
      if (game.mode !== 'tournament') return false;
      const elims = game.achCounters?.eliminations?.[p.id] || 0;
      return elims >= 5 && !p.achievements.includes('assassin');
    },
  },
  {
    id: 'clean_sweep',
    name: 'Clean Sweep',
    desc: 'Knock out at least 2 players in a single hand.',
    condition: (game, p) => {
      if (game.mode !== 'tournament') return false;
      const elimsThisHand = game.achCounters?.eliminationsThisHand?.[p.id] || 0;
      return elimsThisHand >= 2 && !p.achievements.includes('clean_sweep');
    },
  },
  {
    id: 'dracula',
    name: 'Count Dracula',
    desc: 'Win a hand using only black cards (♠♣).',
    condition: (game, p) => {
      if (!game.winner?.names?.includes(p.name)) return false;
      const allCards = [...(p.holeCards || []), ...(game.communityCards || [])];
      return allCards.length > 0 && allCards.every(c => c.suit === '♠' || c.suit === '♣') && !p.achievements.includes('dracula');
    },
  },
  {
    id: 'millionaire_club',
    name: 'Millionaire Club',
    desc: 'Win a pot of at least 1,000,000 chips.',
    condition: (game, p) => {
      const won = game.winner?.names?.includes(p.name);
      return won && game.pot >= 1000000 && !p.achievements.includes('millionaire_club');
    },
  },
  {
    id: 'specialist',
    name: 'The Specialist',
    desc: 'Win 10 hands with a Flush (exactly a Flush).',
    condition: (game, p) => {
      const count = game.achCounters?.flushWins?.[p.id] || 0;
      return count >= 10 && !p.achievements.includes('specialist');
    },
  },
  {
    id: 'boat_parade',
    name: 'Boat Parade',
    desc: 'Win 5 hands with a Full House or better.',
    condition: (game, p) => {
      const count = game.achCounters?.boatWins?.[p.id] || 0;
      return count >= 5 && !p.achievements.includes('boat_parade');
    },
  },
  {
    id: 'marathon',
    name: 'Marathon Man',
    desc: 'Play 500 hands.',
    condition: (game, p, stats) => stats.handsPlayed >= 500 && !p.achievements.includes('marathon'),
  },
];

export function checkAchievements(game) {
  if (!game.achCounters) {
    game.achCounters = {
      winStreak: {},
      lossStreak: {},
      pocket2sWins: {},
      prevChips: {},
      eliminations: {},
      flushWins: {},
      boatWins: {},
      eliminationsThisHand: {},
    };
  }
  const counters = game.achCounters;

  for (const player of game.players) {
    if (player.isSpectator) continue;
    if (!(player.id in counters.winStreak)) counters.winStreak[player.id] = 0;
    if (!(player.id in counters.lossStreak)) counters.lossStreak[player.id] = 0;
    if (!(player.id in counters.pocket2sWins)) counters.pocket2sWins[player.id] = 0;
    if (!(player.id in counters.eliminations)) counters.eliminations[player.id] = 0;
    if (!(player.id in counters.flushWins)) counters.flushWins[player.id] = 0;
    if (!(player.id in counters.boatWins)) counters.boatWins[player.id] = 0;
    if (!(player.id in counters.eliminationsThisHand)) counters.eliminationsThisHand[player.id] = 0;
  }

  const winnerNames = game.winner?.names?.split(', ') || [];

  const evaluator = new HandEvaluator();

  for (const player of game.players) {
    if (player.isSpectator) continue;
    if (winnerNames.includes(player.name)) {
      counters.winStreak[player.id]++;
      counters.lossStreak[player.id] = 0;

      if (player.holeCards?.length === 2 &&
          player.holeCards[0].rank === '2' && player.holeCards[1].rank === '2') {
        counters.pocket2sWins[player.id]++;
      }

      const hand = evaluator.evaluate(player.holeCards, game.communityCards);
      if (hand.name === 'Flush' || hand.name === 'Straight Flush' || hand.name === 'Royal Flush') {
        if (hand.name === 'Flush') counters.flushWins[player.id]++;
        if (hand.name === 'Full House' || hand.name === 'Four of a Kind' || hand.name === 'Straight Flush' || hand.name === 'Royal Flush') {
          counters.boatWins[player.id]++;
        }
      }
    } else {
      counters.lossStreak[player.id]++;
      counters.winStreak[player.id] = 0;
    }
  }

  for (const player of game.players) {
    counters.eliminationsThisHand[player.id] = 0;
  }

  if (game.mode === 'tournament') {
    for (const player of game.players) {
      if (player.isSpectator && player.chips === 0) {
        for (const winner of game.players) {
          if (winnerNames.includes(winner.name)) {
            counters.eliminations[winner.id]++;
            counters.eliminationsThisHand[winner.id]++;
          }
        }
      }
    }
  }

  const newAchievements = [];
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    for (const player of game.players) {
      if (player.isSpectator) continue;
      if (player.achievements.includes(def.id)) continue;
      if (def.condition(game, player, player.stats)) {
        player.achievements.push(def.id);
        newAchievements.push({
          playerName: player.name,
          ...def,
        });
      }
    }
  }

  for (const player of game.players) {
    if (!player.isSpectator) {
      counters.prevChips[player.id] = player.chips;
    }
  }

  return newAchievements;
}