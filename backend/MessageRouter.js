import * as lobbyHandlers from './handlers/lobbyHandlers.js';
import * as gameHandlers from './handlers/gameHandlers.js';

export function createMessageRouter(deps) {
  const {
    lobbyManager,
    clientRegistry,
    broadcastGameState,
    broadcastSystemMessage,
    broadcastChat,
    broadcastGeneralChat,
    broadcastOnlinePlayers,
    broadcastLobbyList,
    broadcastAchievement,
    broadcastSideBetWin,
    broadcastAllInSound,
    setupLobbyCallbacks,
    generalChat,
    timerUtils,
  } = deps;

  return function route(msg, ws) {
    const { type } = msg;
    if (type === 'join') {
      lobbyHandlers.handleJoin(msg, ws, clientRegistry, broadcastLobbyList, broadcastOnlinePlayers, generalChat);
    } else if (type === 'createLobby') {
      lobbyHandlers.handleCreateLobby(msg, ws, clientRegistry, lobbyManager, broadcastGameState, broadcastSystemMessage, broadcastLobbyList, broadcastOnlinePlayers, setupLobbyCallbacks);
    } else if (type === 'joinLobby') {
      lobbyHandlers.handleJoinLobby(msg, ws, clientRegistry, lobbyManager, broadcastGameState, broadcastSystemMessage, broadcastLobbyList, broadcastOnlinePlayers, setupLobbyCallbacks);
    } else if (type === 'leaveLobby') {
      lobbyHandlers.handleLeaveLobby(ws, clientRegistry, lobbyManager, broadcastGameState, broadcastSystemMessage, broadcastLobbyList, broadcastOnlinePlayers);
    } else if (type === 'returnToLobby') {
      lobbyHandlers.handleReturnToLobby(ws, clientRegistry, lobbyManager, broadcastGameState, broadcastSystemMessage, broadcastLobbyList, broadcastOnlinePlayers, timerUtils.clearAllTimers);
    } else if (type === 'listLobbies') {
      lobbyHandlers.handleListLobbies(ws, clientRegistry, broadcastLobbyList, broadcastOnlinePlayers);
    } else if (type === 'lobbyChat') {
      lobbyHandlers.handleLobbyChat(msg, ws, clientRegistry, broadcastGeneralChat);
    } else if (type === 'resetLobby') {
      gameHandlers.handleResetLobby(msg, ws, clientRegistry, lobbyManager, broadcastGameState, broadcastSystemMessage, timerUtils.clearAllTimers);
    } else if (type === 'action') {
      gameHandlers.handleAction(msg, ws, clientRegistry, lobbyManager, broadcastGameState, broadcastAllInSound, timerUtils.stopTurnTimerBroadcast, timerUtils.ensureTurnTimer);
    } else if (type === 'ready') {
      gameHandlers.handleReady(msg, ws, clientRegistry, lobbyManager, broadcastGameState, broadcastSystemMessage);
    } else if (type === 'sitIn') {
      gameHandlers.handleSitIn(msg, ws, clientRegistry, lobbyManager, broadcastGameState, broadcastSystemMessage);
    } else if (type === 'toggleBeginner') {
      gameHandlers.handleToggleBeginner(msg, ws, clientRegistry, broadcastSystemMessage);
    } else if (type === 'chat') {
      gameHandlers.handleChat(msg, ws, clientRegistry, broadcastChat);
    } else if (type === 'sideBet') {
      gameHandlers.handleSideBet(msg, ws, clientRegistry, lobbyManager, broadcastChat, broadcastGameState);
    } else if (type === 'reveal') {
      gameHandlers.handleReveal(msg, ws, clientRegistry, lobbyManager, broadcastGameState);
    } else if (type === 'pause') {
      gameHandlers.handlePause(msg, ws, clientRegistry, lobbyManager, broadcastGameState, broadcastSystemMessage, timerUtils.clearAllTimers);
    } else if (type === 'resume') {
      gameHandlers.handleResume(msg, ws, clientRegistry, lobbyManager, broadcastGameState, broadcastSystemMessage, timerUtils.ensureTurnTimer);
    } else if (type === 'kickPlayer') {
      lobbyHandlers.handleKickPlayer(msg, ws, clientRegistry, lobbyManager, broadcastGameState, broadcastSystemMessage, broadcastLobbyList, broadcastOnlinePlayers);
    } else if (type === 'setPassword') {
      lobbyHandlers.handleSetPassword(msg, ws, clientRegistry, lobbyManager);
    } else if (type === 'getHandHistory') {
      lobbyHandlers.handleGetHandHistory(msg, ws, clientRegistry, lobbyManager);
    }
  };
}