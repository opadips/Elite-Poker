// backend/game/BettingRound.js
import { Deck } from './Deck.js';
import { REVEAL_STEP_DELAY_MS } from '../constants.js';

export function resetBettingRound(game) {
  game.actedPlayers.clear();
  const active = game.getActivePlayers().filter(p => !p.folded && !p.isAllIn);
  for (let p of active) {
    p.currentBet = 0;
  }
  game.currentBet = 0;
  game.minRaise = game.bigBlind;
  game.lastRaiseBy = null;
  game.currentPlayerIndex = findFirstActiveAfterDealer(game);
  game.waitingForAction = true;
  const nextPlayer = game.players.find(p => p.id === game.currentPlayerIndex);
  console.log(`New round (${game.currentRound}), first to act: ${nextPlayer?.name}`);

  const nonAllIn = game.getActivePlayers().filter(p => !p.folded && !p.isAllIn);
  const hasAllIn = game.getActivePlayers().some(p => p.isAllIn);
  if (nonAllIn.length === 1 && hasAllIn && game.currentRound !== 'preflop') {
    game.waitingForAction = false;
    revealRemainingCards(game);
  }
}

export function findFirstActiveAfterDealer(game) {
  const active = game.getActivePlayers().filter(p => !p.folded && !p.isAllIn);
  if (active.length === 0) return null;
  const dealerIdx = active.findIndex(p => p.id === game.dealerIndex);
  for (let i = 1; i <= active.length; i++) {
    const candidate = active[(dealerIdx + i) % active.length];
    if (!candidate.folded && !candidate.isAllIn) return candidate.id;
  }
  return active[0]?.id;
}

export function nextPlayer(game) {
  if (!game.handInProgress) return;
  if (game._allInResolving) return;

  const activePlayers = game.getActivePlayers().filter(p => !p.folded && !p.isAllIn);
  if (activePlayers.length === 0) {
    game.handleAllAllIn();
    return;
  }

  let startIdx = activePlayers.findIndex(p => p.id === game.currentPlayerIndex);
  if (startIdx === -1) startIdx = 0;
  let found = false;
  for (let i = 0; i < activePlayers.length; i++) {
    const idx = (startIdx + 1 + i) % activePlayers.length;
    const candidate = activePlayers[idx];
    if (!candidate.folded && !candidate.isAllIn) {
      game.currentPlayerIndex = candidate.id;
      found = true;
      console.log(`Next player: ${candidate.name}`);
      break;
    }
  }
  if (!found) game.handleAllAllIn();
}

export function handleAllAllIn(game) {
  if (game._allInResolving) return;
  const activePlayers = game.getActivePlayers().filter(p => !p.folded);
  if (activePlayers.length === 0) return;

  const allAllIn = activePlayers.every(p => p.isAllIn) || activePlayers.length === 1;
  if (!allAllIn) return;

  for (let p of activePlayers) {
    p.revealed = true;
  }

  revealRemainingCards(game);
}

export function revealRemainingCards(game) {
  if (game._allInResolving) return;
  game._allInResolving = true;
  console.log('Revealing remaining cards...');
  game.waitingForAction = false;

  const revealStep = () => {
    if (!game._allInResolving) return;
    if (game.currentRound === 'preflop') {
      game.communityCards = [game.deck.draw(), game.deck.draw(), game.deck.draw()];
      console.log(`Flop: ${game.communityCards.map(c => c.rank + c.suit).join(', ')}`);
      game.currentRound = 'flop';
      if (game.onStateChange) game.onStateChange();
      setTimeout(() => revealStep(), REVEAL_STEP_DELAY_MS);
    } else if (game.currentRound === 'flop') {
      game.communityCards.push(game.deck.draw());
      console.log(`Turn: ${game.communityCards[3].rank}${game.communityCards[3].suit}`);
      game.currentRound = 'turn';
      if (game.onStateChange) game.onStateChange();
      setTimeout(() => revealStep(), REVEAL_STEP_DELAY_MS);
    } else if (game.currentRound === 'turn') {
      game.communityCards.push(game.deck.draw());
      console.log(`River: ${game.communityCards[4].rank}${game.communityCards[4].suit}`);
      game.currentRound = 'river';
      if (game.onStateChange) game.onStateChange();
      setTimeout(() => revealStep(), REVEAL_STEP_DELAY_MS);
    } else {
      game.runShowdown();
      game.endHand();
      game._allInResolving = false;
    }
  };
  revealStep();
}

export function checkRoundComplete(game) {
  if (!game.handInProgress) return;
  if (game._allInResolving) return;
  const activePlayers = game.getActivePlayers().filter(p => !p.folded && !p.isAllIn);
  if (activePlayers.length === 0) {
    if (!game._allInResolving) game.handleAllAllIn();
    return;
  }
  const allActed = activePlayers.every(p => game.actedPlayers.has(p.id));
  const allBetsEqual = activePlayers.every(p => p.currentBet === game.currentBet);
  console.log(`Round check: allActed=${allActed}, allBetsEqual=${allBetsEqual}`);
  if (allActed && allBetsEqual) {
    game.advanceRound();
  }
}

export function advanceRound(game) {
  if (game.currentRound === 'preflop') {
    game.communityCards = [game.deck.draw(), game.deck.draw(), game.deck.draw()];
    console.log(`Flop: ${game.communityCards.map(c => c.rank + c.suit).join(', ')}`);
    game.currentRound = 'flop';
    resetBettingRound(game);
  } else if (game.currentRound === 'flop' || game.currentRound === 'turn') {
    const nonAllIn = game.getActivePlayers().filter(p => !p.folded && !p.isAllIn);
    const hasAllIn = game.getActivePlayers().some(p => p.isAllIn);
    if (nonAllIn.length === 1 && hasAllIn) {
      revealRemainingCards(game);
      return;
    }
    if (game.currentRound === 'flop') {
      game.communityCards.push(game.deck.draw());
      console.log(`Turn: ${game.communityCards[3].rank}${game.communityCards[3].suit}`);
      game.currentRound = 'turn';
    } else {
      game.communityCards.push(game.deck.draw());
      console.log(`River: ${game.communityCards[4].rank}${game.communityCards[4].suit}`);
      game.currentRound = 'river';
    }
    resetBettingRound(game);
  } else if (game.currentRound === 'river') {
    game.runShowdown();
    game.endHand();
  }
}