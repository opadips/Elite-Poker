export class PotManager {
  constructor() {
    this.pots = [];
    this.mainPot = 0;
  }
  addToMainPot(amount) {
    this.mainPot += amount;
  }
  getTotalPot() {
    return this.mainPot + this.pots.reduce((sum,p)=>sum+p.amount,0);
  }
  getPots() {
    return [{ amount: this.mainPot, eligiblePlayers: [] }];
  }
}