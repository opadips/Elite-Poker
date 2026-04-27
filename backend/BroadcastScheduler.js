export class BroadcastScheduler {
  constructor(lobbyManager, clientRegistry, broadcastFns, timerUtils) {
    this.lobbyManager = lobbyManager;
    this.clientRegistry = clientRegistry;
    this.broadcastGameState = broadcastFns.broadcastGameState;
    this.broadcastChat = broadcastFns.broadcastChat;
    this.broadcastSystemMessage = broadcastFns.broadcastSystemMessage;
    this.broadcastAchievement = broadcastFns.broadcastAchievement;
    this.broadcastSideBetWin = broadcastFns.broadcastSideBetWin;
    this.broadcastLobbyList = broadcastFns.broadcastLobbyList;
    this.broadcastOnlinePlayers = broadcastFns.broadcastOnlinePlayers;
    this.timerUtils = timerUtils;

    this.lastWinnerMessageMap = new Map();
    this.lastSideBetMessageMap = new Map();
  }

  start() {
    this._winnerCheckInterval = setInterval(() => this._checkWinners(), 500);
    this._boardcastInterval = setInterval(() => this._broadcastPeriodic(), 2000);
  }

  stop() {
    if (this._winnerCheckInterval) {
      clearInterval(this._winnerCheckInterval);
      this._winnerCheckInterval = null;
    }
    if (this._boardcastInterval) {
      clearInterval(this._boardcastInterval);
      this._boardcastInterval = null;
    }
  }

  _checkWinners() {
    for (const [lobbyId, lobby] of this.lobbyManager.lobbies.entries()) {
      const state = lobby.game.getState();
      const lastWinner = this.lastWinnerMessageMap.get(lobbyId);
      if (state.winner && state.winner !== lastWinner) {
        this.lastWinnerMessageMap.set(lobbyId, state.winner);
        const totalWinning = state.winner.winnings;
        const hand = state.winner.handName;
        const winnerNames = state.winner.names;
        this.broadcastChat(lobbyId, 'SYSTEM', `🏆 ${winnerNames} won ${totalWinning} chips with ${hand}! 🏆`);
        this.broadcastSystemMessage(lobbyId, `🏆 ${winnerNames} wins with ${hand}!`);

        const newAchievements = lobby.game.checkAchievements();
        for (const ach of newAchievements) {
          this.broadcastAchievement(lobbyId, ach);
          this.broadcastSystemMessage(lobbyId, `🎖️ ${ach.playerName} earned: ${ach.name} – ${ach.desc}`);
        }

        const historyEntry = `Hand: ${state.winner.handName} - Winner: ${winnerNames} (Pot: ${totalWinning})`;
        this.lobbyManager.addHandHistory(lobbyId, historyEntry);
      }

      const lastSide = this.lastSideBetMessageMap.get(lobbyId);
      if (state.sideBetResults && state.sideBetResults !== lastSide) {
        this.lastSideBetMessageMap.set(lobbyId, state.sideBetResults);
        for (let res of state.sideBetResults) {
          const totalWin = res.amount + res.profit;
          this.broadcastChat(lobbyId, 'SYSTEM', `🎉 ${res.bettorName} won ${totalWin} chips from side bet on ${res.targetName}! 🎉`);
          this.broadcastSystemMessage(lobbyId, `🎲 Side bet: ${res.bettorName} won ${totalWin} chips (bet on ${res.targetName})`);
          this.broadcastSideBetWin(lobbyId, res.bettorName, res.targetName, res.amount, res.profit);
        }
      }

      this.timerUtils.ensureTurnTimer(lobbyId, this.lobbyManager, this.clientRegistry, this.broadcastGameState);
    }
  }

  _broadcastPeriodic() {
    this.broadcastLobbyList();
    this.broadcastOnlinePlayers();
    for (const [lobbyId] of this.lobbyManager.lobbies.entries()) {
      this.broadcastGameState(lobbyId);
    }
  }
}