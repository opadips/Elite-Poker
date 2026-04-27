import { CHAT_HISTORY_SIZE } from './constants.js';

export function addChatMessage(chatMap, lobbyId, sender, message) {
  const chat = chatMap.get(lobbyId);
  if (chat) {
    chat.push({ sender, message, timestamp: Date.now() });
    if (chat.length > CHAT_HISTORY_SIZE) chat.shift();
  }
}

export function getChatMessages(chatMap, lobbyId) {
  return chatMap.get(lobbyId) || [];
}