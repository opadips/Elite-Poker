export function addChatMessage(chatMap, lobbyId, sender, message) {
  const chat = chatMap.get(lobbyId);
  if (chat) {
    chat.push({ sender, message, timestamp: Date.now() });
    if (chat.length > 200) chat.shift();
  }
}

export function getChatMessages(chatMap, lobbyId) {
  return chatMap.get(lobbyId) || [];
}