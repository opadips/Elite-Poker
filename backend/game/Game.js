// backend/game/Game.js
import { Player } from './Player.js';
import { Deck } from './Deck.js';
import { HandEvaluator } from './HandEvaluator.js';

const ACHIEVEMENTS = {
  FIRST_BLOOD: { id: 'first_blood', name: 'First Blood', desc: 'Win your first pot!' },
  HAT_TRICK: { id: 'hat_trick', name: 'Hat Trick', desc: 'Win 3 pots in a row!' },
  HIGH_ROLLER: { id: 'high_roller', name: 'High Roller', desc: 'Win a pot of 500+ chips!' },
  ROYAL_TOUCH: { id: 'royal_touch', name: 'Royal Touch', desc: 'Win with a Royal Flush!' },
  BLUFF_MASTER: { id: 'bluff_master', name: 'Bluff Master', desc: 'Win with High Card!' },
  ALL_IN_KING: { id: 'all_in_king', name: 'All‑In King', desc: 'Win while being all‑in!' },
  SHERIFF: { id: 'sheriff', name: 'Sheriff', desc: 'Eliminate a player!' },
  VETERAN: { id: 'veteran', name: 'Veteran', desc: 'Play 10 hands!' },
};

export class Game {
  constructor() {
    this.players = [];
    this.deck = null;
    this.communityCards = [];
    this.pot = 0;
    this.currentRound = 'preflop';
    this.currentPlayerIndex = 0;
    this.smallBlind = 10;
    this.bigBlind = 20;
    this.currentBet = 0;
    this.waitingForAction = false;
    this.dealerIndex = 0;
    this.winner = null;
    this.handInProgress = false;
    this.actedPlayers = new Set();
    this.scores = {};
    this.sideBets = [];
    this.sideBetsPot = 0;
    this.sideBetResults = [];
    this.firstHandStarted = false;
    this.paused = false;
    this._nextHandTimer = null;
    this._consecutiveWins = {};
    this.onStateChange = null;
  }

  addPlayer(name, isSpectator = true) {
    const id = `${Date.now()}-${Math.random()}-${name}`;
    const player = new Player(id, name);
    player.isSpectator = isSpectator;
    player.ready = false;
    this.players.push(player);
    this.scores[id] = 0;
    console.log(`Player ${name} joined as ${isSpectator ? 'spectator' : 'player'}, total: ${this.players.length}`);
    return id;
  }

