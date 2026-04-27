import { Player } from './Player.js';
import { Deck } from './Deck.js';
import { HandEvaluator } from './HandEvaluator.js';
import * as BettingRound from './BettingRound.js';
import * as PotManager from './PotManager.js';
import { applyTournamentRules } from './TournamentManager.js';
import { checkAchievements } from './AchievementTracker.js';
import { startHand, postBlind } from './HandLifecycle.js';
import { validateAction } from './PlayerActionValidator.js';
import { DEFAULT_STARTING_CHIPS, DEFAULT_SMALL_BLIND, DEFAULT_BIG_BLIND, RESUME_HAND_START_DELAY_MS, AUTO_HAND_START_DELAY_MS } from '../constants.js';

export class Game {
  constructor() {
    this.players = [];
    this.deck = null;
    this.communityCards = [];
    this.pot = 0;
    this.currentRound = 'preflop';
    this.currentPlayerIndex = 0;
    this.smallBlind = DEFAULT_SMALL_BLIND;
    this.bigBlind = DEFAULT_BIG_BLIND;
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
    this.startingChips = DEFAULT_STARTING_CHIPS;
    this.mode = 'tournament';
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
    player.chips = this.startingChips;
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
    startHand(this);
  }

  postBlind(player, amount) {
    postBlind(this, player, amount);
  }

  playerAction(playerId, action, amount = 0) {
    const validation = validateAction(this, playerId);
    if (!validation) return;
    const { player, toCall } = validation;

    console.log(`${player.name} action: ${action}, toCall=${toCall}, chips=${player.chips}`);

    player.lastAction = { type: action, amount: amount || 0 };

    if (action === 'fold') {
      player.folded = true;
      this.actedPlayers.add(playerId);
      this.checkForSoloSurvivor();
      if (!this.handInProgress) return;
      BettingRound.nextPlayer(this);
    } else if (action === 'check' && toCall === 0) {
      this.actedPlayers.add(playerId);
      BettingRound.nextPlayer(this);
    } else if (action === 'call') {
      let callAmount = Math.min(toCall, player.chips);
      player.chips -= callAmount;
      player.currentBet += callAmount;
      player.totalBet += callAmount;
      this.pot += callAmount;
      if (player.chips === 0) player.isAllIn = true;
      this.actedPlayers.add(playerId);
      BettingRound.nextPlayer(this);
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
      BettingRound.nextPlayer(this);
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
      BettingRound.nextPlayer(this);
    }

    if (!this.handInProgress) return;
    BettingRound.checkRoundComplete(this);
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
    BettingRound.nextPlayer(this);
  }

  handleAllAllIn() {
    BettingRound.handleAllAllIn(this);
  }

  advanceRound() {
    BettingRound.advanceRound(this);
  }

  runShowdown() {
    PotManager.runShowdown(this);
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

  checkAchievements() {
    return checkAchievements(this);
  }

  resetLobby() {
    for (let p of this.players) {
      p.chips = this.startingChips;
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
    this.waitingForAction = false;   // <-- جدید
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
        }, RESUME_HAND_START_DELAY_MS);
      }
    }
  }

  endHand() {
    this.waitingForAction = false;
    this.handInProgress = false;
    console.log('Hand ended.');

    if (this.mode === 'tournament') {
      applyTournamentRules(this);
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
      }, AUTO_HAND_START_DELAY_MS);
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