export class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.chips = 1000;
    this.holeCards = [];
    this.folded = false;
    this.currentBet = 0;
    this.hasActed = false;
  }

  resetForNewHand() {
    this.holeCards = [];
    this.folded = false;
    this.currentBet = 0;
    this.hasActed = false;
  }
}