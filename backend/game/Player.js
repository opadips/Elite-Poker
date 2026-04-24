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
    this.isSpectator = true; //
  }

  resetForNewHand() {
    this.holeCards = [];
    this.folded = false;
    this.currentBet = 0;
    this.isAllIn = false;
    this.totalBet = 0;
  }
}