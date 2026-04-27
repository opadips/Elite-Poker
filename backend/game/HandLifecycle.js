import { Deck } from './Deck.js';

export function startHand(game) {
  const activePlayers = game.getActivePlayers();
  if (activePlayers.length < 2) return;
  console.log('===== NEW HAND START =====');
  game.handInProgress = true;
  game.deck = new Deck();
  game.communityCards = [];
  game.pot = 0;
  game.currentBet = 0;
  game.minRaise = game.bigBlind;
  game.lastRaiseBy = null;
  game.currentRound = 'preflop';
  game.winner = null;
  game.waitingForAction = true;
  game.actedPlayers.clear();
  game.sideBets = [];
  game.sideBetResults = [];
  game._allInResolving = false;

  for (let p of activePlayers) {
    if (p.chips <= 0) {
      console.log(`${p.name} had 0 chips, resetting to ${game.startingChips}`);
      p.chips = game.startingChips;
    }
    p.resetForNewHand();
    p.holeCards = [game.deck.draw(), game.deck.draw()];
    p.revealed = false;
    console.log(`${p.name} cards: ${p.holeCards[0].rank}${p.holeCards[0].suit} ${p.holeCards[1].rank}${p.holeCards[1].suit}`);
  }

  const activeIds = activePlayers.map(p => p.id);
  let currentDealerIndex = activeIds.indexOf(game.dealerIndex);
  if (currentDealerIndex === -1) currentDealerIndex = 0;
  game.dealerIndex = activeIds[(currentDealerIndex + 1) % activePlayers.length];
  const dealerIdxInActive = activeIds.indexOf(game.dealerIndex);
  const sbIdx = (dealerIdxInActive + 1) % activePlayers.length;
  const bbIdx = (dealerIdxInActive + 2) % activePlayers.length;

  const sbPlayer = activePlayers[sbIdx];
  const bbPlayer = activePlayers[bbIdx];

  postBlind(game, sbPlayer, game.smallBlind);
  postBlind(game, bbPlayer, game.bigBlind);
  game.currentBet = game.bigBlind;
  game.minRaise = game.bigBlind;
  game.lastRaiseBy = bbPlayer.id;

  console.log(`SB: ${sbPlayer.name} (${game.smallBlind}), BB: ${bbPlayer.name} (${game.bigBlind})`);
  game.currentPlayerIndex = activePlayers[(bbIdx + 1) % activePlayers.length].id;
  console.log(`First to act: ${game.players.find(p => p.id === game.currentPlayerIndex)?.name}`);
}

export function postBlind(game, player, amount) {
  const actual = Math.min(amount, player.chips);
  player.chips -= actual;
  player.currentBet = actual;
  player.totalBet += actual;
  game.pot += actual;
  if (player.chips === 0) player.isAllIn = true;
}