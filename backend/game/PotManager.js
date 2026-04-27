import { HandEvaluator } from './HandEvaluator.js';

export function runShowdown(game) {
  const evaluator = new HandEvaluator();
  const contenders = game.getActivePlayers().filter(p => !p.folded);
  if (contenders.length === 0) return;

  const hands = {};
  for (let p of contenders) {
    hands[p.id] = evaluator.evaluate(p.holeCards, game.communityCards);
    console.log(`${p.name} hand: ${hands[p.id].name}`);
  }

  const sortedByBet = [...contenders].sort((a, b) => a.totalBet - b.totalBet);
  const sidePots = [];
  let prevLevel = 0;
  for (let i = 0; i < sortedByBet.length; i++) {
    const level = sortedByBet[i].totalBet;
    if (level > prevLevel) {
      const contributors = sortedByBet.slice(i);
      const potAmount = (level - prevLevel) * contributors.length;
      sidePots.push({
        amount: potAmount,
        eligible: contributors.map(p => p.id)
      });
      prevLevel = level;
    }
  }
  let sumSide = sidePots.reduce((s, p) => s + p.amount, 0);
  if (sumSide < game.pot && sidePots.length > 0) {
    sidePots[sidePots.length - 1].amount += (game.pot - sumSide);
  }

  const winnings = {};
  const dealerPos = game.getActivePlayers().findIndex(p => p.id === game.dealerIndex);

  for (const pot of sidePots) {
    if (pot.amount <= 0) continue;
    let bestHand = null;
    let winners = [];
    for (const pid of pot.eligible) {
      const player = contenders.find(p => p.id === pid);
      if (!player) continue;
      const hand = hands[pid];
      if (!bestHand || hand.rank < bestHand.rank || (hand.rank === bestHand.rank && hand.cmp(bestHand) > 0)) {
        bestHand = hand;
        winners = [player];
      } else if (hand.rank === bestHand.rank && hand.cmp(bestHand) === 0) {
        winners.push(player);
      }
    }
    if (winners.length === 0) continue;
    const share = Math.floor(pot.amount / winners.length);
    let remainder = pot.amount - share * winners.length;

    winners.sort((a, b) => {
      const idxA = game.getActivePlayers().findIndex(p => p.id === a.id);
      const idxB = game.getActivePlayers().findIndex(p => p.id === b.id);
      const distA = (idxA - dealerPos + game.getActivePlayers().length) % game.getActivePlayers().length;
      const distB = (idxB - dealerPos + game.getActivePlayers().length) % game.getActivePlayers().length;
      return distA - distB;
    });

    for (let i = 0; i < winners.length; i++) {
      const win = share + (i < remainder ? 1 : 0);
      if (!winnings[winners[i].id]) winnings[winners[i].id] = { amount: 0, handName: bestHand.name };
      winnings[winners[i].id].amount += win;
      winnings[winners[i].id].handName = bestHand.name;
    }
  }

  const results = [];
  const allWinners = [];
  for (const [pid, win] of Object.entries(winnings)) {
    const player = game.players.find(p => p.id === pid);
    if (player) {
      player.chips += win.amount;
      results.push({ name: player.name, amount: win.amount, handName: win.handName });
      allWinners.push(player);
      player.stats.handsPlayed += 1;
      player.stats.potsWon += 1;
      if (win.amount > player.stats.biggestPot) player.stats.biggestPot = win.amount;
      if (!player.stats.bestHand || game.compareHandNames(win.handName, player.stats.bestHand) < 0) {
        player.stats.bestHand = win.handName;
      }
      if (!game._consecutiveWins[pid]) game._consecutiveWins[pid] = 0;
      game._consecutiveWins[pid] += 1;
    }
  }
  for (let p of contenders) {
    if (!winnings[p.id]) {
      p.stats.handsPlayed += 1;
      p.stats.losses += 1;
      game._consecutiveWins[p.id] = 0;
    }
  }

  game.winner = {
    names: results.map(r => r.name).join(', '),
    winnings: results.reduce((s, r) => s + r.amount, 0),
    handName: results[0]?.handName || '',
    players: results.map(r => ({ name: r.name, cards: game.players.find(p => p.name === r.name)?.holeCards || [] }))
  };
  console.log(`Winner: ${game.winner.names} with ${game.winner.handName}, wins ${game.winner.winnings}`);

  for (let p of contenders) {
    p.revealed = true;
  }

  game.sideBetResults = resolveSideBets(game, allWinners);
}

export function resolveSideBets(game, winnerPlayers) {
  if (!winnerPlayers.length || game.sideBets.length === 0) {
    game.sideBets = [];
    return [];
  }
  const winnerIds = new Set(winnerPlayers.map(p => p.id));
  const winningBets = game.sideBets.filter(b => winnerIds.has(b.targetPlayerId));
  if (winningBets.length === 0) {
    game.sideBets = [];
    return [];
  }
  const results = [];
  for (let bet of winningBets) {
    const bettor = game.players.find(p => p.id === bet.bettorId);
    if (bettor) {
      const profit = Math.floor(bet.amount * 0.5);
      bettor.chips += bet.amount + profit;
      results.push({
        bettorName: bettor.name,
        targetName: winnerPlayers.find(w => w.id === bet.targetPlayerId)?.name || '',
        amount: bet.amount,
        profit: profit
      });
      console.log(`Side bet win: ${bettor.name} wins ${bet.amount + profit} (bet ${bet.amount} on ${winnerPlayers.find(w => w.id === bet.targetPlayerId)?.name})`);
    }
  }
  game.sideBets = [];
  return results;
}