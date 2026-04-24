import { Player } from './Player.js';
import { Deck } from './Deck.js';
import { HandEvaluator } from './HandEvaluator.js';

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
  }

  addPlayer(name) {
    const id = `${Date.now()}-${Math.random()}-${name}`;
    const player = new Player(id, name);
    player.ready = false;
    this.players.push(player);
    this.scores[id] = 0;
    console.log(`Player ${name} joined, total: ${this.players.length}`);
    return id;
  }

  removePlayer(id) {
    this.players = this.players.filter(p => p.id !== id);
    delete this.scores[id];
    if (this.players.length < 2) {
      this.handInProgress = false;
      this.firstHandStarted = false;
    }
  }

  toggleReady(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { success: false, message: 'Player not found' };
    if (this.handInProgress) return { success: false, message: 'Game already in progress' };
    player.ready = !player.ready;
    console.log(`${player.name} is now ${player.ready ? 'ready' : 'not ready'}`);
    
    if (this.players.length >= 2 && this.players.every(p => p.ready) && !this.handInProgress && !this.firstHandStarted) {
      console.log('All players ready for first hand! Starting...');
      this.firstHandStarted = true;
      this.startHand();
    }
    return { success: true, ready: player.ready };
  }

  startHand() {
    if (this.players.length < 2) return;
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

    for (let p of this.players) {
      if (p.chips === undefined || p.chips === 0) p.chips = 1000;
      p.folded = false;
      p.currentBet = 0;
      p.isAllIn = false;
      p.holeCards = [this.deck.draw(), this.deck.draw()];
      console.log(`${p.name} cards: ${p.holeCards[0].rank}${p.holeCards[0].suit} ${p.holeCards[1].rank}${p.holeCards[1].suit}`);
    }

    this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
    const sbIdx = (this.dealerIndex + 1) % this.players.length;
    const bbIdx = (this.dealerIndex + 2) % this.players.length;
    
    const sb = this.players[sbIdx];
    const bb = this.players[bbIdx];
    
    this.postBlind(sb, this.smallBlind);
    this.postBlind(bb, this.bigBlind);
    this.currentBet = this.bigBlind;
    
    console.log(`SB: ${sb.name} (${this.smallBlind}), BB: ${bb.name} (${this.bigBlind})`);
    this.currentPlayerIndex = (bbIdx + 1) % this.players.length;
    console.log(`First to act: ${this.players[this.currentPlayerIndex]?.name}`);
  }

  postBlind(player, amount) {
    const actual = Math.min(amount, player.chips);
    player.chips -= actual;
    player.currentBet = actual;
    this.pot += actual;
    this.actedPlayers.add(player.id);
    if (player.chips === 0) player.isAllIn = true;
  }

  playerAction(playerId, action, amount = 0) {
    if (!this.waitingForAction) return;
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.folded || player.isAllIn) return;
    if (this.players[this.currentPlayerIndex].id !== playerId) return;

    const toCall = this.currentBet - player.currentBet;
    console.log(`${player.name} action: ${action}, toCall=${toCall}, chips=${player.chips}`);

    if (action === 'fold') {
      player.folded = true;
      this.actedPlayers.add(player.id);
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
      this.pot += total;
      player.isAllIn = true;
      if (player.currentBet > this.currentBet) this.currentBet = player.currentBet;
      this.actedPlayers.clear();
      this.actedPlayers.add(player.id);
      this.nextPlayer();
    }
    this.checkRoundComplete();
  }

  nextPlayer() {
    // یافتن بازیکن بعدی که فولد نکرده و All‑in نبوده و چیپ دارد (برای اکشن)
    let start = this.currentPlayerIndex;
    let found = false;
    for (let i = 0; i < this.players.length; i++) {
      const idx = (start + 1 + i) % this.players.length;
      if (!this.players[idx].folded && !this.players[idx].isAllIn && this.players[idx].chips > 0) {
        this.currentPlayerIndex = idx;
        found = true;
        console.log(`Next player: ${this.players[this.currentPlayerIndex]?.name}`);
        break;
      }
    }
    if (!found) {
      // هیچ بازیکن فعالی (غیر All‑in) باقی نمانده است => همه All‑in یا فولد شده‌اند
      console.log('No active players left, completing round...');
      this.completeRound();
    }
  }

  completeRound() {
    // اگر همه بازیکنان All‑in یا فولد شده باشند، ولی کارت‌های مشترک کامل نشده، باید خودکار تکمیل شوند
    const activePlayers = this.players.filter(p => !p.folded && !p.isAllIn && p.chips > 0);
    if (activePlayers.length === 0) {
      // همه غیرفعال – برنده کسی است که فولد نکرده
      const winner = this.players.find(p => !p.folded);
      if (winner) {
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
      // ادامه دادن راندها برای نمایش کارت‌های جدید
      if (this.currentRound !== 'showdown') {
        this.nextRound();
      } else {
        this.evaluateWinner();
        this.endHand();
      }
    }
  }

  checkRoundComplete() {
    const activePlayers = this.players.filter(p => !p.folded && !p.isAllIn && p.chips > 0);
    if (activePlayers.length === 0) {
      // همه All‑in یا فولد شده‌اند → راند شرط‌بندی تمام شده، باید کارت‌های بعدی نشان داده شوند
      if (this.currentRound !== 'showdown') {
        this.nextRound();
      } else {
        this.evaluateWinner();
        this.endHand();
      }
      return;
    }
    if (activePlayers.length === 1) {
      // فقط یک بازیکن فعال (غیر All‑in) باقی مانده – او برنده است (سایرین فولد یا All‑in هستند)
      const winner = activePlayers[0];
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
      console.log(`Flop: ${this.communityCards.map(c=>c.rank+c.suit).join(', ')}`);
      this.resetBettingRound();
    }
    else if (this.currentRound === 'flop') {
      this.currentRound = 'turn';
      this.communityCards.push(this.deck.draw());
      console.log(`Turn: ${this.communityCards[3].rank}${this.communityCards[3].suit}`);
      this.resetBettingRound();
    }
    else if (this.currentRound === 'turn') {
      this.currentRound = 'river';
      this.communityCards.push(this.deck.draw());
      console.log(`River: ${this.communityCards[4].rank}${this.communityCards[4].suit}`);
      this.resetBettingRound();
    }
    else if (this.currentRound === 'river') {
      this.currentRound = 'showdown';
      this.evaluateWinner();
      this.endHand();
    }
  }

  resetBettingRound() {
    this.actedPlayers.clear();
    for (let p of this.players) {
      if (!p.folded && !p.isAllIn) p.currentBet = 0;
    }
    this.currentBet = 0;
    this.currentPlayerIndex = this.findFirstActiveAfterDealer();
    this.waitingForAction = true;
    console.log(`New round (${this.currentRound}), first to act: ${this.players[this.currentPlayerIndex]?.name}`);
  }

  findFirstActiveAfterDealer() {
    let idx = (this.dealerIndex + 1) % this.players.length;
    for (let i = 0; i < this.players.length; i++) {
      const candidate = (this.dealerIndex + 1 + i) % this.players.length;
      if (!this.players[candidate].folded && !this.players[candidate].isAllIn && this.players[candidate].chips > 0) {
        return candidate;
      }
    }
    return idx;
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

  payoutSideBets(winnerPlayer) {
    if (!winnerPlayer) return [];
    const winningBets = this.sideBets.filter(bet => bet.targetPlayerId === winnerPlayer.id);
    if (winningBets.length === 0) return [];

    const results = [];
    for (let bet of winningBets) {
      const bettor = this.players.find(p => p.id === bet.bettorId);
      if (bettor) {
        const profit = Math.floor(bet.amount * 0.5);
        bettor.chips += bet.amount + profit;
        results.push({ bettorName: bettor.name, targetName: winnerPlayer.name, amount: bet.amount, profit });
        console.log(`Side bet win: ${bettor.name} wins ${bet.amount + profit} (bet ${bet.amount} on ${winnerPlayer.name})`);
      }
    }
    this.sideBets = [];
    this.sideBetsPot = 0;
    return results;
  }

  evaluateWinner() {
    const evaluator = new HandEvaluator();
    const eligible = this.players.filter(p => !p.folded);
    if (eligible.length === 0) return;

    let bestHand = null;
    let bestPlayers = [];
    let bestHandName = '';
    for (let p of eligible) {
      const hand = evaluator.evaluate(p.holeCards, this.communityCards);
      console.log(`${p.name} hand: ${hand.name}`);
      if (!bestHand || hand.rank < bestHand.rank || (hand.rank === bestHand.rank && hand.cmp(bestHand) > 0)) {
        bestHand = hand;
        bestPlayers = [p];
        bestHandName = hand.name;
      } else if (hand.rank === bestHand.rank && hand.cmp(bestHand) === 0) {
        bestPlayers.push(p);
      }
    }
    const share = Math.floor(this.pot / bestPlayers.length);
    for (let p of bestPlayers) p.chips += share;
    this.winner = {
      names: bestPlayers.map(p => p.name).join(', '),
      winnings: share,
      handName: bestHandName,
      players: bestPlayers.map(p => ({ name: p.name, cards: p.holeCards }))
    };
    console.log(`Winner: ${this.winner.names} with ${bestHandName}, wins ${share}`);
    
    const mainWinner = bestPlayers[0];
    const sideBetResultsTemp = this.payoutSideBets(mainWinner);
    this.sideBetResults = sideBetResultsTemp;
  }

  endHand() {
    this.waitingForAction = false;
    this.handInProgress = false;
    console.log('Hand ended.');

    const playersWithChips = this.players.filter(p => p.chips > 0);
    if (playersWithChips.length === 1 && this.players.length > 1) {
      const champion = playersWithChips[0];
      this.scores[champion.id] = (this.scores[champion.id] || 0) + 1;
      console.log(`🏆 ${champion.name} wins the tournament round! Score: ${this.scores[champion.id]}`);
      for (let p of this.players) {
        p.chips = 1000;
        p.isAllIn = false;
        p.folded = false;
      }
    }

    setTimeout(() => {
      if (this.players.length >= 2 && !this.handInProgress) {
        console.log('Auto-starting next hand...');
        this.startHand();
      }
    }, 4000);
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
        ready: p.ready || false
      })),
      communityCards: this.communityCards,
      totalPot: this.pot,
      currentRound: this.currentRound,
      currentPlayerId: this.players[this.currentPlayerIndex]?.id,
      waitingForAction: this.waitingForAction,
      dealerIndex: this.dealerIndex,
      winner: this.winner,
      currentBet: this.currentBet,
      sideBetResults: this.sideBetResults,
      handInProgress: this.handInProgress,
      firstHandStarted: this.firstHandStarted
    };
  }
}