// backend/game/Player.js
export class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.chips = 1000;
    this.holeCards = [];
    this.folded = false;
    this.currentBet = 0;
    this.isAllIn = false;
    this.ready = false;
    this.totalBet = 0;
    this.isSpectator = true;
    this.lastAction = { type: '', amount: 0 };
    this.stats = {
      handsPlayed: 0,
      potsWon: 0,
      losses: 0,
      biggestPot: 0,
      bestHand: '',
    };
    this.achievements = [];
    this.revealed = false;
  }

  resetForNewHand() {
    this.holeCards = [];
    this.folded = false;
    this.currentBet = 0;
    this.isAllIn = false;
    this.totalBet = 0;
    this.lastAction = { type: '', amount: 0 };
  }
}