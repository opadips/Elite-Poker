// backend/BroadcastScheduler.js
import { getDealerMessage } from './game/dealerMessages.js';

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
    this.broadcastDealerMessage = broadcastFns.broadcastDealerMessage;
    this.timerUtils = timerUtils;

    this.lastWinnerMessageMap = new Map();
    this.lastSideBetMessageMap = new Map();
    this.broadcastedAchievementKeys = new Map();
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
        this.timerUtils.stopTurnTimerBroadcast(lobbyId);
        this.lastWinnerMessageMap.set(lobbyId, state.winner);
        const msg = getDealerMessage('handComplete', {
          names: state.winner.names,
          winnings: state.winner.winnings,
          hand: state.winner.handName
        });
        if (msg) this.broadcastDealerMessage(lobbyId, msg);

        const newAchievements = lobby.game.checkAchievements();
        for (const ach of newAchievements) {
          const key = `${lobbyId}-${ach.playerId || ach.playerName}-${ach.name}`;
          if (!this.broadcastedAchievementKeys.has(key)) {
            this.broadcastedAchievementKeys.set(key, true);
            this.broadcastAchievement(lobbyId, ach);
            const achMsg = getDealerMessage('achievementEarned', {
              player: ach.playerName,
              name: ach.name,
              desc: ach.desc
            });
            if (achMsg) this.broadcastDealerMessage(lobbyId, achMsg);
          }
        }

        const historyEntry = `Hand: ${state.winner.handName} - Winner: ${state.winner.names} (Pot: ${state.winner.winnings})`;
        this.lobbyManager.addHandHistory(lobbyId, historyEntry);
      }

      const lastSide = this.lastSideBetMessageMap.get(lobbyId);
      if (state.sideBetResults && state.sideBetResults !== lastSide) {
        this.lastSideBetMessageMap.set(lobbyId, state.sideBetResults);
        for (let res of state.sideBetResults) {
          let msg = null;
          if (res.refunded) {
            msg = getDealerMessage('sideBetRefund', {
              bettor: res.bettorName,
              amount: res.amount
            });
          } else {
            msg = getDealerMessage('sideBetWin', {
              bettor: res.bettorName,
              target: res.targetName,
              amount: res.amount,
              profit: res.profit
            });
          }
          if (msg) this.broadcastDealerMessage(lobbyId, msg);
          this.broadcastSideBetWin(lobbyId, res.bettorName, res.targetName, res.amount, res.profit, res.refunded || false);
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