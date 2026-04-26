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
    this.minRaise = this.bigBlind;
    this.lastRaiseBy = null;
    this.waitingForAction = false;
    this.dealerIndex = 0;
    this.winner = null;
    this.handInProgress = false;
    this.actedPlayers = new Set();
    this.scores = {};
    this.sideBets = [];
    this.sideBetResults = [];
    this.firstHandStarted = false;
    this.paused = false;
    this._nextHandTimer = null;
    this._consecutiveWins = {};
    this._allInResolving = false;
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
    this.minRaise = this.bigBlind;
    this.lastRaiseBy = null;
    this.currentRound = 'preflop';
    this.winner = null;
    this.waitingForAction = true;
    this.actedPlayers.clear();
    this.sideBets = [];
    this.sideBetResults = [];
    this._allInResolving = false;

    for (let p of activePlayers) {
      if (p.chips <= 0) {
        console.log(`${p.name} had 0 chips, resetting to 1000`);
        p.chips = 1000;
      }
      p.resetForNewHand();
      p.holeCards = [this.deck.draw(), this.deck.draw()];
      p.revealed = false;
      console.log(`${p.name} cards: ${p.holeCards[0].rank}${p.holeCards[0].suit} ${p.holeCards[1].rank}${p.holeCards[1].suit}`);
    }

    const activeIds = activePlayers.map(p => p.id);
    let currentDealerIndex = activeIds.indexOf(this.dealerIndex);
    if (currentDealerIndex === -1) currentDealerIndex = 0;
    this.dealerIndex = activeIds[(currentDealerIndex + 1) % activePlayers.length];
    const dealerIdxInActive = activeIds.indexOf(this.dealerIndex);
    const sbIdx = (dealerIdxInActive + 1) % activePlayers.length;
    const bbIdx = (dealerIdxInActive + 2) % activePlayers.length;

    const sbPlayer = activePlayers[sbIdx];
    const bbPlayer = activePlayers[bbIdx];

    this.postBlind(sbPlayer, this.smallBlind);
    this.postBlind(bbPlayer, this.bigBlind);
    this.currentBet = this.bigBlind;
    this.minRaise = this.bigBlind;
    this.lastRaiseBy = bbPlayer.id;

    console.log(`SB: ${sbPlayer.name} (${this.smallBlind}), BB: ${bbPlayer.name} (${this.bigBlind})`);
    this.currentPlayerIndex = activePlayers[(bbIdx + 1) % activePlayers.length].id;
    console.log(`First to act: ${this.players.find(p => p.id === this.currentPlayerIndex)?.name}`);
  }

  postBlind(player, amount) {
    const actual = Math.min(amount, player.chips);
    player.chips -= actual;
    player.currentBet = actual;
    player.totalBet += actual;
    this.pot += actual;
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
      this.actedPlayers.add(playerId);
      this.checkForSoloSurvivor();
      if (!this.handInProgress) return;
      this.nextPlayer();
    } else if (action === 'check' && toCall === 0) {
      this.actedPlayers.add(playerId);
      this.nextPlayer();
    } else if (action === 'call') {
      let callAmount = Math.min(toCall, player.chips);
      player.chips -= callAmount;
      player.currentBet += callAmount;
      player.totalBet += callAmount;
      this.pot += callAmount;
      if (player.chips === 0) player.isAllIn = true;
      this.actedPlayers.add(playerId);
      this.nextPlayer();
    } else if (action === 'raise') {
      let raiseAmount = Math.max(amount, this.bigBlind);
      let totalNeeded = toCall + raiseAmount;
      if (totalNeeded > player.chips) {
        totalNeeded = player.chips;
        raiseAmount = totalNeeded - toCall;
      }
      const totalBetAfter = player.currentBet + totalNeeded;
      if (totalBetAfter <= this.currentBet) return;
      if (raiseAmount < this.minRaise && totalBetAfter - this.currentBet < this.minRaise) {
        return;
      }
      const added = totalNeeded;
      player.chips -= added;
      player.currentBet += added;
      player.totalBet += added;
      this.pot += added;
      if (player.chips === 0) player.isAllIn = true;
      this.minRaise = player.currentBet - this.currentBet;
      this.currentBet = player.currentBet;
      this.lastRaiseBy = playerId;
      this.actedPlayers.clear();
      this.actedPlayers.add(playerId);
      this.nextPlayer();
    } else if (action === 'allin') {
      let total = player.chips;
      player.chips = 0;
      player.currentBet += total;
      player.totalBet += total;
      this.pot += total;
      player.isAllIn = true;
      if (player.currentBet > this.currentBet) {
        this.minRaise = player.currentBet - this.currentBet;
        this.currentBet = player.currentBet;
        this.lastRaiseBy = playerId;
      }
      this.actedPlayers.clear();
      this.actedPlayers.add(playerId);
      this.nextPlayer();
    }

    if (!this.handInProgress) return;
    this.checkRoundComplete();
  }

  checkForSoloSurvivor() {
    const activeInHand = this.getActivePlayers().filter(p => !p.folded);
    if (activeInHand.length === 1) {
      const winner = activeInHand[0];
      winner.chips += this.pot;
      const handName = this.evaluatePlayerHand(winner);
      this.winner = {
        names: winner.name,
        winnings: this.pot,
        handName: handName,
        players: [{ name: winner.name, cards: winner.holeCards }]
      };
      console.log(`Winner by fold: ${winner.name}`);
      this.endHand();
    }
  }

  nextPlayer() {
    if (!this.handInProgress) return;
    if (this._allInResolving) return;
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
    if (!found) this.handleAllAllIn();
  }

  handleAllAllIn() {
    if (this._allInResolving) return;
    const activePlayers = this.getActivePlayers().filter(p => !p.folded);
    if (activePlayers.length === 0) return;
    const allAllIn = activePlayers.every(p => p.isAllIn) || activePlayers.length === 1;
    if (!allAllIn) return;
    this._allInResolving = true;
    console.log('All players all-in (or single player). Revealing remaining cards with delay...');
    this.waitingForAction = false;
    const revealStep = () => {
      if (!this._allInResolving) return;
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
        this.runShowdown();
        this.endHand();
        this._allInResolving = false;
      }
    };
    revealStep();
  }

  checkRoundComplete() {
    if (!this.handInProgress) return;
    if (this._allInResolving) return;
    const activePlayers = this.getActivePlayers().filter(p => !p.folded && !p.isAllIn);
    if (activePlayers.length === 0) {
      if (!this._allInResolving) this.handleAllAllIn();
      return;
    }
    const allActed = activePlayers.every(p => this.actedPlayers.has(p.id));
    const allBetsEqual = activePlayers.every(p => p.currentBet === this.currentBet);
    console.log(`Round check: allActed=${allActed}, allBetsEqual=${allBetsEqual}`);
    if (allActed && allBetsEqual) {
      this.advanceRound();
    }
  }

  advanceRound() {
    if (this.currentRound === 'preflop') {
      this.communityCards = [this.deck.draw(), this.deck.draw(), this.deck.draw()];
      console.log(`Flop: ${this.communityCards.map(c => c.rank + c.suit).join(', ')}`);
      this.currentRound = 'flop';
      this.resetBettingRound();
    } else if (this.currentRound === 'flop') {
      this.communityCards.push(this.deck.draw());
      console.log(`Turn: ${this.communityCards[3].rank}${this.communityCards[3].suit}`);
      this.currentRound = 'turn';
      this.resetBettingRound();
    } else if (this.currentRound === 'turn') {
      this.communityCards.push(this.deck.draw());
      console.log(`River: ${this.communityCards[4].rank}${this.communityCards[4].suit}`);
      this.currentRound = 'river';
      this.resetBettingRound();
    } else if (this.currentRound === 'river') {
      this.runShowdown();
      this.endHand();
    }
  }

  resetBettingRound() {
    this.actedPlayers.clear();
    const active = this.getActivePlayers().filter(p => !p.folded && !p.isAllIn);
    for (let p of active) {
      p.currentBet = 0;
    }
    this.currentBet = 0;
    this.minRaise = this.bigBlind;
    this.lastRaiseBy = null;
    this.currentPlayerIndex = this.findFirstActiveAfterDealer();
    this.waitingForAction = true;
    const nextPlayer = this.players.find(p => p.id === this.currentPlayerIndex);
    console.log(`New round (${this.currentRound}), first to act: ${nextPlayer?.name}`);
  }

  findFirstActiveAfterDealer() {
    const active = this.getActivePlayers().filter(p => !p.folded && !p.isAllIn);
    if (active.length === 0) return null;
    const dealerIdx = active.findIndex(p => p.id === this.dealerIndex);
    for (let i = 1; i <= active.length; i++) {
      const candidate = active[(dealerIdx + i) % active.length];
      if (!candidate.folded && !candidate.isAllIn) return candidate.id;
    }
    return active[0]?.id;
  }

  runShowdown() {
    const evaluator = new HandEvaluator();
    const contenders = this.getActivePlayers().filter(p => !p.folded);
    if (contenders.length === 0) return;

    const hands = {};
    for (let p of contenders) {
      hands[p.id] = evaluator.evaluate(p.holeCards, this.communityCards);
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
    if (sumSide < this.pot && sidePots.length > 0) {
      sidePots[sidePots.length - 1].amount += (this.pot - sumSide);
    }

    const winnings = {};
    const dealerPos = this.getActivePlayers().findIndex(p => p.id === this.dealerIndex);

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
        const idxA = this.getActivePlayers().findIndex(p => p.id === a.id);
        const idxB = this.getActivePlayers().findIndex(p => p.id === b.id);
        const distA = (idxA - dealerPos + this.getActivePlayers().length) % this.getActivePlayers().length;
        const distB = (idxB - dealerPos + this.getActivePlayers().length) % this.getActivePlayers().length;
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
      const player = this.players.find(p => p.id === pid);
      if (player) {
        player.chips += win.amount;
        results.push({ name: player.name, amount: win.amount, handName: win.handName });
        allWinners.push(player);
        player.stats.handsPlayed += 1;
        player.stats.potsWon += 1;
        if (win.amount > player.stats.biggestPot) player.stats.biggestPot = win.amount;
        if (!player.stats.bestHand || this.compareHandNames(win.handName, player.stats.bestHand) < 0) {
          player.stats.bestHand = win.handName;
        }
        if (!this._consecutiveWins[pid]) this._consecutiveWins[pid] = 0;
        this._consecutiveWins[pid] += 1;
      }
    }
    for (let p of contenders) {
      if (!winnings[p.id]) {
        p.stats.handsPlayed += 1;
        p.stats.losses += 1;
        this._consecutiveWins[p.id] = 0;
      }
    }

    this.winner = {
      names: results.map(r => r.name).join(', '),
      winnings: results.reduce((s, r) => s + r.amount, 0),
      handName: results[0]?.handName || '',
      players: results.map(r => ({ name: r.name, cards: this.players.find(p => p.name === r.name)?.holeCards || [] }))
    };
    console.log(`Winner: ${this.winner.names} with ${this.winner.handName}, wins ${this.winner.winnings}`);

    this.sideBetResults = this.resolveSideBets(allWinners);
  }

  resolveSideBets(winnerPlayers) {
    if (!winnerPlayers.length || this.sideBets.length === 0) {
      this.sideBets = [];
      return [];
    }
    const winnerIds = new Set(winnerPlayers.map(p => p.id));
    const winningBets = this.sideBets.filter(b => winnerIds.has(b.targetPlayerId));
    if (winningBets.length === 0) {
      this.sideBets = [];
      return [];
    }
    const results = [];
    for (let bet of winningBets) {
      const bettor = this.players.find(p => p.id === bet.bettorId);
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
    this.sideBets = [];
    return results;
  }

  placeSideBet(bettorId, targetId, amount) {
    const bettor = this.players.find(p => p.id === bettorId);
    if (!bettor) return { success: false, message: 'Bettor not found' };
    if (!bettor.folded) return { success: false, message: 'You are still in the hand!' };
    if (this.currentRound === 'river' || this.currentRound === 'showdown') {
      return { success: false, message: 'Betting closed after river' };
    }
    const target = this.players.find(p => p.id === targetId);
    if (!target || target.folded || target.isAllIn) return { success: false, message: 'Target not active in hand' };
    if (this.sideBets.some(b => b.bettorId === bettorId)) {
      return { success: false, message: 'You already placed a bet this hand' };
    }
    const maxBet = Math.floor(bettor.chips * 0.5);
    if (amount < 10 || amount > maxBet) return { success: false, message: `Bet must be 10-${maxBet} chips` };
    if (bettor.chips < amount) return { success: false, message: 'Insufficient chips' };

    bettor.chips -= amount;
    this.sideBets.push({ bettorId, targetPlayerId: targetId, amount });
    console.log(`${bettor.name} placed side bet ${amount} on ${target.name}`);
    return { success: true, bettorName: bettor.name, targetName: target.name, amount };
  }

  compareHandNames(a, b) {
    const order = ['Royal Flush','Straight Flush','Four of a Kind','Full House','Flush','Straight','Three of a Kind','Two Pair','One Pair','High Card'];
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  }

  evaluatePlayerHand(player) {
    const evaluator = new HandEvaluator();
    if (this.communityCards.length === 0) {
      const [c1, c2] = player.holeCards;
      if (c1.rank === c2.rank) return 'Pair';
      if (c1.rank === 'A' || c2.rank === 'A') return 'Ace High';
      return 'High Card';
    }
    return evaluator.evaluate(player.holeCards, this.communityCards).name;
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

  resetLobby() {
    for (let p of this.players) {
      p.chips = 1000;
      p.isSpectator = false;
      p.ready = false;
      p.resetForNewHand();
      p.revealed = false;
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
    this._allInResolving = false;
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
          if (this.getActivePlayers().length >= 2 && !this.handInProgress) {
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

    const busted = this.players.filter(p => !p.isSpectator && p.chips === 0);
    for (let p of busted) {
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
      startingChips: this.startingChips,
    };
  }
}