  removePlayer(id) {
    this.players = this.players.filter(p => p.id !== id);
    delete this.scores[id];
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length < 2) {
      this.handInProgress = false;
      this.firstHandStarted = false;
    }
  }

  getActivePlayers() {
    return this.players.filter(p => !p.isSpectator);
  }

  sitIn(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { success: false, message: 'Player not found' };
    if (!player.isSpectator) return { success: false, message: 'Already in game' };
    if (this.handInProgress) return { success: false, message: 'Cannot sit in during a hand' };
    player.isSpectator = false;
    player.chips = 1000;
    player.ready = false;
    console.log(`${player.name} sat in the game.`);
    const active = this.getActivePlayers();
    if (active.length >= 2 && !this.handInProgress && !this.firstHandStarted && active.every(p => p.ready)) {
      this.firstHandStarted = true;
      this.startHand();
    }
    return { success: true };
  }

  toggleReady(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.isSpectator) return { success: false, message: 'Not a player' };
    if (this.handInProgress) return { success: false, message: 'Game already in progress' };
    player.ready = !player.ready;
    console.log(`${player.name} is now ${player.ready ? 'ready' : 'not ready'}`);

    const active = this.getActivePlayers();
    if (active.length >= 2 && active.every(p => p.ready) && !this.handInProgress && !this.firstHandStarted) {
      console.log('All active players ready for first hand! Starting...');
      this.firstHandStarted = true;
      this.startHand();
    }
    return { success: true, ready: player.ready };
  }

  startHand() {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length < 2) return;
    console.log('===== NEW HAND START =====');
    this.handInProgress = true;
    this.deck = new Deck();
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.currentRound = 'preflop';
    this.winner = null;
    this.waitingForAction = true;
    this.actedPlayers.clear();
    this.sideBets = [];
    this.sideBetsPot = 0;
    this.sideBetResults = [];

    for (let p of activePlayers) {
      if (p.chips <= 0) {
        console.log(`${p.name} had 0 chips, resetting to 1000`);
        p.chips = 1000;
      }
      p.folded = false;
      p.currentBet = 0;
      p.isAllIn = false;
      p.totalBet = 0;
      p.holeCards = [this.deck.draw(), this.deck.draw()];
      p.lastAction = { type: '', amount: 0 };
      p.revealed = false;
      console.log(`${p.name} cards: ${p.holeCards[0].rank}${p.holeCards[0].suit} ${p.holeCards[1].rank}${p.holeCards[1].suit}`);
    }

    const activeIds = activePlayers.map(p => p.id);
    let currentDealerIndex = activeIds.indexOf(this.dealerIndex);
    if (currentDealerIndex === -1) currentDealerIndex = 0;
    this.dealerIndex = activeIds[(currentDealerIndex + 1) % activePlayers.length];
    const dealerIdxInActive = activeIds.indexOf(this.dealerIndex);
    const sbIdxInActive = (dealerIdxInActive + 1) % activePlayers.length;
    const bbIdxInActive = (dealerIdxInActive + 2) % activePlayers.length;

    const sb = activePlayers[sbIdxInActive];
    const bb = activePlayers[bbIdxInActive];

    this.postBlind(sb, this.smallBlind);
    this.postBlind(bb, this.bigBlind);
    this.currentBet = this.bigBlind;

    console.log(`SB: ${sb.name} (${this.smallBlind}), BB: ${bb.name} (${this.bigBlind})`);
    this.currentPlayerIndex = activePlayers[(bbIdxInActive + 1) % activePlayers.length].id;
    console.log(`First to act: ${this.players.find(p => p.id === this.currentPlayerIndex)?.name}`);
  }

  postBlind(player, amount) {
    const actual = Math.min(amount, player.chips);
    player.chips -= actual;
    player.currentBet = actual;
    player.totalBet += actual;
    this.pot += actual;
    this.actedPlayers.add(player.id);
    if (player.chips === 0) player.isAllIn = true;
  }

  playerAction(playerId, action, amount = 0) {
    if (this.paused) return;
    if (!this.waitingForAction) return;
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.folded || player.isAllIn || player.isSpectator) return;
    if (this.currentPlayerIndex !== playerId) return;

    const toCall = this.currentBet - player.currentBet;
    console.log(`${player.name} action: ${action}, toCall=${toCall}, chips=${player.chips}`);

    player.lastAction = { type: action, amount: amount || 0 };

    if (action === 'fold') {
      player.folded = true;
      this.actedPlayers.add(player.id);
      const remainingPlayers = this.getActivePlayers().filter(p => !p.folded && !p.isAllIn);
      if (remainingPlayers.length === 1) {
        const winner = remainingPlayers[0];
        const handName = this.evaluatePlayerHand(winner);
        this.winner = {
          names: winner.name,
          winnings: this.pot,
          handName: handName,
          players: [{ name: winner.name, cards: winner.holeCards }]
        };
        this.endHand();
        return;
      }
      this.nextPlayer();
    }
    else if (action === 'check' && toCall === 0) {
      this.actedPlayers.add(player.id);
      this.nextPlayer();
    }
    else if (action === 'call') {
      let callAmount = toCall;
      if (callAmount >= player.chips) {
        callAmount = player.chips;
        player.isAllIn = true;
      }
      player.chips -= callAmount;
      player.currentBet += callAmount;
      player.totalBet += callAmount;
      this.pot += callAmount;
      this.actedPlayers.add(player.id);
      this.nextPlayer();
    }
    else if (action === 'raise') {
      let raiseAmount = amount;
      if (raiseAmount < this.bigBlind) raiseAmount = this.bigBlind;
      let total = toCall + raiseAmount;
      if (total >= player.chips) {
        total = player.chips;
        player.isAllIn = true;
      }
      player.chips -= total;
      player.currentBet += total;
      player.totalBet += total;
      this.pot += total;
      this.currentBet = player.currentBet;
      this.actedPlayers.clear();
      this.actedPlayers.add(player.id);
      this.nextPlayer();
    }
    else if (action === 'allin') {
      let total = player.chips;
      player.chips = 0;
      player.currentBet += total;
      player.totalBet += total;
      this.pot += total;
      player.isAllIn = true;
      if (player.currentBet > this.currentBet) this.currentBet = player.currentBet;
      this.actedPlayers.clear();
      this.actedPlayers.add(player.id);
      this.nextPlayer();
    }

    if (!this.handInProgress) return;
    this.checkRoundComplete();
  }

  nextPlayer() {
    const activePlayers = this.getActivePlayers().filter(p => !p.folded && !p.isAllIn);
    if (activePlayers.length === 0) {
      this.handleAllAllIn();
      return;
    }
    let startIdx = activePlayers.findIndex(p => p.id === this.currentPlayerIndex);
    if (startIdx === -1) startIdx = 0;
    let found = false;
    for (let i = 0; i < activePlayers.length; i++) {
      const idx = (startIdx + 1 + i) % activePlayers.length;
      const candidate = activePlayers[idx];
      if (!candidate.folded && !candidate.isAllIn) {
        this.currentPlayerIndex = candidate.id;
        found = true;
        console.log(`Next player: ${candidate.name}`);
        break;
      }
    }
    if (!found) {
      this.handleAllAllIn();
    }
  }

  handleAllAllIn() {
    const activePlayers = this.getActivePlayers().filter(p => !p.folded);
    if (activePlayers.length === 0) return;

    const allAllIn = activePlayers.every(p => p.isAllIn) || activePlayers.length === 1;
    if (allAllIn) {
      console.log('All players all-in (or single player). Revealing remaining cards with delay...');
      this.waitingForAction = false;

      const revealStep = () => {
        if (this.currentRound === 'preflop') {
          this.communityCards = [this.deck.draw(), this.deck.draw(), this.deck.draw()];
          console.log(`Flop: ${this.communityCards.map(c => c.rank + c.suit).join(', ')}`);
          this.currentRound = 'flop';
          if (this.onStateChange) this.onStateChange();
          setTimeout(() => revealStep(), 2000);
        } else if (this.currentRound === 'flop') {
          this.communityCards.push(this.deck.draw());
          console.log(`Turn: ${this.communityCards[3].rank}${this.communityCards[3].suit}`);
          this.currentRound = 'turn';
          if (this.onStateChange) this.onStateChange();
          setTimeout(() => revealStep(), 2000);
        } else if (this.currentRound === 'turn') {
          this.communityCards.push(this.deck.draw());
          console.log(`River: ${this.communityCards[4].rank}${this.communityCards[4].suit}`);
          this.currentRound = 'river';
          if (this.onStateChange) this.onStateChange();
          setTimeout(() => revealStep(), 2000);
        } else {
          this.evaluateWinnerWithSidePots();
          this.endHand();
          if (this.onStateChange) this.onStateChange();
        }
      };
      revealStep();
    }
  }

  checkRoundComplete() {
    if (!this.handInProgress) return;
    const activePlayers = this.getActivePlayers().filter(p => !p.folded && !p.isAllIn);
    if (activePlayers.length === 0) {
      this.handleAllAllIn();
      return;
    }
    const allActed = activePlayers.every(p => this.actedPlayers.has(p.id));
    const allBetsEqual = activePlayers.every(p => p.currentBet === this.currentBet);
    console.log(`Round check: allActed=${allActed}, allBetsEqual=${allBetsEqual}`);
    if (allActed && allBetsEqual) {
      this.nextRound();
    }
  }

  evaluatePlayerHand(player) {
    const evaluator = new HandEvaluator();
    if (this.communityCards.length === 0) {
      const [c1, c2] = player.holeCards;
      if (c1.rank === c2.rank) return 'Pair';
      if (c1.rank === 'A' || c2.rank === 'A') return 'Ace High';
      return 'High Card';
    }
    const hand = evaluator.evaluate(player.holeCards, this.communityCards);
    return hand.name;
  }

  nextRound() {
    if (this.currentRound === 'preflop') {
      this.currentRound = 'flop';
      this.communityCards = [this.deck.draw(), this.deck.draw(), this.deck.draw()];
      console.log(`Flop: ${this.communityCards.map(c => c.rank + c.suit).join(', ')}`);
      this.resetBettingRound();
    } else if (this.currentRound === 'flop') {
      this.currentRound = 'turn';
      this.communityCards.push(this.deck.draw());
      console.log(`Turn: ${this.communityCards[3].rank}${this.communityCards[3].suit}`);
      this.resetBettingRound();
    } else if (this.currentRound === 'turn') {
      this.currentRound = 'river';
      this.communityCards.push(this.deck.draw());
      console.log(`River: ${this.communityCards[4].rank}${this.communityCards[4].suit}`);
      this.resetBettingRound();
    } else if (this.currentRound === 'river') {
      this.currentRound = 'showdown';
      this.evaluateWinnerWithSidePots();
      this.endHand();
    }
  }

  resetBettingRound() {
    this.actedPlayers.clear();
    const activePlayers = this.getActivePlayers();
    for (let p of activePlayers) {
      if (!p.folded && !p.isAllIn) p.currentBet = 0;
    }
    this.currentBet = 0;
    this.currentPlayerIndex = this.findFirstActiveAfterDealer();
    this.waitingForAction = true;
    const nextPlayer = this.players.find(p => p.id === this.currentPlayerIndex);
    console.log(`New round (${this.currentRound}), first to act: ${nextPlayer?.name}`);
  }

  findFirstActiveAfterDealer() {
    const activePlayers = this.getActivePlayers().filter(p => !p.folded && !p.isAllIn);
    if (activePlayers.length === 0) return null;
    const dealerIdx = activePlayers.findIndex(p => p.id === this.dealerIndex);
    let idx = (dealerIdx + 1) % activePlayers.length;
    for (let i = 0; i < activePlayers.length; i++) {
      const candidate = activePlayers[(dealerIdx + 1 + i) % activePlayers.length];
      if (!candidate.folded && !candidate.isAllIn) {
        return candidate.id;
      }
    }
    return activePlayers[0]?.id;
  }

  evaluateWinnerWithSidePots() {
    const evaluator = new HandEvaluator();
    const activePlayers = this.getActivePlayers().filter(p => !p.folded);
    if (activePlayers.length === 0) return;

    const hands = {};
    for (let p of activePlayers) {
      const hand = evaluator.evaluate(p.holeCards, this.communityCards);
      hands[p.id] = hand;
      console.log(`${p.name} hand: ${hand.name}`);
    }

    const sorted = [...activePlayers].sort((a, b) => a.totalBet - b.totalBet);
    let prev = 0;
    const pots = [];
    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i].totalBet;
      if (current > prev) {
        const amount = (current - prev) * (sorted.length - i);
        pots.push({
          amount: amount,
          eligiblePlayers: sorted.slice(i).map(p => p.id)
        });
        prev = current;
      }
    }
    let sumPots = pots.reduce((s, p) => s + p.amount, 0);
    if (sumPots < this.pot && pots.length > 0) {
      pots[pots.length - 1].amount += (this.pot - sumPots);
    }

    const winnings = {};
    for (let pot of pots) {
      if (pot.amount === 0) continue;
      let bestPlayers = [];
      let bestHand = null;
      for (let pid of pot.eligiblePlayers) {
        const player = activePlayers.find(p => p.id === pid);
        if (player && !player.folded) {
          const hand = hands[pid];
          if (!bestHand || hand.rank < bestHand.rank || (hand.rank === bestHand.rank && hand.cmp(bestHand) > 0)) {
            bestHand = hand;
            bestPlayers = [player];
          } else if (hand.rank === bestHand.rank && hand.cmp(bestHand) === 0) {
            bestPlayers.push(player);
          }
        }
      }
      const share = Math.floor(pot.amount / bestPlayers.length);
      for (let p of bestPlayers) {
        if (!winnings[p.id]) winnings[p.id] = { amount: 0, handName: bestHand.name };
        winnings[p.id].amount += share;
        winnings[p.id].handName = bestHand.name;
      }
    }

    const results = [];
    const winners = [];
    for (let [pid, win] of Object.entries(winnings)) {
      const player = this.players.find(p => p.id === pid);
      if (player) {
        player.chips += win.amount;
        results.push({ name: player.name, amount: win.amount, handName: win.handName });
        winners.push(player);
        player.stats.handsPlayed += 1;
        player.stats.potsWon += 1;
        if (win.amount > player.stats.biggestPot) player.stats.biggestPot = win.amount;
        if (!player.stats.bestHand || this.compareHands(win.handName, player.stats.bestHand) < 0) {
          player.stats.bestHand = win.handName;
        }
        if (!this._consecutiveWins[pid]) this._consecutiveWins[pid] = 0;
        this._consecutiveWins[pid] += 1;
      }
    }
    for (let p of activePlayers) {
      if (!winnings[p.id]) {
        p.stats.handsPlayed += 1;
        p.stats.losses += 1;
        this._consecutiveWins[p.id] = 0;
      }
    }

    this.winner = {
      names: results.map(r => r.name).join(', '),
      winnings: results.reduce((sum, r) => sum + r.amount, 0),
      handName: results[0]?.handName || '',
      players: results.map(r => ({ name: r.name, cards: this.players.find(p => p.name === r.name)?.holeCards || [] }))
    };
    console.log(`Winner: ${this.winner.names} with ${this.winner.handName}, wins ${this.winner.winnings}`);

    const sideBetResultsTemp = this.payoutSideBets(winners);
    this.sideBetResults = sideBetResultsTemp;
  }

  compareHands(handA, handB) {
    const order = ['Royal Flush', 'Straight Flush', 'Four of a Kind', 'Full House', 'Flush', 'Straight', 'Three of a Kind', 'Two Pair', 'One Pair', 'High Card'];
    const idxA = order.indexOf(handA);
    const idxB = order.indexOf(handB);
    if (idxA === -1) idxA = 999;
    if (idxB === -1) idxB = 999;
    return idxA - idxB;
  }

  checkAchievements() {
    const newAchievements = [];
    for (let player of this.players) {
      if (player.isSpectator) continue;
      const stats = player.stats;
      if (stats.potsWon === 1 && !player.achievements.includes('first_blood')) {
        player.achievements.push('first_blood');
        newAchievements.push({ playerName: player.name, ...ACHIEVEMENTS.FIRST_BLOOD });
      }
      if (this._consecutiveWins[player.id] >= 3 && !player.achievements.includes('hat_trick')) {
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

  placeSideBet(bettorId, targetPlayerId, amount) {
    const bettor = this.players.find(p => p.id === bettorId);
    if (!bettor) return { success: false, message: 'Bettor not found' };
    if (!bettor.folded) return { success: false, message: 'You are still in the hand!' };
    if (this.currentRound === 'river' || this.currentRound === 'showdown') {
      return { success: false, message: 'Betting closed after river' };
    }
    const target = this.players.find(p => p.id === targetPlayerId);
    if (!target || target.folded || target.isAllIn) return { success: false, message: 'Target not active in hand' };
    if (this.sideBets.some(b => b.bettorId === bettorId)) {
      return { success: false, message: 'You already placed a bet this hand' };
    }
    const maxBet = Math.floor(bettor.chips * 0.5);
    if (amount < 10) return { success: false, message: 'Minimum bet 10 chips' };
    if (amount > maxBet) return { success: false, message: `Maximum bet is 50% of your chips (${maxBet})` };
    if (bettor.chips < amount) return { success: false, message: 'Insufficient chips' };

    bettor.chips -= amount;
    this.sideBetsPot += amount;
    this.sideBets.push({ bettorId, targetPlayerId, amount, roundPlaced: this.currentRound });
    return { success: true, message: `Bet ${amount} on ${target.name}`, bettorName: bettor.name, targetName: target.name, amount };
  }

  payoutSideBets(winnerPlayers) {
    if (!winnerPlayers || winnerPlayers.length === 0) return [];
    const winnerIds = winnerPlayers.map(p => p.id);
    const winningBets = this.sideBets.filter(bet => winnerIds.includes(bet.targetPlayerId));
    if (winningBets.length === 0) return [];

    const results = [];
    for (let bet of winningBets) {
      const bettor = this.players.find(p => p.id === bet.bettorId);
      const winner = winnerPlayers.find(w => w.id === bet.targetPlayerId);
      if (bettor && winner) {
        const profit = Math.floor(bet.amount * 0.5);
        bettor.chips += bet.amount + profit;
        results.push({ bettorName: bettor.name, targetName: winner.name, amount: bet.amount, profit });
        console.log(`Side bet win: ${bettor.name} wins ${bet.amount + profit} (bet ${bet.amount} on ${winner.name})`);
      }
    }
    this.sideBets = [];
    this.sideBetsPot = 0;
    return results;
  }

  resetLobby() {
    for (let p of this.players) {
      p.chips = 1000;
      p.isSpectator = false;
      p.ready = false;
      p.folded = false;
      p.isAllIn = false;
      p.currentBet = 0;
      p.totalBet = 0;
      this.scores[p.id] = 0;
      p.stats = { handsPlayed: 0, potsWon: 0, losses: 0, biggestPot: 0, bestHand: '' };
      p.achievements = [];
    }
    this.handInProgress = false;
    this.firstHandStarted = false;
    this.currentRound = 'preflop';
    this.communityCards = [];
    this.pot = 0;
    this.winner = null;
    this.dealerIndex = 0;
    this.paused = false;
    if (this._nextHandTimer) {
      clearTimeout(this._nextHandTimer);
      this._nextHandTimer = null;
    }
    console.log('Lobby reset by admin.');
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    if (this._nextHandTimer) {
      clearTimeout(this._nextHandTimer);
      this._nextHandTimer = null;
    }
    console.log('Game paused.');
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    console.log('Game resumed.');
    if (!this.handInProgress) {
      const active = this.getActivePlayers();
      if (active.length >= 2) {
        console.log('Scheduling hand start after resume...');
        this._nextHandTimer = setTimeout(() => {
          const stillActive = this.getActivePlayers();
          if (stillActive.length >= 2 && !this.handInProgress) {
            console.log('Auto-starting next hand after resume.');
            this.startHand();
          }
          this._nextHandTimer = null;
        }, 4000);
      }
    }
  }

  endHand() {
    this.waitingForAction = false;
    this.handInProgress = false;
    console.log('Hand ended.');

    const playersToSpectate = this.players.filter(p => !p.isSpectator && p.chips === 0);
    for (let p of playersToSpectate) {
      p.isSpectator = true;
      p.ready = false;
      console.log(`${p.name} has 0 chips and became spectator.`);
    }

    const activeNonSpectators = this.players.filter(p => !p.isSpectator);
    if (activeNonSpectators.length === 1 && this.players.length > 1) {
      const champion = activeNonSpectators[0];
      this.scores[champion.id] = (this.scores[champion.id] || 0) + 1;
      console.log(`🏆 ${champion.name} wins the tournament round! Score: ${this.scores[champion.id]}`);
      for (let p of this.players) {
        p.chips = 1000;
        p.isSpectator = false;
        p.ready = false;
      }
    } else if (activeNonSpectators.length === 0) {
      console.log('No players with chips. Waiting for someone to sit in.');
    }

    if (!this.paused) {
      this._nextHandTimer = setTimeout(() => {
        const active = this.players.filter(p => !p.isSpectator);
        if (active.length >= 2 && !this.handInProgress) {
          console.log('Auto-starting next hand...');
          this.startHand();
        } else if (active.length === 1 && this.players.length > 1) {
          console.log('Only one player left. Waiting for more players or reset.');
        }
        this._nextHandTimer = null;
      }, 7000);
    }
  }

  getState() {
    return {
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        chips: p.chips,
        folded: p.folded,
        currentBet: p.currentBet,
        holeCards: p.holeCards,
        isAllIn: p.isAllIn,
        score: this.scores[p.id] || 0,
        ready: p.ready,
        isSpectator: p.isSpectator,
        lastAction: p.lastAction,
        revealed: p.revealed,
        stats: {
          ...p.stats,
          winRate: p.stats.handsPlayed > 0 ? Math.round((p.stats.potsWon / p.stats.handsPlayed) * 100) : 0
        }
      })),
      communityCards: this.communityCards,
      totalPot: this.pot,
      currentRound: this.currentRound,
      currentPlayerId: this.currentPlayerIndex,
      waitingForAction: this.waitingForAction,
      dealerIndex: this.dealerIndex,
      winner: this.winner,
      currentBet: this.currentBet,
      sideBetResults: this.sideBetResults,
      handInProgress: this.handInProgress,
      firstHandStarted: this.firstHandStarted,
      paused: this.paused,
    };
  }
}